/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, Invoice, AuditLog, CashierSession, PaymentTransaction } from '../types';
import { TrendingUp, Wallet, Landmark, AlertTriangle, ArrowUpRight, ArrowDownRight, Package, Lock, Calendar, Clock, Printer, X, AlertCircle, Download, Database, ChevronDown, ChevronUp, Check, Settings, RefreshCw, Layers, CheckCircle2, Activity, Edit, Trash2, Coins, RotateCcw, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-2">
        <p className="font-extrabold text-slate-305 text-slate-300 font-sans tracking-wide uppercase">{label}</p>
        <div className="border-t border-slate-800 my-1.5 pt-1.5 space-y-1">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-black text-white">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
        {payload[0] && payload[0].payload.count !== undefined && (
          <p className="text-[10px] text-indigo-300 font-bold font-mono">
            ⚡ {payload[0].payload.count} Nota Pemesanan
          </p>
        )}
      </div>
    );
  }
  return null;
};


interface DashboardProps {
  products: Product[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
  setActiveTab: (tab: string) => void;
  userRole?: 'KASIR' | 'OWNER' | 'PRODUKSI';
  onTriggerManualBackup?: () => void;
  lastSyncTime?: string;
  activeSession: CashierSession | null;
  paymentTransactions: PaymentTransaction[];
  onAddCustomTransaction?: (tx: PaymentTransaction) => void;
  onUpdateCustomTransaction?: (tx: PaymentTransaction) => void;
  onDeleteCustomTransaction?: (txId: string) => void;
}

export default function Dashboard({ 
  products, 
  invoices, 
  auditLogs, 
  setActiveTab, 
  userRole = 'OWNER', 
  onTriggerManualBackup, 
  lastSyncTime, 
  activeSession, 
  paymentTransactions,
  onAddCustomTransaction,
  onUpdateCustomTransaction,
  onDeleteCustomTransaction
}: DashboardProps) {
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [showPrintConfig, setShowPrintConfig] = React.useState(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState(() => {
    return localStorage.getItem('athree-printer-tujuan') || 'EPSON8BDF43 (L655 Series)';
  });
  const [selectedPages, setSelectedPages] = React.useState('Semua');
  const [selectedCopies, setSelectedCopies] = React.useState(1);
  const [selectedLayout, setSelectedLayout] = React.useState<'potret' | 'lanskap'>(() => {
    return (localStorage.getItem('athree-printer-layout') as 'potret' | 'lanskap') || 'potret';
  });
  const [selectedColor, setSelectedColor] = React.useState<'warna' | 'monokrom'>(() => {
    return (localStorage.getItem('athree-printer-warna') as 'warna' | 'monokrom') || 'warna';
  });
  const [showOtherSettings, setShowOtherSettings] = React.useState(false);
  const [isSimulatingPrint, setIsSimulatingPrint] = React.useState(false);

  // States for daily cash flow mutation form in Cashier Dashboard view
  const [mutationType, setMutationType] = React.useState<'PEMASUKAN' | 'PENGELUARAN'>('PEMASUKAN');
  const [mutationMethod, setMutationMethod] = React.useState<'CASH' | 'TRANSFER'>('CASH');
  const [mutationNotes, setMutationNotes] = React.useState('');
  const [mutationAmount, setMutationAmount] = React.useState('');
  const [mutationCustomer, setMutationCustomer] = React.useState('');
  const [isSubmittingMutation, setIsSubmittingMutation] = React.useState(false);
  const [mutationFilter, setMutationFilter] = React.useState<'SEMUA' | 'MASUK' | 'KELUAR'>('SEMUA');
  const [isMutationFormOpen, setIsMutationFormOpen] = React.useState(false);
  const [selectedMutationDate, setSelectedMutationDate] = React.useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });

  // States for Editing/Modifying Mutasi (Owner level)
  const [editingTransaction, setEditingTransaction] = React.useState<PaymentTransaction | null>(null);
  const [editAmount, setEditAmount] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');
  const [editCustomer, setEditCustomer] = React.useState('');
  const [editMethod, setEditMethod] = React.useState<'CASH' | 'TRANSFER'>('CASH');
  const [editType, setEditType] = React.useState<'DP' | 'PELUNASAN' | 'PENGELUARAN'>('PELUNASAN');
  const [editTimestamp, setEditTimestamp] = React.useState('');
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  // Load transaction values into edit form
  const handleStartEdit = (tx: PaymentTransaction) => {
    setEditingTransaction(tx);
    setEditAmount(tx.amount.toLocaleString('id-ID'));
    setEditNotes(tx.notes || '');
    setEditCustomer(tx.customerName || '');
    setEditMethod(tx.method);
    setEditType(tx.type);
    setEditTimestamp(tx.timestamp);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const parsedAmount = parseFloat(editAmount.replace(/[^0-9]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Harap masukkan nominal transaksi mutasi yang valid!");
      return;
    }
    if (!editNotes.trim()) {
      alert("Harap masukkan keterangan/keperluan mutasi!");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedTx: PaymentTransaction = {
        ...editingTransaction,
        amount: parsedAmount,
        method: editMethod,
        type: editType,
        notes: editNotes.trim(),
        customerName: editCustomer.trim() ? editCustomer.trim() : undefined,
        timestamp: editTimestamp || new Date().toISOString()
      };

      if (onUpdateCustomTransaction) {
        await onUpdateCustomTransaction(updatedTx);
      }
      setEditingTransaction(null);
    } catch (err) {
      console.error("Gagal mengubah transaksi:", err);
      alert("Gagal menyimpan perubahan transaksi!");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteMutationClick = async (txId: string) => {
    if (userRole !== 'OWNER') {
      alert("Hanya akun OWNER yang berwenang dalam memproses penghapusan transaksi buku mutasi harian!");
      return;
    }
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini akan dicatat di Log Audit.")) {
      try {
        if (onDeleteCustomTransaction) {
          await onDeleteCustomTransaction(txId);
        }
      } catch (err) {
        console.error("Gagal menghapus transaksi:", err);
        alert("Gagal menghapus transaksi!");
      }
    }
  };

  // Sales Performance Report States and Aggregations
  const [salesDateFilter, setSalesDateFilter] = React.useState<'ALL' | 'MONTH' | 'WEEK'>('ALL');
  const [selectedSalesCode, setSelectedSalesCode] = React.useState<string | null>(null);

  const [officialSalesList, setOfficialSalesList] = React.useState<{ code: string; name: string }[]>(() => {
    try {
      const saved = localStorage.getItem('athree_sales_agents');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { code: 'SL-01', name: 'Dewi Lestari' },
      { code: 'SL-02', name: 'Budi Hermawan' },
      { code: 'SL-03', name: 'Stephanus' },
      { code: 'SL-04', name: 'Martha Papua' }
    ];
  });

  React.useEffect(() => {
    const handleSyncSales = () => {
      try {
        const saved = localStorage.getItem('athree_sales_agents');
        if (saved) {
          setOfficialSalesList(JSON.parse(saved));
        }
      } catch (e) {}
    };
    window.addEventListener('athree-sales-agents-changed', handleSyncSales);
    return () => {
      window.removeEventListener('athree-sales-agents-changed', handleSyncSales);
    };
  }, []);

  const salesPerformanceData = React.useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const day = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);

    const filteredInvoices = invoices.filter(inv => {
      if (!inv.salesCode) return false;
      if (salesDateFilter === 'MONTH') {
        const invDate = new Date(inv.date);
        return invDate >= startOfMonth;
      }
      if (salesDateFilter === 'WEEK') {
        const invDate = new Date(inv.date);
        return invDate >= startOfWeek;
      }
      return true;
    });

    const groups: { [code: string]: { invoices: Invoice[]; totalAmount: number; totalPaid: number; totalQty: number; count: number } } = {};
    
    filteredInvoices.forEach(inv => {
      const code = inv.salesCode ? inv.salesCode.trim().toUpperCase() : 'UNKNOWN';
      if (!groups[code]) {
        groups[code] = {
          invoices: [],
          totalAmount: 0,
          totalPaid: 0,
          totalQty: 0,
          count: 0
        };
      }
      const paid = inv.downPayment + inv.settlement;
      groups[code].invoices.push(inv);
      groups[code].totalAmount += inv.totalAmount;
      groups[code].totalPaid += paid;
      groups[code].totalQty += inv.totalQty;
      groups[code].count += 1;
    });

    return Object.keys(groups).map(code => {
      const official = officialSalesList.find(s => s.code.toUpperCase() === code);
      return {
        code,
        name: official ? official.name : `Sales ${code} (Kustom)`,
        totalAmount: groups[code].totalAmount,
        totalPaid: groups[code].totalPaid,
        remainingDebt: Math.max(0, groups[code].totalAmount - groups[code].totalPaid),
        totalQty: groups[code].totalQty,
        count: groups[code].count,
        aov: groups[code].count > 0 ? groups[code].totalAmount / groups[code].count : 0,
        invoices: groups[code].invoices
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [invoices, salesDateFilter, officialSalesList]);

  // Export Sales Performance data to CSV
  const handleExportSalesCSV = () => {
    if (salesPerformanceData.length === 0) {
      alert("Tidak ada data laporan kinerja sales untuk diekspor!");
      return;
    }

    const headers = [
      "Peringkat",
      "Kode Sales",
      "Nama Sales Agent",
      "Jumlah Transaksi (Nota)",
      "Total Unit Terjual (pcs)",
      "Total Omset Bruto (IDR)",
      "Total Terbayar (IDR)",
      "Sisa Piutang Aktif (IDR)",
      "Rata-rata Nilai Transaksi / AOV (IDR)"
    ];

    const rows = salesPerformanceData.map((data, index) => [
      index + 1,
      data.code,
      data.name,
      data.count,
      data.totalQty,
      data.totalAmount,
      data.totalPaid,
      data.remainingDebt,
      Math.round(data.aov)
    ]);

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => {
        const strVal = String(val);
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(","))
    ].join("\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const filterLabel = salesDateFilter === 'ALL' ? 'Semua_Waktu' : salesDateFilter === 'MONTH' ? 'Bulan_Ini' : 'Minggu_Ini';
    const fileName = `Kinerja_Sales_${filterLabel}_${dateStr}.csv`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle manual mutation post on the cashier dashboard
  const handleAddMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(mutationAmount.replace(/[^0-9]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Harap masukkan nominal transaksi mutasi yang valid!");
      return;
    }
    if (!mutationNotes.trim()) {
      alert("Harap masukkan keterangan/keperluan mutasi!");
      return;
    }

    setIsSubmittingMutation(true);
    try {
      const txId = `tx-${Date.now()}`;
      const newTx: PaymentTransaction = {
        id: txId,
        amount: parsedAmount,
        method: mutationMethod,
        type: mutationType === 'PENGELUARAN' ? 'PENGELUARAN' : 'PELUNASAN',
        timestamp: new Date().toISOString(),
        cashier: userRole === 'OWNER' ? 'OWNER' : 'KASIR',
        notes: mutationNotes.trim(),
        customerName: mutationCustomer.trim() ? mutationCustomer.trim() : undefined
      };

      if (onAddCustomTransaction) {
        await onAddCustomTransaction(newTx);
      }
      
      // Resets
      setMutationAmount('');
      setMutationNotes('');
      setMutationCustomer('');
      setIsMutationFormOpen(false);
    } catch (err) {
      console.error("Gagal menambahkan mutasi:", err);
      alert("Gagal menambahkan mutasi kas harian!");
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const localProducts = localStorage.getItem('nota_stok_products') ? JSON.parse(localStorage.getItem('nota_stok_products')!) : products;
      const localInvoices = localStorage.getItem('nota_stok_invoices') ? JSON.parse(localStorage.getItem('nota_stok_invoices')!) : invoices;
      const localMovements = localStorage.getItem('nota_stok_movements') ? JSON.parse(localStorage.getItem('nota_stok_movements')!) : [];
      const localAuditLogs = localStorage.getItem('nota_stok_audit_logs') ? JSON.parse(localStorage.getItem('nota_stok_audit_logs')!) : auditLogs;

      const backupObject = {
        backupVersion: "1.0",
        exportedAt: new Date().toISOString(),
        exportedBy: userRole,
        data: {
          products: localProducts,
          invoices: localInvoices,
          movements: localMovements,
          auditLogs: localAuditLogs
        }
      };

      const jsonString = JSON.stringify(backupObject, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      link.href = url;
      link.download = `cadangan_sistem_pos_jersey_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal melakukan ekspor data:", error);
      alert("Terjadi kesalahan saat mengekspor data cadangan.");
    }
  };
  // Stats calculations
  // Calculations for daily cash inflow and outflow mutation (Berdasarkan Tanggal yang Dipilih)
  const todayTransactions = React.useMemo(() => {
    const [year, month, day] = selectedMutationDate.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    return paymentTransactions.filter(p => {
      try {
        const pDate = new Date(p.timestamp);
        return pDate.getTime() >= startOfDay.getTime() && pDate.getTime() <= endOfDay.getTime();
      } catch {
        return false;
      }
    });
  }, [paymentTransactions, selectedMutationDate]);

  // Load sessions from local storage to find Modal Awal (opening balance)
  const sessions = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('nota_stok_sessions_history');
      if (stored) {
        return JSON.parse(stored) as CashierSession[];
      }
    } catch (e) {
      console.error("Gagal memuat sessions history di Dashboard:", e);
    }
    return [];
  }, [selectedMutationDate, activeSession]);

  const modalAwal = React.useMemo(() => {
    const todayStrValue = new Date().toISOString().split('T')[0];
    if (selectedMutationDate === todayStrValue && activeSession) {
      return activeSession.openingBalance;
    }
    const matchedSession = sessions.find(s => {
      try {
        const sDate = new Date(s.openedAt).toISOString().split('T')[0];
        return sDate === selectedMutationDate;
      } catch {
        return false;
      }
    });
    if (matchedSession) {
      return matchedSession.openingBalance;
    }
    return 0; // fallback default
  }, [selectedMutationDate, activeSession, sessions]);

  const todayInflow = React.useMemo(() => {
    return todayTransactions
      .filter(p => p.type !== 'PENGELUARAN')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [todayTransactions]);

  const todayOutflow = React.useMemo(() => {
    return todayTransactions
      .filter(p => p.type === 'PENGELUARAN')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [todayTransactions]);

  const todayNetFlow = todayInflow - todayOutflow;
  const saldoHariIni = modalAwal + todayInflow - todayOutflow;

  // Real-time Cash Flows from active session
  const currentSessionPayments = activeSession
    ? paymentTransactions.filter(p => new Date(p.timestamp).getTime() >= new Date(activeSession.openedAt).getTime())
    : [];

  const sessionCashIn = currentSessionPayments
    .filter(p => p.type !== 'PENGELUARAN' && p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const sessionCashOut = currentSessionPayments
    .filter(p => p.type === 'PENGELUARAN' && p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const sessionTransferIn = currentSessionPayments
    .filter(p => p.type !== 'PENGELUARAN' && p.method === 'TRANSFER')
    .reduce((sum, p) => sum + p.amount, 0);

  const sessionTransferOut = currentSessionPayments
    .filter(p => p.type === 'PENGELUARAN' && p.method === 'TRANSFER')
    .reduce((sum, p) => sum + p.amount, 0);

  const sessionExpectedCash = activeSession
    ? activeSession.openingBalance + sessionCashIn - sessionCashOut
    : 0;

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalCashReceived = invoices.reduce((acc, inv) => acc + inv.downPayment + inv.settlement, 0);
  const totalReceivables = invoices.reduce((acc, inv) => acc + inv.remainingDebt, 0);
  const totalSoldQty = invoices.reduce((acc, inv) => acc + inv.totalQty, 0);
  
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const criticalProducts = products.filter(p => p.stock < 5);

  // Production Status counters
  const totalNotesCount = invoices.length;
  const antreanCount = invoices.filter(inv => !inv.productionStatus || inv.productionStatus === 'ANTREAN').length;
  const desainCount = invoices.filter(inv => inv.productionStatus === 'DESAIN').length;
  const prosesCount = invoices.filter(inv => inv.productionStatus === 'PROSES').length;
  const selesaiCount = invoices.filter(inv => inv.productionStatus === 'SELESAI').length;
  const siapAmbilCount = invoices.filter(inv => inv.productionStatus === 'SIAP_DIAMBIL').length;

  const totalSedangDiproses = antreanCount + desainCount + prosesCount;
  const totalSelesaiDanSiap = selesaiCount + siapAmbilCount;
  const completionPercentage = totalNotesCount > 0 ? Math.round((totalSelesaiDanSiap / totalNotesCount) * 100) : 0;

  const renderMutasiKasHarian = (showHeader: boolean = true) => {
    return (
      <div className="space-y-6" id="mutasi-kas-harian-panel">
        {showHeader && (
          <div className="border-b border-indigo-150 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">📋 FITUR TERINTEGRASI</span>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Buku Mutasi Kas Harian Toko
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Pantau real-time arus masuk &amp; pengeluaran operasional serta kelola mutasi kas harian secara lengkap
              </p>
            </div>
          </div>
        )}

        {/* Date Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-indigo-50">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-505 text-indigo-600" />
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Tanggal Buku Mutasi</label>
              <span className="text-sm font-bold text-slate-700">
                {new Date(selectedMutationDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Pilih Tanggal:</span>
            <input 
              type="date"
              value={selectedMutationDate}
              onChange={(e) => setSelectedMutationDate(e.target.value)}
              className="px-4 py-2 text-sm bg-white border-2 border-indigo-100 rounded-2xl text-slate-800 font-bold outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Section Summary Row (Bento Grid 4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Modal Awal */}
          <div className="bg-white border-2 border-indigo-50 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex-shrink-0">
              <Coins className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Modal Awal Sesi</span>
              <span className="text-xl font-black text-slate-800 font-mono mt-1 block">{formatRp(modalAwal)}</span>
              <span className="text-[10px] font-semibold text-slate-400">Saldo awal buka kasir</span>
            </div>
          </div>

          {/* 2. Total Pemasukan */}
          <div className="bg-white border-2 border-indigo-50 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex-shrink-0">
              <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Pemasukan</span>
              <span className="text-xl font-black text-emerald-650 font-mono mt-1 block">+{formatRp(todayInflow)}</span>
              <span className="text-[10px] font-semibold text-slate-400">Pemasukan &amp; Pelunasan</span>
            </div>
          </div>

          {/* 3. Total Pengeluaran */}
          <div className="bg-white border-2 border-indigo-50 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex-shrink-0">
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Pengeluaran</span>
              <span className="text-xl font-black text-rose-605 font-mono mt-1 block">-{formatRp(todayOutflow)}</span>
              <span className="text-[10px] font-semibold text-slate-405">Kas keluar operasional</span>
            </div>
          </div>

          {/* 4. Saldo Akhir Hari Ini */}
          <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 border-2 border-indigo-950 p-6 rounded-3xl shadow-md text-white flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="p-3 bg-white/10 text-emerald-400 rounded-2xl border border-white/10 flex-shrink-0">
              <Wallet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="relative z-10 w-full">
              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">Saldo Akhir Hari Ini</span>
              <span className="text-xl font-black text-white font-mono mt-1 block">{formatRp(saldoHariIni)}</span>
              <span className="text-[9px] font-bold text-emerald-300 block leading-tight mt-0.5">Modal + Masuk - Keluar</span>
            </div>
          </div>
        </div>

        {/* Quick mutation form + Ledger container */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left part: Today's Ledger table (3 cols) */}
          <div className="lg:col-span-3 bg-white border-2 border-indigo-100 rounded-[2rem] p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-50/50 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Buku Mutasi Hari Ini
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Daftar seluruh pemasukan &amp; pengeluaran kas khusus hari ini
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-indigo-50 p-1 rounded-xl self-start sm:self-auto">
                <button 
                  type="button"
                  onClick={() => setMutationFilter('SEMUA')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${mutationFilter === 'SEMUA' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  Semua ({todayTransactions.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setMutationFilter('MASUK')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${mutationFilter === 'MASUK' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  Masuk
                </button>
                <button 
                  type="button"
                  onClick={() => setMutationFilter('KELUAR')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${mutationFilter === 'KELUAR' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  Keluar
                </button>
              </div>
            </div>

            {/* Transactions list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-indigo-100 text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50/40">
                    <th className="px-3 py-3">Waktu</th>
                    <th className="px-3 py-3">Transaksi / Sumber</th>
                    <th className="px-3 py-3 text-center">Metode</th>
                    <th className="px-3 py-3 text-right">Nominal</th>
                    <th className="px-3 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 font-sans">
                  {todayTransactions
                    .filter(t => {
                      if (mutationFilter === 'MASUK') return t.type !== 'PENGELUARAN';
                      if (mutationFilter === 'KELUAR') return t.type === 'PENGELUARAN';
                      return true;
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-bold">
                          Belum ada mutasi tercatat hari ini.
                        </td>
                      </tr>
                    ) : (
                      todayTransactions
                        .filter(t => {
                          if (mutationFilter === 'MASUK') return t.type !== 'PENGELUARAN';
                          if (mutationFilter === 'KELUAR') return t.type === 'PENGELUARAN';
                          return true;
                        })
                        .map((t) => {
                          const dateObj = new Date(t.timestamp);
                          const timeStr = isNaN(dateObj.getTime()) ? '--:--' : dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                          const isExpense = t.type === 'PENGELUARAN';
                          return (
                            <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                              <td className="px-3 py-3 font-mono text-xs font-bold text-slate-400">
                                {timeStr}
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-bold text-slate-800 leading-tight">
                                  {t.notes || (isExpense ? 'Pengeluaran Manual' : 'Pemasukan')}
                                </div>
                                {t.customerName && (
                                  <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                    Pelanggan/Sumber: <strong className="text-indigo-650">{t.customerName}</strong>
                                  </div>
                                )}
                                {t.invoiceNum && (
                                  <div className="text-[10px] font-semibold text-indigo-500 mt-0.5">
                                    Nota Ref: {t.invoiceNum}
                                  </div>
                                )}
                                <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                                  Oleh: <strong className="text-slate-500 uppercase">{t.cashier || 'Sistem'}</strong>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${t.method === 'CASH' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                  {t.method === 'CASH' ? 'TUNAI' : 'TRANSFER'}
                                </span>
                              </td>
                              <td className={`px-3 py-3 text-right font-black font-mono text-xs ${isExpense ? 'text-rose-600' : 'text-emerald-650'}`}>
                                {isExpense ? '-' : '+'}{formatRp(t.amount)}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEdit(t)}
                                    title="Edit Mutasi"
                                    type="button"
                                    className="p-1.5 text-indigo-600 hover:text-indigo-805 hover:bg-indigo-50 rounded-xl transition cursor-pointer border border-transparent hover:border-indigo-100"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  {userRole === 'OWNER' ? (
                                    <button
                                      onClick={() => handleDeleteMutationClick(t.id)}
                                      title="Hapus Mutasi (Dapat dihapus oleh Owner)"
                                      type="button"
                                      className="p-1.5 text-rose-600 hover:text-rose-805 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-100"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span 
                                      className="p-1.5 text-slate-300 flex items-center justify-center cursor-not-allowed"
                                      title="Hanya Owner yang dapat menghapus mutasi"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right part: Quick Entry Form (2 cols) */}
          <div className="lg:col-span-2 bg-indigo-950 text-white rounded-[2rem] p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Catat Mutasi Kas Harian
                </h3>
                <p className="text-xs text-indigo-200/80 font-bold mt-1">
                  Tambahkan dana masuk atau keluar manual di luar transaksi nota
                </p>
              </div>

              <form onSubmit={handleAddMutation} className="space-y-4">
                {/* Mutation type radio switcher */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-indigo-900 rounded-2xl border border-indigo-800">
                  <button
                    type="button"
                    onClick={() => setMutationType('PEMASUKAN')}
                    className={`py-2 text-center text-xs font-black uppercase rounded-xl transition ${mutationType === 'PEMASUKAN' ? 'bg-emerald-500 text-white shadow-md' : 'text-indigo-200 hover:text-white'}`}
                  >
                    Kas Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setMutationType('PENGELUARAN')}
                    className={`py-2 text-center text-xs font-black uppercase rounded-xl transition ${mutationType === 'PENGELUARAN' ? 'bg-rose-500 text-white shadow-md' : 'text-indigo-200 hover:text-white'}`}
                  >
                    Kas Keluar
                  </button>
                </div>

                {/* Amount of money */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Nominal Uang (RUPIAH)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-indigo-300 font-mono">Rp</span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={mutationAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val) {
                          setMutationAmount(parseInt(val, 10).toLocaleString('id-ID'));
                        } else {
                          setMutationAmount('');
                        }
                      }}
                      className="w-full bg-indigo-900 text-white pl-10 pr-4 py-3 rounded-2xl border border-indigo-800 text-sm font-black font-mono focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                    />
                  </div>
                </div>

                {/* Method select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Metode Pembayaran</label>
                  <select
                    value={mutationMethod}
                    onChange={(e) => setMutationMethod(e.target.value as 'CASH' | 'TRANSFER')}
                    className="w-full bg-indigo-900 text-indigo-50 border border-indigo-800 px-3.5 py-3 rounded-2xl text-sm font-bold focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="CASH">💵 TUNAI (CASH)</option>
                    <option value="TRANSFER">🏦 TRANSFER BANK</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Keperluan / Keterangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beli bensin kurir, beli lakban"
                    value={mutationNotes}
                    onChange={(e) => setMutationNotes(e.target.value)}
                    className="w-full bg-indigo-900 text-white px-3.5 py-3 rounded-2xl border border-indigo-800 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                {/* Client name (optional) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Sumber / Nama Pelanggan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nama pelanggan/pihak ketiga"
                    value={mutationCustomer}
                    onChange={(e) => setMutationCustomer(e.target.value)}
                    className="w-full bg-indigo-900 text-white px-3.5 py-3 rounded-2xl border border-indigo-800 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingMutation}
                  className={`w-full py-4 mt-2 font-black rounded-2xl text-xs uppercase tracking-wider transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${mutationType === 'PENGELUARAN' ? 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-950/40 text-white border-2 border-rose-400/40' : 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-950/40 text-white border-2 border-emerald-400/40'}`}
                >
                  {isSubmittingMutation ? 'Memproses...' : mutationType === 'PENGELUARAN' ? 'Catat Kas Keluar 📤' : 'Catat Kas Masuk 📥'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Urgent deadlines: Production status is NOT finished and deadlineDate is today or past due
  const urgentDeadlines = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices.filter(inv => {
      const isCompleted = inv.productionStatus === 'SELESAI' || inv.productionStatus === 'SIAP_DIAMBIL';
      if (isCompleted) return false;
      if (!inv.deadlineDate) return false;

      try {
        const deadline = new Date(inv.deadlineDate);
        deadline.setHours(0, 0, 0, 0);
        return deadline.getTime() <= today.getTime();
      } catch {
        return false;
      }
    }).sort((a, b) => {
      return new Date(a.deadlineDate!).getTime() - new Date(b.deadlineDate!).getTime();
    });
  }, [invoices]);

  // Overdue invoices with remaining debt after 14 days
  const overdueInvoices = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices.filter(inv => {
      if (inv.remainingDebt <= 0) return false;
      if (!inv.date) return false;

      const invDate = new Date(inv.date);
      if (isNaN(invDate.getTime())) return false;
      invDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - invDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 14;
    });
  }, [invoices]);

  const totalOverdueDebt = overdueInvoices.reduce((acc, inv) => acc + inv.remainingDebt, 0);

  // Formatting currency
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Recent transactions
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  // Dynamic 6-month sliding window data for Recharts
  const monthlyData = React.useMemo(() => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const data = [];
    const today = new Date();
    
    // Generate the last 6 months list (ending in current month)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const label = `${monthNames[monthIdx]} ${year}`;
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      
      data.push({
        label,
        monthKey,
        omset: 0,
        kasMasuk: 0,
        count: 0
      });
    }

    // Accumulate invoice statistics
    invoices.forEach(inv => {
      if (!inv.date) return;
      const invDate = new Date(inv.date);
      if (isNaN(invDate.getTime())) return;
      
      const y = invDate.getFullYear();
      const m = invDate.getMonth() + 1;
      const invMonthKey = `${y}-${String(m).padStart(2, '0')}`;
      
      const point = data.find(p => p.monthKey === invMonthKey);
      if (point) {
        point.omset += inv.totalAmount;
        point.kasMasuk += (inv.downPayment + inv.settlement);
        point.count += 1;
      }
    });

    return data;
  }, [invoices]);

  const formatCompactRp = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Jt`;
    } else if (val >= 1000) {
      return `Rp ${(val / 1000).toFixed(0)} Rb`;
    }
    return `Rp ${val}`;
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Visual greeting card */}
      {userRole === 'OWNER' && (
        <div 
          className="p-8 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 to-indigo-600 border-b-4 border-indigo-200 shadow-xl relative overflow-hidden print:hidden"
          id="dashboard-header-card"
        >
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="px-4 py-1.5 text-xs font-black uppercase tracking-wider text-indigo-100 bg-indigo-650/80 rounded-full">
                Live Workshop Overview
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-3">
                Ringkasan Toko &amp; Bengkel Produksi
              </h1>
              <p className="text-indigo-100 text-sm mt-2 max-w-xl font-medium">
                Pantau nota pemesanan jersey, rincian pembayaran bertahap (DP), dan sinkronisasi stok barang secara real-time.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-indigo-50 font-bold border border-white/20">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                  Auto-Backup Aktif
                </span>
                {lastSyncTime && (
                  <span 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-full text-indigo-50 font-bold border border-white/20 shadow-sm transition-colors cursor-help"
                    title={`Data lokal di browser disinkronkan sepenuhnya pada ${new Date(lastSyncTime).toLocaleString('id-ID')}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-spin-slow" style={{ animationDuration: '4s' }} />
                    Terakhir Sinkron: {new Date(lastSyncTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
                {onTriggerManualBackup && (
                  <button 
                    onClick={onTriggerManualBackup}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-750 hover:bg-white hover:text-indigo-700 text-white font-extrabold rounded-full transition-all duration-150 border border-indigo-400/20 shadow-sm cursor-pointer"
                    title="Cadangkan stats saat ini ke penyimpanan lokal sekarang"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Cadangkan Sekarang
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto shrink-0">
              <button 
                id="btn-export-backup"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-black rounded-2xl shadow-lg shadow-emerald-900/20 text-xs uppercase tracking-wider border-2 border-emerald-400/40 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Ekspor Data Sistem
              </button>
              <button 
                id="btn-print-summary"
                onClick={() => setShowReportModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-750 hover:bg-indigo-800 text-white transition-all font-black rounded-2xl shadow-lg shadow-indigo-900/20 text-xs uppercase tracking-wider border-2 border-indigo-400/40 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Laporan
              </button>
              <button 
                id="btn-quick-new-note"
                onClick={() => setActiveTab('nota-baru')}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-amber-400 hover:bg-amber-500 transition-all font-black rounded-2xl shadow-lg shadow-indigo-600/40 text-slate-900 border-none text-xs uppercase tracking-wider italic cursor-pointer whitespace-nowrap"
              >
                Buat Nota Baru
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Compact Auto-Backup Banner */}
      {userRole !== 'OWNER' && (
        <div 
          className="p-5 rounded-[2rem] bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/10 border-2 border-emerald-100 dark:border-emerald-900/50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm print:hidden"
          id="cashier-backup-status"
        >
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="p-3.5 bg-emerald-505 bg-emerald-500 text-white rounded-2xl flex-shrink-0 relative">
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-300 rounded-full animate-ping" />
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
                  Sistem Pencadangan Otomatis Aktif
                </h4>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-150 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-md tracking-wider">AKTIF</span>
              </div>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/85 font-semibold leading-normal mt-0.5">
                Setiap transaksi kasir, perubahan data, dan nota baru dicadangkan otomatis secara real-time ke Cloud Firestore dan LocalStorage.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {lastSyncTime && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-black px-3 py-1.5 rounded-xl border border-emerald-150/60 dark:border-emerald-900 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-spin-slow" style={{ animationDuration: '6s' }} />
                Sinkron Terakhir: {new Date(lastSyncTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            {onTriggerManualBackup && (
              <button 
                type="button"
                onClick={onTriggerManualBackup}
                className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl text-[10px] uppercase tracking-wider border-none cursor-pointer transition shadow-xs whitespace-nowrap"
              >
                Sinkronkan Sekarang
              </button>
            )}
          </div>
        </div>
      )}

      {/* Critical Stock Alert Banner */}
      {criticalProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-[2rem] bg-rose-50 border-2 border-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm print:hidden"
          id="critical-stock-alert"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-500 text-white rounded-2xl border border-rose-400 flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-955 uppercase tracking-tight flex items-center gap-2">
                ⚠️ Peringatan Level Kritis: {criticalProducts.length} Barang Perlu Direstock
              </h4>
              <p className="text-xs text-rose-700 font-semibold leading-relaxed mt-1">
                Beberapa produk saat ini memiliki persediaan sangat tipis di bawah <strong className="underline">5 unit</strong>. Restock segera agar aktivitas sablon dan produksi berjalan lancar.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {criticalProducts.slice(0, 5).map(p => (
                  <span key={p.id} className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold px-2.5 py-1 rounded-xl border border-rose-200/50 flex items-center gap-1 animate-fade-in">
                    {p.name} (<strong className="font-mono text-xs">{p.stock}</strong> {p.unit})
                  </span>
                ))}
                {criticalProducts.length > 5 && (
                  <span className="text-[10px] bg-rose-200 text-rose-800 font-extrabold px-2.5 py-1 rounded-xl border border-rose-200/50">
                    +{criticalProducts.length - 5} produk lagi
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('stok-barang')}
            className="w-full md:w-auto px-6 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black rounded-2xl text-xs border-none cursor-pointer transition shadow-sm uppercase tracking-wider flex items-center justify-center gap-1.5 self-center"
          >
            Selesaikan / Restock
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Overdue Debt Alert Banner */}
      {userRole === 'OWNER' && overdueInvoices.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-[2rem] bg-amber-50/80 border-2 border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm print:hidden"
          id="overdue-debt-alert"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-500 text-slate-900 rounded-2xl border border-amber-400 flex-shrink-0 animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-955 uppercase tracking-tight flex items-center gap-2">
                ⏱️ Piutang Jatuh Tempo: {overdueInvoices.length} Nota Melewati Batas 14 Hari
              </h4>
              <p className="text-xs text-amber-800 font-semibold leading-relaxed mt-1">
                Terdapat sisa pembayaran belum dilunasi senilai <strong className="text-rose-600 underline font-mono">{formatRp(totalOverdueDebt)}</strong> pada beberapa nota yang telah berusia lebih dari 14 hari. Silakan hubungi pelanggan untuk penagihan.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {overdueInvoices.slice(0, 5).map(inv => {
                  const invDate = new Date(inv.date);
                  let delayDays = 0;
                  if (!isNaN(invDate.getTime())) {
                    const diffTime = new Date().getTime() - invDate.getTime();
                    delayDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  }
                  return (
                    <span 
                      key={inv.id} 
                      onClick={() => setActiveTab('daftar-nota')}
                      className="text-[10px] bg-white hover:bg-amber-100 text-amber-900 font-extrabold px-2.5 py-1 rounded-xl border border-amber-200/70 cursor-pointer flex items-center gap-1 transition duration-150 active:scale-95 shadow-sm"
                    >
                      Nota {inv.invoiceNum} ({inv.customerName}) — <strong className="text-rose-600 font-mono">{formatRp(inv.remainingDebt)}</strong> ({delayDays} hari)
                    </span>
                  );
                })}
                {overdueInvoices.length > 5 && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2.5 py-1 rounded-xl border border-amber-200">
                    +{overdueInvoices.length - 5} nota lagi
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('daftar-nota')}
            className="w-full md:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-2xl text-xs border-none cursor-pointer transition shadow-sm uppercase tracking-wider flex items-center justify-center gap-1.5 self-center"
          >
            Tagih / Lihat Nota
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Real-time Casher Active Session Monitor */}
      {activeSession ? (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2rem] bg-indigo-900 text-white shadow-xl relative overflow-hidden group print:hidden border-none"
          id="cashier-realtime-monitor-card"
        >
          {/* Glow ambient decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition duration-500" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-355 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Sesi Kasir Aktif ({activeSession.openedBy})
              </span>
              <h3 className="text-xl font-black font-sans tracking-tight">
                Monitor Laci Kas & Uang Fisik Terbuka
              </h3>
              <p className="text-xs text-indigo-200/90 font-semibold leading-relaxed max-w-2xl">
                Memantau laci uang fisik secara real-time berdasarkan transaksi hari ini. Kasir wajib mencocokkan uang fisik di laci agar sesuai dengan nilai <strong className="text-emerald-300 underline">Estimasi Uang Fisik</strong> di bawah ini.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('kasir-closingan')}
              className="self-start lg:self-auto px-5 py-3 bg-white hover:bg-indigo-50 text-indigo-950 font-extrabold rounded-2xl text-xs border-none cursor-pointer transition shadow-md uppercase tracking-wider flex items-center gap-1.5"
            >
              Selesaikan / Tutup Kasir
              <ArrowUpRight className="w-4 h-4 text-indigo-950" />
            </button>
          </div>

          {/* 4-Item Sub-Grid statistics inside the card for visual balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-800/60">
            {/* Modal Awal */}
            <div className="bg-indigo-950/45 p-4 rounded-2xl border border-indigo-800/50">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">💵 Modal Awal Tunai</span>
              <div className="text-lg font-black font-mono text-indigo-100">
                {formatRp(activeSession.openingBalance)}
              </div>
              <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Kas laci saat buka sesi</span>
            </div>

            {/* Cash In (Uang Masuk) */}
            <div className="bg-indigo-950/45 p-4 rounded-2xl border border-indigo-800/50">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">📥 Kas Masuk (Cash In)</span>
              <div className="text-lg font-black font-mono text-emerald-400 flex items-center gap-1">
                + {formatRp(sessionCashIn)}
              </div>
              <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Dari DP & pelunasan tunai</span>
            </div>

            {/* Cash Out (Uang Keluar) */}
            <div className="bg-indigo-950/45 p-4 rounded-2xl border border-indigo-800/50">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">📤 Kas Keluar (Cash Out)</span>
              <div className="text-lg font-black font-mono text-rose-400 flex items-center gap-1">
                - {formatRp(sessionCashOut)}
              </div>
              <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Pengeluaran operasional tunai</span>
            </div>

            {/* Estimasi Fisik Laci */}
            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/25">
              <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block mb-1">💰 Estimasi Uang Fisik</span>
              <div className="text-xl font-black font-mono text-emerald-300">
                {formatRp(sessionExpectedCash)}
              </div>
              <span className="text-[10px] text-emerald-300/80 font-bold mt-1 block">Wajib Cocok di Sesi Kas laci</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-[2rem] bg-white border-2 border-indigo-55 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm print:hidden"
          id="no-active-session-alert"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 flex-shrink-0">
              <Lock className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                🔒 Sesi Laci Kasir Belum Dibuka
              </h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Laci cash register masih terkunci. Harap buka sesi kasir harian agar Anda dapat melacak setoran masuk, mengelola pengeluaran laci (Cash In & Cash Out), serta mencocokkan uang fisik di akhir giliran kerja.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('kasir-closingan')}
            className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-2xl text-xs border-none cursor-pointer transition shadow-sm uppercase tracking-wider flex items-center justify-center gap-1.5 self-center"
          >
            Buka Sesi Kasir
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Kartu Ringkasan Status Produksi / Volume Kerja Aktif */}
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-[2rem] bg-white border-2 border-indigo-50 shadow-sm print:hidden"
        id="production-status-summary-card"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-indigo-50/50">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              🛠️ Volume Kerja &amp; Status Produksi Aktif
            </h4>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Pantau langsung jumlah nota yang sedang diproses vs yang sudah selesai untuk mengelola kapasitas tim kerja.
            </p>
          </div>
          <span className="text-xs font-mono font-extrabold text-indigo-600 bg-indigo-50 dark:bg-slate-800 py-1.5 px-3.5 rounded-full select-none">
            {totalNotesCount} Total Nota Transaksi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Ongoing Work: Columns 5 */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                ⚙️ Sedang Diproses (Active Work)
              </span>
              <span className="text-2xl font-black text-slate-800 font-mono">
                {totalSedangDiproses} <span className="text-xs font-medium text-slate-400">Nota</span>
              </span>
            </div>
            
            {/* Subsection progress for Antrean, Desain, Proses */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-2xl border border-indigo-50/30">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">⏳ ANTREAN</span>
                <span className="text-lg font-black text-slate-700 font-mono">{antreanCount}</span>
              </div>
              <div className="bg-indigo-50/15 dark:bg-slate-850 p-2.5 rounded-2xl border border-indigo-55/30">
                <span className="text-[10px] font-bold text-indigo-500 block mb-1">🎨 DESAIN</span>
                <span className="text-lg font-black text-indigo-700 font-mono">{desainCount}</span>
              </div>
              <div className="bg-amber-50/15 dark:bg-slate-850 p-2.5 rounded-2xl border border-amber-50/30">
                <span className="text-[10px] font-bold text-amber-500 block mb-1">⚙️ PROSES</span>
                <span className="text-lg font-black text-amber-650 font-mono">{prosesCount}</span>
              </div>
            </div>
          </div>

          {/* Progress bar visualizer: Columns 2 */}
          <div className="md:col-span-2 flex flex-col justify-center items-center py-4 md:py-0 border-y md:border-y-0 md:border-x border-indigo-50/50">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rasio Selesai</span>
              <div className="text-3xl font-black text-emerald-650 font-mono leading-none">{completionPercentage}%</div>
              
              <div className="w-28 bg-slate-100 rounded-full h-2 mt-2.5 mx-auto relative overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Completed Work: Columns 5 */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                ✅ Selesai (Completed / Ready)
              </span>
              <span className="text-2xl font-black text-slate-800 font-mono">
                {totalSelesaiDanSiap} <span className="text-xs font-medium text-slate-400">Nota</span>
              </span>
            </div>

            {/* Subsection progress for Selesai, Siap Diambil */}
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="bg-emerald-50/15 dark:bg-slate-850 p-2.5 rounded-2xl border border-emerald-50/30">
                <span className="text-[10px] font-bold text-emerald-650 block mb-1">✅ SELESAI</span>
                <span className="text-lg font-black text-emerald-700 font-mono">{selesaiCount}</span>
              </div>
              <div className="bg-blue-50/15 dark:bg-slate-850 p-2.5 rounded-2xl border border-blue-50/30">
                <span className="text-[10px] font-bold text-blue-600 block mb-1">📦 SIAP DIAMBIL</span>
                <span className="text-lg font-black text-blue-700 font-mono">{siapAmbilCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Volume Interactive Recommendation Action details */}
        <div className="mt-5 pt-4 border-t border-indigo-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Activity className="w-4 h-4 text-indigo-500 stroke-[2.5]" />
            <span>
              {totalSedangDiproses > 5 ? (
                <span>⚠️ Kapasitas produksi sedang padat (<strong className="text-rose-600">{totalSedangDiproses} pekerjaan aktif</strong>). Atur jadwal kerja lembur atau prioritas deadline hari ini.</span>
              ) : totalSedangDiproses > 0 ? (
                <span>👍 Volume kerja moderat ({totalSedangDiproses} aktif). Fokus menyelesaikan antrean saat ini sebelum menerima order mendesak baru.</span>
              ) : (
                <span>✨ Semua pesanan telah diselesaikan! Siap menerima volume order baru secara optimal.</span>
              )}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('daftar-nota')}
            className="w-full sm:w-auto px-4.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl text-xs cursor-pointer select-none transition border-none flex items-center gap-1 self-end sm:self-auto justify-center"
          >
            Atur Prioritas Sifat Produksi
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Mutasi Kas Harian Panel (Special screen for KASIR role, now simplified using helper) */}
      {userRole === 'KASIR' ? (
        renderMutasiKasHarian(false)
      ) : (
        <div className="space-y-6 print:hidden">
          {/* Primary Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
            
            {/* Total Omset */}
            <motion.div 
              className="p-6 rounded-3xl bg-white border-2 border-indigo-50 flex items-start gap-4 shadow-sm"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl border border-green-100">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Penjualan (Omset)</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                  {userRole !== 'OWNER' ? (
                    <span className="text-sm font-black text-slate-400 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">🔒 Akses Owner</span>
                  ) : (
                    formatRp(totalRevenue)
                  )}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                  Dari <span className="font-bold text-indigo-600">{invoices.length}</span> nota pemesanan
                </span>
              </div>
            </motion.div>

            {/* Total Kas Masuk */}
            <motion.div 
              className="p-6 rounded-3xl bg-white border-2 border-indigo-50 flex items-start gap-4 shadow-sm"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kas Masuk</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                  {userRole !== 'OWNER' ? (
                    <span className="text-sm font-black text-slate-400 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">🔒 Akses Owner</span>
                  ) : (
                    formatRp(totalCashReceived)
                  )}
                </h3>
                <div className="w-full bg-indigo-50 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full" 
                    style={{ width: `${userRole === 'OWNER' && totalRevenue > 0 ? (totalCashReceived / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 font-medium flex justify-between mt-1">
                  <span>Efektivitas Pelunasan</span>
                  <span className="font-bold text-indigo-600">
                    {userRole !== 'OWNER' ? '🔒' : `${totalRevenue > 0 ? Math.round((totalCashReceived / totalRevenue) * 100) : 0}%`}
                  </span>
                </span>
              </div>
            </motion.div>

            {/* Sisa Piutang */}
            <motion.div 
              className={`p-6 rounded-3xl flex items-start gap-4 transition-all duration-300 cursor-pointer ${
                userRole === 'OWNER' && totalReceivables > 0 
                  ? 'bg-[#FF6B6B] text-white shadow-lg border-none' 
                  : 'bg-white border-2 border-indigo-50 text-slate-700 shadow-sm'
              }`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveTab('daftar-nota')}
            >
              <div className={`p-3.5 rounded-2xl ${
                userRole === 'OWNER' && totalReceivables > 0
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-amber-50 text-amber-600 rounded-2xl border border-amber-100'
              }`}>
                <Landmark className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <p className={`text-xs font-bold uppercase tracking-wider ${userRole === 'OWNER' && totalReceivables > 0 ? 'text-white/85' : 'text-slate-400'}`}>Total Piutang Usaha</p>
                  {userRole === 'OWNER' && overdueInvoices.length > 0 && (
                    <span className="animate-pulse bg-white text-rose-600 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md border border-rose-100 flex items-center gap-0.5">
                      ⏱️ {overdueInvoices.length} Jatuh Tempo
                    </span>
                  )}
                </div>
                <h3 className={`text-2xl font-black tracking-tight mt-1 ${userRole === 'OWNER' && totalReceivables > 0 ? 'text-white' : 'text-slate-800'}`}>
                  {userRole !== 'OWNER' ? (
                    <span className="text-sm font-black text-slate-400 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">🔒 Akses Owner</span>
                  ) : (
                    formatRp(totalReceivables)
                  )}
                </h3>
                <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${userRole === 'OWNER' && totalReceivables > 0 ? 'text-white/90' : 'text-slate-400'}`}>
                  ● {userRole !== 'OWNER' ? 'Hak akses terbatas (Khusus Owner)' : overdueInvoices.length > 0 ? `${overdueInvoices.length} nota jatuh tempo (>14 hari)!` : totalReceivables > 0 ? 'Ada tagihan aktif belum lunas' : 'Seluruh piutang lunas'}
                </span>
              </div>
            </motion.div>

            {/* Peringatan Deadline Produksi */}
            <motion.div 
              className={`p-6 rounded-3xl flex items-start gap-4 transition-all duration-300 cursor-pointer ${
                urgentDeadlines.length > 0 
                  ? 'bg-rose-600 text-white shadow-lg border-none' 
                  : 'bg-white border-2 border-indigo-50 text-slate-700 shadow-sm'
              }`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveTab('daftar-nota')}
            >
              <div className={`p-3.5 rounded-2xl ${
                urgentDeadlines.length > 0
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}>
                <Clock className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                   <p className={`text-xs font-bold uppercase tracking-wider ${urgentDeadlines.length > 0 ? 'text-white/85' : 'text-slate-400'}`}>Deadline Jatuh Tempo</p>
                   {urgentDeadlines.length > 0 && (
                     <span className="animate-pulse bg-white text-rose-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                       🚨 URGENT
                     </span>
                   )}
                </div>
                <h3 className={`text-2xl font-black tracking-tight mt-1 ${urgentDeadlines.length > 0 ? 'text-white' : 'text-slate-800'}`}>
                  {urgentDeadlines.length} <span className={`text-xs font-semibold ${urgentDeadlines.length > 0 ? 'text-white/80' : 'text-slate-404'}`}>Pekerjaan</span>
                </h3>
                <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${urgentDeadlines.length > 0 ? 'text-white/95' : 'text-slate-400'}`}>
                  {urgentDeadlines.length > 0 ? (
                    <span>Segera proses &amp; selesaikan!</span>
                  ) : (
                    <span>Semua deadline produksi aman</span>
                  )}
                </span>
              </div>
            </motion.div>

          </div>

          {/* Buku Mutasi Kas Harian (RENDERED FOR OWNER) */}
          {userRole === 'OWNER' && (
            <div className="bg-slate-50/40 border-2 border-indigo-100/50 rounded-[2.5rem] p-6 shadow-sm">
              {renderMutasiKasHarian(true)}
            </div>
          )}

        </div>
      )}

      {/* Two Columns Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 print:hidden">
        
        {/* Left Column: Recent Notes (3 columns wide) */}
        <div className="lg:col-span-3 space-y-4" id="recent-notes-column">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Daftar Nota Penjualan Terbaru</h2>
            <button 
              id="view-all-notes"
              onClick={() => setActiveTab('daftar-nota')}
              className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wider transition-colors flex items-center gap-1 hover:underline"
            >
              Lihat Semua
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-md" id="table-recent-notes">
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-indigo-100 text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50/50">
                    <th className="px-5 py-4">No. Nota</th>
                    <th className="px-5 py-4">Pemesanan / Tim</th>
                    <th className="px-5 py-4 text-right">Total Tagihan</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-center">Produksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50">
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-bold">
                        Belum ada data nota transaksi.
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        className="hover:bg-indigo-50/20 transition-colors cursor-pointer"
                        onClick={() => setActiveTab('daftar-nota')}
                      >
                        <td className="px-5 py-4.5 font-mono text-indigo-600 font-black">
                          {inv.invoiceNum}
                        </td>
                        <td className="px-5 py-4.5">
                          <div className="font-bold text-slate-800">{inv.customerName}</div>
                          <div className="text-[11px] text-slate-400 font-bold">{new Date(inv.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>
                        </td>
                        <td className="px-5 py-4.5 text-right font-black text-slate-800">
                          {formatRp(inv.totalAmount)}
                        </td>
                        <td className="px-5 py-4.5 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-black rounded-full ${
                            inv.status === 'LUNAS' 
                              ? 'bg-green-100 text-green-700' 
                              : inv.status === 'DP' 
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {inv.customStatusLabel || inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black rounded-full ${
                            (inv.productionStatus || 'ANTREAN') === 'ANTREAN'
                              ? 'bg-slate-100 text-slate-705'
                              : (inv.productionStatus || 'ANTREAN') === 'DESAIN'
                              ? 'bg-amber-100 text-amber-700'
                              : (inv.productionStatus || 'ANTREAN') === 'PROSES'
                              ? 'bg-indigo-100 text-indigo-700'
                              : (inv.productionStatus || 'ANTREAN') === 'SELESAI'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-green-150/80 text-green-700'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {(inv.productionStatus || 'ANTREAN')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Key/Quick Production Deadlines (2 columns wide) */}
        <div className="lg:col-span-2 space-y-4" id="quick-deadline-column">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Tenggat Batas Pekerjaan
            </h2>
            <button 
              id="view-all-deadlines"
              onClick={() => setActiveTab('daftar-nota')}
              className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wider hover:underline"
            >
              Lihat Nota
            </button>
          </div>

          <div className="p-6 bg-white border-2 border-indigo-100 rounded-3xl shadow-md space-y-4 min-h-[220px]" id="quick-deadline-card">
            {urgentDeadlines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 border border-green-100 flex items-center justify-center mb-3 text-2xl font-black">
                  ✓
                </div>
                <p className="text-sm font-black text-slate-700">Deadline Aman Terkendali</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada pekerjaan produksi aktif yang melewati batas tenggat hari ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentDeadlines.slice(0, 4).map((inv) => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const deadline = new Date(inv.deadlineDate!);
                  deadline.setHours(0,0,0,0);
                  const diffTime = deadline.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isOverdue = diffDays < 0;
                  const isToday = diffDays === 0;

                  return (
                    <div 
                      key={inv.id} 
                      className={`p-4 border rounded-2xl transition-all duration-205 flex items-center justify-between gap-3 cursor-pointer ${
                        isOverdue 
                          ? 'bg-rose-50/60 hover:bg-rose-50 border-rose-200 shadow-sm' 
                          : isToday
                          ? 'bg-amber-50/60 hover:bg-amber-100 border-amber-200'
                          : 'bg-indigo-50/30 hover:bg-indigo-50/60 border-indigo-50/50'
                      }`}
                      onClick={() => setActiveTab('daftar-nota')}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-indigo-600 font-extrabold">{inv.invoiceNum}</span>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                            (inv.productionStatus || 'ANTREAN') === 'ANTREAN'
                              ? 'bg-slate-100 text-slate-700'
                              : (inv.productionStatus || 'ANTREAN') === 'DESAIN'
                              ? 'bg-amber-100 text-amber-700'
                              : (inv.productionStatus || 'ANTREAN') === 'PROSES'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}>
                            {(inv.productionStatus || 'ANTREAN')}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate mt-1">{inv.customerName}</p>
                        <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{inv.notes || 'Pemesanan Jersey'}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-black rounded-full uppercase tracking-wider ${
                          isOverdue 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' 
                            : isToday
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {isOverdue 
                            ? `Overdue ${Math.abs(diffDays)} H` 
                            : isToday
                            ? 'Hari Ini'
                            : `${diffDays} Hari Lagi`
                          }
                        </span>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">
                          {new Date(inv.deadlineDate!).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {urgentDeadlines.length > 4 && (
                  <div className="text-center pt-2">
                    <span 
                      onClick={() => setActiveTab('daftar-nota')}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      dan {urgentDeadlines.length - 4} pekerjaan lainnya...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Monthly Financial Trend Section */}
      {userRole === 'OWNER' && (
        <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-6 shadow-md relative overflow-hidden print:hidden" id="financial-trend-card">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Tren Finansial &amp; Omset Bulanan
              </h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                Grafik perbandingan total pesanan masuk (omset) vs. uang tunai riil yang diterima (DP + Pelunasan)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-50">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Total Omset
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-50">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Kas Terealisasi
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="relative min-h-[300px] w-full" id="chart-panel">
            {/* The Real Recharts Area Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorKas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCompactRp}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Area 
                    type="monotone" 
                    name="Total Omset" 
                    dataKey="omset" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorOmset)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  
                  <Area 
                    type="monotone" 
                    name="Kas Terealisasi" 
                    dataKey="kasMasuk" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorKas)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Laporan Kinerja Penjualan Per Sales (RENDERED FOR OWNER) */}
      {userRole === 'OWNER' && (
        <div className="bg-white border-2 border-indigo-100 rounded-[2.5rem] p-6 shadow-md relative overflow-hidden print:hidden mt-6" id="sales-performance-card">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Laporan Kinerja Penjualan per Sales
              </h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                Monitor performa omset, komparasi penjualan, total kuintansi, sisa piutang, dan efektivitas masing-masing Sales Agent resmi.
              </p>
            </div>
            
            {/* Filter buttons & Export button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-center">
              {/* Filter buttons */}
              <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-2xl border border-slate-200/60 shrink-0">
                <button
                  onClick={() => setSalesDateFilter('ALL')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all duration-150 cursor-pointer border-none ${
                    salesDateFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua Waktu
                </button>
                <button
                  onClick={() => setSalesDateFilter('MONTH')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all duration-150 cursor-pointer border-none ${
                    salesDateFilter === 'MONTH'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  onClick={() => setSalesDateFilter('WEEK')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all duration-150 cursor-pointer border-none ${
                    salesDateFilter === 'WEEK'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Minggu Ini
                </button>
              </div>

              {/* Export Button */}
              {salesPerformanceData.length > 0 && (
                <button
                  onClick={handleExportSalesCSV}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50 focus:bg-emerald-55 font-extrabold text-xs uppercase tracking-wider cursor-pointer rounded-2xl transition-all shadow-xs"
                  id="btn-export-sales-csv"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Aggregated Performance Metric Cards */}
          {salesPerformanceData.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">Belum ada nota penjualan dengan Kode Sales terdaftar</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-normal font-medium">
                Pastikan Anda menginput Kode Sales pada saat membuat Nota Pemesanan Baru agar performa masing-masing tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Table of performance (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-850 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-755 bg-slate-100/80 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-3.5">Kode / Nama Sales</th>
                          <th className="px-4 py-3.5 text-center">Jumlah Nota</th>
                          <th className="px-4 py-3.5 text-right">Total Qty</th>
                          <th className="px-4 py-3.5 text-right">Total Omset</th>
                          <th className="px-4 py-3.5 text-right">Sisa Piutang</th>
                          <th className="px-4 py-3.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {salesPerformanceData.map((data, index) => {
                          const isSelected = selectedSalesCode === data.code;
                          return (
                            <tr 
                              key={data.code} 
                              className={`hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 transition cursor-pointer ${
                                isSelected ? 'bg-indigo-55/10 dark:bg-indigo-950/20 border-l-4 border-indigo-500 font-bold' : ''
                              }`}
                              onClick={() => setSelectedSalesCode(isSelected ? null : data.code)}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-650 text-white flex items-center justify-center font-black text-xs shadow-xs uppercase shrink-0">
                                    {data.code.slice(0, 2)}
                                  </div>
                                  <div className="truncate">
                                    <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight flex items-center gap-1.5 truncate">
                                      {data.name}
                                      {index === 0 && (
                                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[8px] font-black tracking-widest uppercase shrink-0">TOP🌟</span>
                                      )}
                                    </div>
                                    <div className="text-slate-450 dark:text-slate-400 font-mono font-bold mt-0.5 tracking-wider text-[10px]">
                                      KODE: {data.code}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center font-mono font-black text-slate-700 dark:text-slate-350 text-sm">
                                {data.count}
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-extrabold text-slate-600 dark:text-slate-400">
                                {data.totalQty.toLocaleString('id-ID')} pcs
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-black text-emerald-650 dark:text-emerald-500 text-sm">
                                {data.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-black">
                                {data.remainingDebt > 0 ? (
                                  <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-100/30 text-[11px]">
                                    {data.remainingDebt.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg text-[11px]">Lunas</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSalesCode(isSelected ? null : data.code);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl font-bold font-sans text-[10px] uppercase transition-all tracking-wider border-none cursor-pointer ${
                                    isSelected 
                                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-750' 
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                  }`}
                                >
                                  {isSelected ? 'Tutup detail' : 'Detail'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-table showing individual invoices of selected sales code */}
                {selectedSalesCode && (() => {
                  const selectedData = salesPerformanceData.find(d => d.code === selectedSalesCode);
                  if (!selectedData) return null;
                  return (
                    <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-[2rem] border border-slate-150 dark:border-slate-850 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Dokumen Transaksi Dijual Oleh</h4>
                          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight block mt-0.5">
                            {selectedData.name} ({selectedData.code})
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedSalesCode(null)}
                          className="text-[10px] px-3 py-1.5 uppercase tracking-wider font-extrabold bg-slate-200/85 hover:bg-slate-300/85 cursor-pointer rounded-xl text-slate-700 border-none transition"
                        >
                          Tutup Detail
                        </button>
                      </div>

                      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-750 rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto font-sans">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                                <th className="px-4 py-3">No. Nota</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Nama Pelanggan</th>
                                <th className="px-4 py-3 text-right">Invoice Total</th>
                                <th className="px-4 py-3 text-right">Uang Masuk</th>
                                <th className="px-4 py-3 text-right">Sisa Piutang</th>
                                <th className="px-4 py-3 text-center">Status Produksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {selectedData.invoices.map(inv => {
                                const totalPaid = inv.downPayment + inv.settlement;
                                return (
                                  <tr key={inv.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3.5 font-mono font-black text-indigo-700">{inv.invoiceNum}</td>
                                    <td className="px-4 py-3.5 font-bold text-slate-500">{inv.date}</td>
                                    <td className="px-4 py-3.5 font-black text-slate-800 max-w-[150px] truncate">{inv.customerName}</td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">
                                      {inv.totalAmount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                                      {totalPaid.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold">
                                      {inv.remainingDebt > 0 ? (
                                        <span className="text-rose-600">{inv.remainingDebt.toLocaleString('id-ID')}</span>
                                      ) : (
                                        <span className="text-emerald-600 font-extrabold">Lunas</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                        inv.productionStatus === 'SELESAI' || inv.productionStatus === 'SIAP_DIAMBIL'
                                          ? 'bg-emerald-55/65 text-emerald-700'
                                          : inv.productionStatus === 'ANTREAN'
                                          ? 'bg-slate-100 text-slate-500'
                                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100/40'
                                      }`}>
                                        {inv.productionStatus || 'ANTREAN'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Comparative Graph and Visual Metrics (lg:col-span-4) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-[2rem] border border-slate-100 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase">Komposisi Kontribusi Omset</h3>
                    <p className="text-[10.5px] text-slate-450 mt-0.5 leading-normal">
                      Membandingkan pencapaian omset bruto dari masing-masing sales pada rentang waktu terpilih.
                    </p>
                  </div>

                  {/* Built-in high-contrast comparison scale bars */}
                  <div className="space-y-3.5">
                    {(() => {
                      const maxAmount = Math.max(...salesPerformanceData.map(d => d.totalAmount || 1));
                      return salesPerformanceData.map((data, idx) => {
                        const ratio = (data.totalAmount / maxAmount) * 100;
                        const colors = [
                          'from-indigo-500 to-indigo-650',
                          'from-purple-500 to-purple-650',
                          'from-sky-500 to-sky-650',
                          'from-emerald-500 to-emerald-650'
                        ];
                        const barColor = colors[idx % colors.length];

                        return (
                          <div key={data.code} className="space-y-1 font-sans">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-slate-700 dark:text-slate-300">{data.name}</span>
                              <span className="font-mono font-black text-slate-950 dark:text-slate-100 tracking-tight">
                                {data.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-150 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>Nota: {data.count}</span>
                              <span>AOV: {data.aov.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Performance Insight Box */}
                <div className="p-5 bg-indigo-50/20 dark:bg-slate-850 rounded-[2rem] border border-indigo-100/40 space-y-2.5 font-sans">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <span className="text-base">💡</span>
                    <h4 className="text-xs font-black uppercase tracking-wider">Ringkasan Insight Owner</h4>
                  </div>
                  <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-semibold">
                    {(() => {
                      const topAgent = salesPerformanceData[0];
                      const totalInvoiced = salesPerformanceData.reduce((acc, d) => acc + d.totalAmount, 0);
                      if (!topAgent) return 'Belum ada data untuk menghasilkan ringkasan visual.';
                      return `Sales Agent terkemuka saat ini adalah ${topAgent.name} (${topAgent.code}) dengan kontribusi Rp ${topAgent.totalAmount.toLocaleString('id-ID')}, menyumbang ${Math.round((topAgent.totalAmount / (totalInvoiced || 1)) * 100)}% dari total penjualan pada periode filter berjalan.`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide Modal: Print Monthly Sales Report */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="report-print-modal-overlay">
          <div 
            className="bg-white border-2 border-indigo-100 rounded-3xl w-full max-w-4xl transition-all duration-300 shadow-2xl relative overflow-hidden my-8" 
            id="report-print-modal-box"
          >
            {/* Top Bar for Screen Preview (Hidden on print) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-6 py-4 bg-indigo-50/50 border-b border-indigo-100/80 print:hidden gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-mono">
                  A4 REPORT
                </span>
                <span className="text-xs font-bold text-slate-500 font-sans">Pratinjau Cetak Penjualan Bulanan</span>
              </div>
              
              <div className="flex items-center gap-2 self-end">
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                  💡 Tombol Cetak Ada Di Bawah
                </span>

                <button
                  id="report-btn-close"
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl border-none cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print advice warning (hidden in print) */}
            <div className="px-6 py-3 bg-indigo-50/20 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-650 print:hidden">
              <AlertCircle className="w-4 h-4 text-indigo-505 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-slate-600 leading-normal font-sans">
                <strong className="text-indigo-700">Pratinjau Kertas:</strong> Layout di bawah diformat khusus untuk kertas <strong className="underline">A4 Potret</strong>. Semua elemen navigasi &amp; tombol aksi otomatis disembunyikan saat dicetak.
              </p>
            </div>

            {/* Printable Content Frame */}
            <div 
              className="space-y-6 bg-white text-slate-800 font-sans print:bg-white print:text-black print:p-0 p-6 md:p-8" 
              id="printable-report-sheet"
            >
              {/* letterhead */}
              <div className="flex flex-col sm:flex-row justify-between border-b-2 border-slate-200 pb-5 items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-indigo-900 uppercase print:text-black">A3 WORKSHOP &amp; JERSEY SABLON</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">Sistem Administrasi POS &amp; Bengkel Produksi Jersey Custom</p>
                  <p className="text-[10px] text-slate-400 font-mono">Jl. Raya Jeruk, Kec. Manis, Indonesia | Telp: 0812-3456-7890</p>
                </div>
                <div className="text-left sm:text-right font-mono text-[10px] text-slate-504 space-y-0.5">
                  <div><strong>KATEGORI LAPORAN:</strong> Ringkasan Finansial Bulanan</div>
                  <div><strong>TANGGAL CETAK:</strong> {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>KASIR AKTIF:</strong> {userRole === 'OWNER' ? 'Owner / Pengelola' : 'Staf Kasir'}</div>
                </div>
              </div>

              {/* Title heading on sheet */}
              <div className="text-center space-y-1 py-1">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase print:text-black">LAPORAN RINGKASAN REKAPITULASI OMSET &amp; PIUTANG</h2>
                <p className="text-xs text-slate-400 font-semibold">Toko &amp; Bengkel Jersey - Periode Analisis Jendela Tren 6 Bulan Terakhir</p>
              </div>

              {/* Metrics block inside print page (using 4 bordered boxes) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 print:bg-white print:border-slate-300">
                  <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Total Omset</span>
                  <div className="text-base font-black text-slate-800 mt-1 print:text-black">{formatRp(totalRevenue)}</div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{invoices.length} Nota Terbit</span>
                </div>
                <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 print:bg-white print:border-slate-300">
                  <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Kas Masuk (DP+Lunas)</span>
                  <div className="text-base font-black text-emerald-750 mt-1 print:text-black">{formatRp(totalCashReceived)}</div>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Rasio: {totalRevenue > 0 ? Math.round((totalCashReceived / totalRevenue) * 100) : 0}%</span>
                </div>
                <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 print:bg-white print:border-slate-300">
                  <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Sisa Piutang Usaha</span>
                  <div className="text-base font-black text-rose-600 mt-1 print:text-black">{formatRp(totalReceivables)}</div>
                  <span className="text-[9px] text-rose-600 font-bold block mt-0.5">Belum Dilunasi</span>
                </div>
                <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 print:bg-white print:border-slate-300">
                  <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Volume Terjual</span>
                  <div className="text-base font-black text-indigo-705 mt-1 print:text-black">{totalSoldQty} <span className="text-[10px] text-slate-400 font-medium">unit</span></div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Rata-rata: {invoices.length > 0 ? formatRp(Math.round(totalRevenue / invoices.length)) : 'Rp 0'} / Nota</span>
                </div>
              </div>

              {/* Monthly breakdown table */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider print:text-black">1. Rincian Tren Finansial Bulanan</h3>
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 print:bg-slate-100">
                      <th className="p-2 border-r border-slate-200">Bulan Periode</th>
                      <th className="p-2 text-center border-r border-slate-200">Jumlah Nota</th>
                      <th className="p-2 text-right border-r border-slate-200">Pemesanan (Omset)</th>
                      <th className="p-2 text-right border-r border-slate-200">Kas Realisasi</th>
                      <th className="p-2 text-right border-r border-slate-200">Sisa Piutang</th>
                      <th className="p-2 text-center">% Lunas</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] divide-y divide-slate-200">
                    {monthlyData.map((mon, idx) => {
                      const rec = mon.omset - mon.kasMasuk;
                      const pct = mon.omset > 0 ? Math.round((mon.kasMasuk / mon.omset) * 100) : 100;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{mon.label}</td>
                          <td className="p-2 text-center font-mono border-r border-slate-200">{mon.count}</td>
                          <td className="p-2 text-right font-mono border-r border-slate-200">{formatRp(mon.omset)}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700 border-r border-slate-200">{formatRp(mon.kasMasuk)}</td>
                          <td className="p-2 text-right font-mono text-rose-600 border-r border-slate-200">{formatRp(rec)}</td>
                          <td className="p-2 text-center font-bold text-slate-700">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Outstanding list (debtors) if available */}
              {invoices.filter(inv => inv.remainingDebt > 0).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider print:text-black">2. Piutang Nota Pemesanan Belum Lunas (Maks. 10 Transaksi)</h3>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-550 border-b border-slate-200 print:bg-slate-100">
                        <th className="p-2 border-r border-slate-200">No. Nota</th>
                        <th className="p-2 border-r border-slate-200">Nama Pelanggan &amp; Tim</th>
                        <th className="p-2 text-center border-r border-slate-200">Tanggal Nota</th>
                        <th className="p-2 text-right border-r border-slate-200">Total Tagihan</th>
                        <th className="p-2 text-right border-r border-slate-200">Uang Muka (DP)</th>
                        <th className="p-2 text-right font-bold text-rose-700">Sisa Tagihan (Piutang)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] divide-y divide-slate-200 font-mono">
                      {invoices
                        .filter(inv => inv.remainingDebt > 0)
                        .slice(0, 10)
                        .map((inv) => (
                          <tr key={inv.id}>
                            <td className="p-2 font-bold text-indigo-700 border-r border-slate-200">{inv.invoiceNum}</td>
                            <td className="p-2 font-sans font-bold text-slate-800 border-r border-slate-200">{inv.customerName}</td>
                            <td className="p-2 text-center border-r border-slate-200">{new Date(inv.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                            <td className="p-2 text-right border-r border-slate-200">{formatRp(inv.totalAmount)}</td>
                            <td className="p-2 text-right border-r border-slate-200">{formatRp(inv.downPayment + inv.settlement)}</td>
                            <td className="p-2 text-right font-black text-rose-600">{formatRp(inv.remainingDebt)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {invoices.filter(inv => inv.remainingDebt > 0).length > 10 && (
                    <p className="text-[9px] text-slate-400 italic font-medium font-sans">
                      * Menampilkan 10 record terlama dari total {invoices.filter(inv => inv.remainingDebt > 0).length} piutang belum lunas agar proporsi cetakan rapi &amp; proporsional dalam 1 lembar A4.
                    </p>
                  )}
                </div>
              )}

              {/* Signature section */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans">
                <div className="space-y-12">
                  <p className="text-slate-500 font-semibold">Petugas Administrasi,</p>
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto font-black text-slate-800">
                      {userRole === 'OWNER' ? 'Owner / Pengelola' : 'Staf Kasir Workshop'}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">A3 Jersey &amp; Sablon POS</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p className="text-slate-500 font-semibold">Menyetujui, Owner / Manajer</p>
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto font-black text-slate-800 animate-pulse">
                      .......................................
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">Stempel &amp; Tanda Tangan Resmi</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Controls with Print Option (Hidden in print) */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Printer:</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-extrabold text-[10px]">
                  💾 {selectedPrinter.split(' ')[0]}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  id="report-btn-close-bottom"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-black border-none cursor-pointer transition"
                >
                  Tutup Dialog
                </button>
                <button
                  id="report-btn-print-bottom"
                  onClick={() => setShowPrintConfig(true)}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs cursor-pointer border-none transition shadow-lg shadow-indigo-600/10"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Laporan / Pilih Printer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- HIGH-FIDELITY REPORT PRINT SETTINGS DIALOG --- */}
      {showPrintConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in print:hidden" id="report-print-options-backdrop">
          <div className="bg-[#2d2e30] border border-slate-750 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden text-slate-200 font-sans">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  Cetak Laporan Bulanan
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Atur cetakan laporan penjualan dan mutasi</p>
              </div>
              <div className="text-[10px] font-black tracking-widest bg-zinc-800 text-sky-300 px-2 py-1 rounded border border-zinc-700">
                A4 POTRET
              </div>
            </div>

            {/* Standard Options */}
            <div className="p-5 space-y-4">
              
              {/* Destination printer selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Tujuan Printer</label>
                <div className="relative">
                  <select
                    value={selectedPrinter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPrinter(val);
                      localStorage.setItem('athree-printer-tujuan', val);
                    }}
                    className="w-full bg-[#1e1f21] hover:bg-[#252628] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer font-bold transition focus:outline-none focus:border-sky-500 appearance-none animate-none"
                  >
                    <option value="EPSON8BDF43 (L655 Series)">🖨️ EPSON8BDF43 (L655 Series) - Inkjet</option>
                    <option value="Canon Pixma iP2770 Series">🖨️ Canon Pixma iP2770 Series - Standar</option>
                    <option value="HP DeskJet Ink Advantage 2700">🖨️ HP DeskJet Ink Advantage 2700</option>
                    <option value="Microsoft Print to PDF">📄 Microsoft Print to PDF (Simpan Digital)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Layout format */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Ukuran Kertas</label>
                <div className="w-full bg-[#1e1f21]/50 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-400 font-bold">
                  📄 Standard A4 Potret (Laporan Bulanan Resmi)
                </div>
              </div>

              {/* Pages & Copies */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Halaman</label>
                  <div className="relative">
                    <select
                      value={selectedPages}
                      onChange={(e) => setSelectedPages(e.target.value)}
                      className="w-full bg-[#1e1f21] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer font-bold appearance-none"
                    >
                      <option value="Semua">Semua</option>
                      <option value="Halaman Terpilih">Halaman Terpilih</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Salinan (Copies)</label>
                  <input
                    type="number"
                    min={1}
                    value={selectedCopies}
                    onChange={(e) => setSelectedCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#1e1f21] border border-[#3f3f46] rounded-xl px-3 py-2 text-xs text-white lg:text-slate-50 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Layout orientation and colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Tata Letak</label>
                  <div className="relative">
                    <select
                      value={selectedLayout}
                      onChange={(e) => {
                        const val = e.target.value as 'potret' | 'lanskap';
                        setSelectedLayout(val);
                        localStorage.setItem('athree-printer-layout', val);
                      }}
                      className="w-full bg-[#1e1f21] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer font-bold appearance-none"
                    >
                      <option value="potret">Potret (Portrait)</option>
                      <option value="lanskap">Lanskap (Landscape)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Warna</label>
                  <div className="relative">
                    <select
                      value={selectedColor}
                      onChange={(e) => {
                        const val = e.target.value as 'warna' | 'monokrom';
                        setSelectedColor(val);
                        localStorage.setItem('athree-printer-warna', val);
                      }}
                      className="w-full bg-[#1e1f21] border border-zinc-700 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer font-bold appearance-none"
                    >
                      <option value="warna">Warna</option>
                      <option value="monokrom">B&amp;W (Hitam Putih)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Custom Accordion */}
              <div className="border-t border-zinc-750 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOtherSettings(!showOtherSettings)}
                  className="w-full flex justify-between items-center text-xs font-bold text-zinc-405 hover:text-white bg-transparent border-none cursor-pointer outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    Setelan Tambahan Laporan
                  </span>
                  {showOtherSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOtherSettings && (
                  <div className="mt-2.5 p-3 bg-zinc-805 bg-black/20 rounded-xl space-y-1 border border-zinc-750 text-[11px] text-zinc-400">
                    <div>• Menyertakan rekapitulasi 10 item piutang outstanding</div>
                    <div>• Skala otomatis layout kontainer ke Lembar Kerja A4</div>
                    <div>• Menyembunyikan seluruh tombol kendali sistem kasir</div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Buttons */}
            <div className="px-5 py-4 border-t border-zinc-700 bg-[#252628] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPrintConfig(false)}
                className="px-4 py-2 bg-transparent hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Batal
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsSimulatingPrint(true);
                  setTimeout(() => {
                    setIsSimulatingPrint(false);
                    setShowPrintConfig(false);
                    window.print();
                  }, 850);
                }}
                disabled={isSimulatingPrint}
                className="flex items-center gap-1.5 px-6 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-700 text-white font-extrabold rounded-lg text-xs cursor-pointer border-none transition active:scale-95 shadow-md"
              >
                {isSimulatingPrint ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    Cetak
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- HIGH-FIDELITY EDIT TRANSACTION DIALOG --- */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in print:hidden" id="edit-transaction-modal">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden text-slate-800 font-sans">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-600" />
                  Mengubah Mutasi Kas Toko
                </h3>
                <p className="text-[10px] text-slate-505 font-bold mt-0.5">Ubah rincian mutasi kas masuk/keluar harian</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-transparent border-none cursor-pointer outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              
              {/* Type info */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Tipe Mutasi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('DP')}
                    className={`py-2 px-3 text-center text-xs font-black uppercase rounded-xl transition ${editType === 'DP' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Uang Muka (DP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('PELUNASAN')}
                    className={`py-2 px-3 text-center text-xs font-black uppercase rounded-xl transition ${editType === 'PELUNASAN' ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Pelunasan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('PENGELUARAN')}
                    className={`py-2 px-3 text-center text-xs font-black uppercase rounded-xl transition ${editType === 'PENGELUARAN' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              {/* Amount of money */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 font-mono">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={editAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val) {
                        setEditAmount(parseInt(val, 10).toLocaleString('id-ID'));
                      } else {
                        setEditAmount('');
                      }
                    }}
                    className="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-black font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Method select */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Metode Pembayaran</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as 'CASH' | 'TRANSFER')}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 px-3.5 py-3 rounded-2xl text-sm font-bold focus:border-indigo-400 focus:outline-none"
                >
                  <option value="CASH">💵 TUNAI (CASH)</option>
                  <option value="TRANSFER">🏦 TRANSFER BANK</option>
                </select>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Keterangan / Keperluan</label>
                <input
                  type="text"
                  required
                  placeholder="Keterangan transaksi"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Client name (optional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Nama Pelanggan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nama pelanggan/rekanan"
                  value={editCustomer}
                  onChange={(e) => setEditCustomer(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Timestamp info */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Waktu Transaksi</label>
                <input
                  type="datetime-local"
                  value={editTimestamp ? new Date(editTimestamp).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditTimestamp(new Date(e.target.value).toISOString())}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-indigo-50">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition active:scale-95 border-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs cursor-pointer transition active:scale-95 border-none shadow-md shadow-indigo-600/10"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
