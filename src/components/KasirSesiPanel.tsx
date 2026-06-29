/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CashierSession, PaymentTransaction } from '../types';
import { 
  Lock, 
  Unlock, 
  Briefcase, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  RefreshCcw, 
  History, 
  Search, 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  User,
  ArrowRight,
  Clock,
  HelpCircle,
  PiggyBank,
  Edit,
  Check,
  X,
  Trash2
} from 'lucide-react';

interface KasirSesiPanelProps {
  paymentTransactions: PaymentTransaction[];
  activeSession: CashierSession | null;
  sessionsHistory: CashierSession[];
  onOpenSession: (openingBalance: number, cashier: 'OWNER' | 'KASIR') => void;
  onCloseSession: (actualCash: number, expectedCash: number, notes: string) => void;
  onAddCustomTransaction?: (tx: PaymentTransaction) => void;
  onUpdateCustomTransaction?: (tx: PaymentTransaction) => void;
  onDeleteCustomTransaction?: (txId: string) => void;
  userRole: 'OWNER' | 'KASIR';
  onUpdateSessionOpeningBalance?: (newBalance: number) => void;
  onUpdateSessionHistory?: (sess: CashierSession) => void;
}

export default function KasirSesiPanel({
  paymentTransactions,
  activeSession,
  sessionsHistory,
  onOpenSession,
  onCloseSession,
  onAddCustomTransaction,
  onUpdateCustomTransaction,
  onDeleteCustomTransaction,
  userRole,
  onUpdateSessionOpeningBalance,
  onUpdateSessionHistory
}: KasirSesiPanelProps) {
  
  const [panelTab, setPanelTab] = useState<'active' | 'history'>('active');
  
  // Custom Transaction Form state
  const [showAddTx, setShowAddTx] = useState(false);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txMethod, setTxMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [txType, setTxType] = useState<'DP' | 'PELUNASAN' | 'PENGELUARAN'>('PENGELUARAN');
  const [txNotes, setTxNotes] = useState<string>('');

  // Opening form states
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [openByRole, setOpenByRole] = useState<'OWNER' | 'KASIR'>(userRole);

  // States for revising opening balance
  const [isEditingOpeningBal, setIsEditingOpeningBal] = useState<boolean>(false);
  const [revisedOpeningBal, setRevisedOpeningBal] = useState<string>('');

  // Closing form states
  const [actualCash, setActualCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [showClosingConfirm, setShowClosingConfirm] = useState<boolean>(false);

  // Filter history
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Editing transaction state for Owner
  const [editingTransaction, setEditingTransaction] = useState<PaymentTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCustomer, setEditCustomer] = useState('');
  const [editMethod, setEditMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [editType, setEditType] = useState<'DP' | 'PELUNASAN' | 'PENGELUARAN'>('PELUNASAN');
  const [editTimestamp, setEditTimestamp] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Harap masukkan nominal transaksi mutasi yang valid!");
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

  const handleDeleteTransactionClick = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      onDeleteCustomTransaction?.(id);
    }
  };

  // Editing closed session history state
  const [editingSession, setEditingSession] = useState<CashierSession | null>(null);
  const [editSessionOpening, setEditSessionOpening] = useState('');
  const [editSessionActual, setEditSessionActual] = useState('');
  const [editSessionNotes, setEditSessionNotes] = useState('');

  const handleStartEditSession = (sess: CashierSession) => {
    setEditingSession(sess);
    setEditSessionOpening(sess.openingBalance.toLocaleString('id-ID'));
    setEditSessionActual((sess.actualCash ?? 0).toLocaleString('id-ID'));
    setEditSessionNotes(sess.notes || '');
  };

  const handleSaveEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    const opening = parseFloat(editSessionOpening.replace(/[^0-9]/g, ''));
    const actual = parseFloat(editSessionActual.replace(/[^0-9]/g, ''));
    if (isNaN(opening) || opening < 0) {
      alert("Harap masukkan modal awal yang valid!");
      return;
    }
    if (isNaN(actual) || actual < 0) {
      alert("Harap masukkan uang fisik yang valid!");
      return;
    }

    // Recalculate discrepancy
    const discrepancy = actual - (opening + (editingSession.expectedCash - editingSession.openingBalance));

    const updatedSess: CashierSession = {
      ...editingSession,
      openingBalance: opening,
      actualCash: actual,
      expectedCash: opening + (editingSession.expectedCash - editingSession.openingBalance),
      discrepancy: discrepancy,
      notes: editSessionNotes.trim(),
    };

    onUpdateSessionHistory?.(updatedSess);
    setEditingSession(null);
  };

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  // Filter payment list for current active session
  const currentSessionPayments = paymentTransactions.filter(p => {
    if (!activeSession) return false;
    return new Date(p.timestamp).getTime() >= new Date(activeSession.openedAt).getTime();
  });

  // Calculations for current active session
  const cashIn = currentSessionPayments
    .filter(p => p.type !== 'PENGELUARAN' && p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const cashOut = currentSessionPayments
    .filter(p => p.type === 'PENGELUARAN' && p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const transferIn = currentSessionPayments
    .filter(p => p.type !== 'PENGELUARAN' && p.method === 'TRANSFER')
    .reduce((sum, p) => sum + p.amount, 0);

  const transferOut = currentSessionPayments
    .filter(p => p.type === 'PENGELUARAN' && p.method === 'TRANSFER')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalIn = cashIn + transferIn;
  const totalOut = cashOut + transferOut;
  const expectedCash = activeSession ? activeSession.openingBalance + cashIn - cashOut : 0;

  const handleOpenDesktop = (e: React.FormEvent) => {
    e.preventDefault();
    if (openingBalance < 0) {
      alert('Modal awal tidak boleh kurang dari 0!');
      return;
    }
    onOpenSession(openingBalance, openByRole);
    // Initialize actualCash with current expected cash as convenient default
    setActualCash(openingBalance + cashIn - cashOut);
  };

  const handleCloseDesktop = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseSession(actualCash, expectedCash, closingNotes);
    setShowClosingConfirm(false);
    setClosingNotes('');
  };

  const handleCreateCustomTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) {
      alert('Nominal transaksi harus lebih dari 0!');
      return;
    }
    if (!txNotes.trim()) {
      alert('Mohon tuliskan deskripsi atau keterangan transaksi!');
      return;
    }
    if (onAddCustomTransaction) {
      const newTx: PaymentTransaction = {
        id: `pay-${Date.now()}`,
        amount: txAmount,
        method: txMethod,
        type: txType,
        timestamp: new Date().toISOString(),
        cashier: userRole,
        notes: txNotes
      };
      onAddCustomTransaction(newTx);
      // reset states
      setTxAmount(0);
      setTxNotes('');
      setShowAddTx(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-indigo-100/40 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-[11px] font-black tracking-wider uppercase text-indigo-505 bg-indigo-50 dark:bg-indigo-950/45 dark:text-indigo-400 px-3 py-1 rounded-full">
            KASIR & CLOSINGAN
          </span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-150 tracking-tight mt-2 flex items-center gap-2">
            📊 Rekap Kas Harian
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
            Menghitung total uang tunai (cash) harian, mencocokkan saldo laci kasir, dan pelaporan closingan.
          </p>
        </div>

        {/* Mini Status Pill badge */}
        <div className="flex items-center gap-3">
          <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
            activeSession 
              ? 'bg-emerald-50/50 border-emerald-100/60 dark:bg-emerald-950/20 dark:border-emerald-900/40' 
              : 'bg-rose-50/50 border-rose-100/60 dark:bg-rose-950/20 dark:border-rose-900/40'
          }`}>
            <div className={`p-2.5 rounded-xl ${
              activeSession ? 'bg-emerald-555 text-emerald-600' : 'bg-rose-555 text-rose-600'
            }`}>
              {activeSession ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATUS LACI KAS</div>
              <div className={`text-xs font-black ${
                activeSession ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}>
                {activeSession ? '🟢 AKTIF (BUKA)' : '🔴 TUTUT (BELUM BANTU)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list selecting Active Session vs History Log */}
      <div className="flex border-b border-indigo-100/30 dark:border-slate-800 pb-px">
        <button
          onClick={() => setPanelTab('active')}
          className={`px-5 py-3 text-xs font-extrabold transition flex items-center gap-2 border-b-2 bg-transparent cursor-pointer ${
            panelTab === 'active'
              ? 'border-indigo-650 text-indigo-700 dark:text-indigo-400 font-extrabold border-b-2'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Sesi Kasir Aktif
        </button>
        <button
          onClick={() => setPanelTab('history')}
          className={`px-5 py-3 text-xs font-extrabold transition flex items-center gap-2 border-b-2 bg-transparent cursor-pointer ${
            panelTab === 'history'
              ? 'border-indigo-650 text-indigo-700 dark:text-indigo-400 font-extrabold border-b-2'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Closingan Sesi ({sessionsHistory.length})
        </button>
      </div>

      {/* Tab Area: Active Session */}
      {panelTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Active Session is NULL: Prompt to open session */}
          {!activeSession ? (
            <div className="lg:col-span-12 max-w-2xl mx-auto w-full bg-white dark:bg-slate-900 border border-indigo-100/55 dark:border-slate-800 rounded-3xl p-8 shadow-xs text-center space-y-6">
              <div className="w-16 h-16 bg-amber-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Sesi Kasir Belum Dibuka Hari Ini</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Laci kasir saat ini terkunci. Untuk mulai menerima pembayaran Nota serta melacak total cash tunai di laci, harap lakukan pembukaan laci kas terlebih dahulu dengan memasukkan saldo modal awal.
                </p>
              </div>

              {/* Form to open cashier session */}
              <form onSubmit={handleOpenDesktop} className="bg-indigo-50/10 dark:bg-slate-850/50 p-6 rounded-2xl border border-indigo-100/30 dark:border-slate-800 text-left max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="opening-balance">
                    💵 Modal Awal Laci Kasir (Rp)
                  </label>
                  <input
                    type="text"
                    id="opening-balance"
                    required
                    placeholder="Contoh: 200.000"
                    value={openingBalance === 0 ? '' : openingBalance.toLocaleString('id-ID')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const numVal = val ? parseInt(val, 10) : 0;
                      setOpeningBalance(numVal);
                      setActualCash(numVal);
                    }}
                    className="w-full px-4 py-3 text-base bg-white dark:bg-slate-800 border bg-indigo-50/5 border-indigo-50 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 font-mono font-bold transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                    * Harap masukkan modal awal sesuai dengan uang fisik di laci saat ini. Setelah closing, saldo laci akan otomatis menjadi Rp 0.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Dibuka Oleh
                    </span>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs select-none">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      {userRole}
                    </div>
                  </div>
                  <div className="relative pt-4 flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl border-none cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Buka Kasir Sekarang
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            // Active Session IS OPEN
            <>
              {/* Left summary dashboard - span 8 */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Session metadata card */}
                <div className="bg-white dark:bg-slate-900 border border-indigo-100/40 dark:border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row justify-between gap-4 shadow-3xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Info Sesi Kas Aktif
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-205 mt-2">
                      Sesi dibukakan sejak {formatDate(activeSession.openedAt)}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      Registrasi Kasir: <span className="font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{activeSession.openedBy}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-extrabold dark:bg-emerald-950/20 dark:text-emerald-400 py-1.5 px-3 rounded-full border border-emerald-100/30 dark:border-emerald-900/20 animate-pulse">
                      ● LACI KAS SEDANG TERBUKA
                    </span>
                  </div>
                </div>

                {/* Grid of calculations (Uang Cash Harian) - Gorgeous 4 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* MODAL AWAL CARD */}
                  <div className="bg-white dark:bg-slate-900 border border-indigo-100/40 dark:border-slate-800 p-5 rounded-3xl relative overflow-hidden group shadow-3xs">
                    <div className="absolute right-0 top-0 p-8 opacity-5 text-indigo-650 group-hover:scale-110 transition pointer-events-none">
                      <PiggyBank className="w-20 h-20" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-505 uppercase tracking-widest block mb-2">
                      💵 Modal Awal (Cash)
                    </span>
                    {isEditingOpeningBal ? (
                      <div className="mt-1 space-y-2 relative z-10">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                          <input
                            type="text"
                            value={revisedOpeningBal}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              if (val) {
                                setRevisedOpeningBal(parseInt(val, 10).toLocaleString('id-ID'));
                              } else {
                                setRevisedOpeningBal('');
                              }
                            }}
                            className="w-full pl-8 pr-2 py-1.5 text-sm font-mono font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              const val = parseFloat(revisedOpeningBal.replace(/[^0-9]/g, ''));
                              if (!isNaN(val) && val >= 0) {
                                onUpdateSessionOpeningBalance?.(val);
                                setIsEditingOpeningBal(false);
                              }
                            }}
                            className="flex-1 py-1 px-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Simpan
                          </button>
                          <button
                            onClick={() => setIsEditingOpeningBal(false)}
                            className="py-1 px-2 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md transition flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between mt-1 relative z-10">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                          {formatRp(activeSession.openingBalance)}
                        </h3>
                        {userRole === 'OWNER' && (
                          <button
                            onClick={() => {
                              setRevisedOpeningBal(activeSession.openingBalance.toString());
                              setIsEditingOpeningBal(true);
                            }}
                            className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-0.5 ml-2 transition shrink-0"
                          >
                            <Edit className="w-3 h-3" /> Revisi
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
                      Saldo cash pembukaan kas di laci keuangan.
                    </p>
                  </div>

                  {/* CASH IN */}
                  <div className="bg-emerald-50/15 dark:bg-slate-900/10 border border-emerald-100/30 dark:border-slate-850 p-5 rounded-3xl relative overflow-hidden group shadow-3xs">
                    <div className="absolute right-0 top-0 p-8 opacity-5 text-emerald-600 group-hover:scale-110 transition pointer-events-none">
                      <TrendingUp className="w-20 h-20" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-505 uppercase tracking-widest block mb-2">
                      📥 CASH MASUK
                    </span>
                    <h3 className="text-lg font-black text-emerald-650 dark:text-emerald-400 font-mono tracking-tight mt-1">
                      + {formatRp(cashIn)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
                      Akumulasi DP & pelunasan tunai (cash).
                    </p>
                  </div>

                  {/* CASH OUT */}
                  <div className="bg-rose-50/15 dark:bg-slate-900/10 border border-rose-100/30 dark:border-slate-850 p-5 rounded-3xl relative overflow-hidden group shadow-3xs">
                    <div className="absolute right-0 top-0 p-8 opacity-5 text-rose-600 group-hover:scale-110 transition pointer-events-none">
                      <TrendingUp className="w-20 h-20 rotate-180" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-505 uppercase tracking-widest block mb-2">
                      📤 CASH KELUAR
                    </span>
                    <h3 className="text-lg font-black text-rose-650 dark:text-rose-400 font-mono tracking-tight mt-1">
                      - {formatRp(cashOut)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
                      Akumulasi pengeluaran tunai (cash) harian.
                    </p>
                  </div>

                  {/* EXPECTED DRAWER CASH */}
                  <div className="bg-indigo-50/20 dark:bg-slate-900 border border-indigo-150/40 dark:border-slate-800 p-5 rounded-3xl relative overflow-hidden group shadow-3xs">
                    <div className="absolute right-0 top-0 p-8 opacity-5 text-indigo-700 group-hover:scale-110 transition pointer-events-none">
                      <DollarSign className="w-20 h-20" />
                    </div>
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">
                      💰 ESTIMASI CASH LACI
                    </span>
                    <h3 className="text-xl font-black text-indigo-650 dark:text-indigo-300 font-mono tracking-tight mt-1">
                      {formatRp(expectedCash)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed">
                      Formula: <span className="text-slate-500 font-black">Modal</span> + <span className="text-slate-500 font-black">Masuk</span> - <span className="text-slate-500 font-black">Keluar</span>
                    </p>
                  </div>

                </div>

                {/* TRANSFER BANK INFO CARD */}
                <div className="bg-indigo-50/10 dark:bg-slate-900/30 border border-indigo-50 dark:border-slate-800 p-5 rounded-3xl flex justify-between items-center shadow-3xs">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                      🏦 TOTAL PADA TRANSFER BANK (NON-CASH)
                    </div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                      Penerimaan transaksi via Transfer Bank / QRIS dalam sesi kas harian berjalan (Bank In: {formatRp(transferIn)}, Bank Out: {formatRp(transferOut)}).
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                      {formatRp(transferIn - transferOut)}
                    </h3>
                  </div>
                </div>

                {/* Transactions detailed list received inside this session */}
                <div className="bg-white dark:bg-slate-900 border border-indigo-100/40 dark:border-slate-800 rounded-3xl p-6 shadow-3xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">🧾 Transaksi Dalam Sesi Aktif</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Histori pembayaran DP/Pelunasan masuk serta Pengeluaran / Kas Keluar harian.</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowAddTx(!showAddTx)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-450 text-xs font-black py-2 px-4 rounded-xl border-none cursor-pointer transition select-none outline-none"
                      >
                        {showAddTx ? '✕ Tutup Form' : '＋ Catat Kas Keluar / Masuk'}
                      </button>
                      <span className="text-xs font-mono font-extrabold text-slate-500 bg-slate-105 dark:bg-slate-800 py-1.5 px-3 rounded-xl">
                        {currentSessionPayments.length} Pembayaran
                      </span>
                    </div>
                  </div>

                  {showAddTx && (
                    <form onSubmit={handleCreateCustomTx} className="p-4 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-indigo-100/20 dark:border-slate-850 space-y-4 animate-fade-in text-xs">
                      <h4 className="font-extrabold text-slate-700 dark:text-slate-205 uppercase tracking-widest text-[10px]">🖊️ Catat Transaksi Sesi Langsung</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal (Rp)</label>
                          <input
                            type="text"
                            required
                            value={txAmount === 0 ? '' : txAmount.toLocaleString('id-ID')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setTxAmount(val ? parseInt(val, 10) : 0);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-50/50 dark:border-slate-700 rounded-xl outline-none font-mono font-bold"
                            placeholder="Contoh: 15.000"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe</label>
                          <select
                            value={txType}
                            onChange={(e) => setTxType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-50/50 dark:border-slate-700 rounded-xl outline-none font-extrabold"
                          >
                            <option value="PENGELUARAN">📤 Kas Keluar (Pengeluaran)</option>
                            <option value="PELUNASAN">📥 Kas Masuk (Penerimaan)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Metode</label>
                          <select
                            value={txMethod}
                            onChange={(e) => setTxMethod(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-50/50 dark:border-slate-700 rounded-xl outline-none font-extrabold"
                          >
                            <option value="CASH">💵 Cash (Laci Kasir)</option>
                            <option value="TRANSFER">🏦 Transfer Bank</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Keterangan / Deskripsi</label>
                          <input
                            type="text"
                            required
                            value={txNotes}
                            onChange={(e) => setTxNotes(e.target.value)}
                            placeholder="Contoh: Beli lakban packing"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-50/50 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTx(false);
                            setTxNotes('');
                            setTxAmount(0);
                          }}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-650 rounded-xl font-bold cursor-pointer border-none"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold cursor-pointer border-none shadow-xs"
                        >
                          Simpan Sesi Transaksi
                        </button>
                      </div>
                    </form>
                  )}

                  {currentSessionPayments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs border-2 border-dashed border-indigo-50 rounded-2xl">
                      Belum ada setoran masuk atau pengeluaran selama sesi kasir terbuka.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-indigo-50/65 text-slate-405 font-bold">
                            <th className="py-2.5">Waktu</th>
                            <th className="py-2.5">Nota</th>
                            <th className="py-2.5">Keterangan / Pelanggan</th>
                            <th className="py-2.5 font-bold">Tipe</th>
                            <th className="py-2.5 text-center">Metode</th>
                            <th className="py-2.5 text-right">Jumlah</th>
                            <th className="py-2.5 text-center print:hidden">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50/30">
                          {currentSessionPayments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium font-semibold">
                              <td className="py-2.5 font-mono text-[11px]">{new Date(p.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</td>
                              <td className="py-2.5 font-mono text-indigo-600 font-bold">{p.invoiceNum || '-'}</td>
                              <td className="py-2.5">
                                {p.customerName ? (
                                  <div>
                                    <div className="font-bold">{p.customerName}</div>
                                    {p.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{p.notes}</div>}
                                  </div>
                                ) : (
                                  <div className="font-bold text-slate-700 dark:text-slate-300 italic">{p.notes || 'Transaksi Langsung'}</div>
                                )}
                              </td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  p.type === 'PENGELUARAN' 
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450' 
                                    : p.type === 'DP' 
                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' 
                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                }`}>
                                  {p.type === 'PENGELUARAN' ? 'KELUAR' : p.type}
                                </span>
                              </td>
                              <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  p.method === 'CASH'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                                }`}>
                                  {p.method === 'CASH' ? '💵 Cash' : '🏦 Transfer'}
                                </span>
                              </td>
                              <td className={`py-2.5 text-right font-mono font-bold ${
                                p.type === 'PENGELUARAN' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'
                              }`}>{p.type === 'PENGELUARAN' ? '-' : ''}{formatRp(p.amount)}</td>
                              <td className="py-2.5 text-center print:hidden">
                                <div className="flex items-center justify-center gap-1.5">
                                  {userRole === 'OWNER' ? (
                                    <>
                                      <button
                                        onClick={() => handleStartEdit(p)}
                                        className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                                        title="Edit Transaksi"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransactionClick(p.id)}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Hapus Transaksi"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <span title="Hanya Owner" className="text-slate-300">
                                      <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Right closing control center Panel - span 4 */}
              <div className="lg:col-span-4">
                <div className="bg-white dark:bg-slate-900 border border-indigo-100/40 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5 sticky top-4">
                  <div className="flex items-center gap-2 border-b border-indigo-100/30 dark:border-slate-805 pb-3">
                    <Lock className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-205">🔒 CLOSING Jurnal Harian</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Setiap akhir jam kerja, hitung uang cash fisik di dalam laci, masukkan nominalnya di bawah, lalu kunci pembukuan sesi ini.
                  </p>

                  {!showClosingConfirm ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/15 rounded-2xl space-y-1.5 border border-indigo-100/20 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Modal Awal:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatRp(activeSession.openingBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Setoran Tunai:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatRp(cashIn)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5 border-t border-indigo-100/40 dark:border-slate-800 font-bold">
                          <span className="text-indigo-650 dark:text-indigo-400">Estimasi Cash Laci:</span>
                          <strong className="font-mono text-sm text-slate-900 dark:text-slate-100 font-black">{formatRp(expectedCash)}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActualCash(expectedCash);
                          setShowClosingConfirm(true);
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs py-3 px-4 rounded-xl border-none cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Tutup Sesi & Hitung Selisih
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCloseDesktop} className="space-y-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="cashier-actual-cash">
                          💵 Uang Cash Fisik di Laci (Rp)
                        </label>
                        <input
                          type="text"
                          id="cashier-actual-cash"
                          required
                          value={actualCash === 0 ? '' : actualCash.toLocaleString('id-ID')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setActualCash(val ? parseInt(val, 10) : 0);
                          }}
                          className="w-full px-4 py-2.5 text-base bg-rose-50/10 dark:bg-rose-950/10 border-2 border-rose-100 focus:border-rose-500 rounded-xl text-slate-800 dark:text-white outline-none font-mono font-bold transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          * Hitung secara fisik seluruh uang kertas & koin di laci kasir saat penutupan laci.
                        </p>
                      </div>

                      {/* Display calculations difference/discrepancy */}
                      {(() => {
                        const selisih = actualCash - expectedCash;
                        return (
                          <div className={`p-4 rounded-2xl border text-xs ${
                            selisih === 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-805 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-105 dark:border-rose-900/30 text-rose-805 dark:text-rose-450'
                          }`}>
                            <div className="font-extrabold flex items-center gap-1.5">
                              {selisih === 0 ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-550" />
                              )}
                              <span>
                                {selisih === 0 
                                  ? 'Sempurna! Nilai laci COCOK (Rp 0)' 
                                  : `Selisih Laci: ${selisih > 0 ? 'Surplus' : 'Defisit'} ${formatRp(Math.abs(selisih))}`}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-80 mt-1 font-bold leading-normal">
                              {selisih === 0 
                                ? 'Uang di laci sama persis dengan transaksi masuk di komputer.' 
                                : selisih > 0 
                                  ? 'Terdapat uang lebih laci fisik dibanding kalkulasi komputer.' 
                                  : 'Terdapat kekurangan uang tunai laci fisik dibanding kalkulasi komputer.'}
                            </p>
                          </div>
                        );
                      })()}

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="closing-notes-text">
                          Catatan Closing (Opsional)
                        </label>
                        <textarea
                          id="closing-notes-text"
                          rows={2}
                          value={closingNotes}
                          onChange={(e) => setClosingNotes(e.target.value)}
                          placeholder="Keterangan tambahan selisih atau penyerahan kas ke owner..."
                          className="w-full px-4 py-2 bg-indigo-50/10 border bg-indigo-50/5 border-indigo-50 dark:border-slate-800 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition leading-relaxed"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowClosingConfirm(false)}
                          className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 rounded-xl text-xs font-bold cursor-pointer transition border-none"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer transition border-none shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Finalisasikan Closing
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* Tab Area: Sessions History Logs */}
      {panelTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-100/40 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-205">Logs Rekap Penutupan Kas</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Menampilkan riwayat penutupan laci kas, nominal modal, selisih kas fisik, dan catatan.</p>
            </div>

            {/* Quick search inside session logs */}
            <div className="relative w-full max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Cari kasir atau catatan..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-indigo-50/10 dark:bg-slate-800 border-2 border-indigo-50 dark:border-slate-700 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-white outline-none font-bold transition"
              />
            </div>
          </div>

          {/* Sessions Logs Table */}
          {(() => {
            const filtered = sessionsHistory.filter(s => {
              const matchesSearch = 
                (s.openedBy && s.openedBy.toLowerCase().includes(searchHistory.toLowerCase())) ||
                (s.closedBy && s.closedBy.toLowerCase().includes(searchHistory.toLowerCase())) ||
                (s.notes && s.notes.toLowerCase().includes(searchHistory.toLowerCase()));
              return matchesSearch;
            });

            if (filtered.length === 0) {
              return (
                <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-indigo-50 rounded-2xl">
                  Tidak ada riwayat closing yang cocok dengan kueri pencarian.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-indigo-50 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                      <th className="py-3 px-3">Tanggal Dibuka</th>
                      <th className="py-3 px-3">Kasir (Buka/Tutup)</th>
                      <th className="py-3 px-3 text-right">Modal Awal</th>
                      <th className="py-3 px-3 text-right">Estimasi Kasir</th>
                      <th className="py-3 px-3 text-right">Fisik Terhitung</th>
                      <th className="py-3 px-3 text-right">Discrepancy (Selisih)</th>
                      <th className="py-3 px-3">Keterangan</th>
                      <th className="py-3 px-3 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50/45 dark:divide-slate-800">
                    {filtered.map(s => {
                      const selisih = (s.actualCash ?? 0) - s.expectedCash;
                      return (
                        <tr key={s.id} className="hover:bg-indigo-50/5 text-slate-705 dark:text-slate-300 font-medium font-semibold align-top">
                          <td className="py-3.5 px-3">
                            <div className="font-extrabold">{new Date(s.openedAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">{new Date(s.openedAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} - {s.closedAt ? new Date(s.closedAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : ''}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-slate-700 dark:text-slate-201">{s.openedBy}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                              <span className="font-extrabold text-slate-700 dark:text-slate-201">{s.closedBy || s.openedBy}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-655 dark:text-slate-350">{formatRp(s.openingBalance)}</td>
                          <td className="py-3.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">{formatRp(s.expectedCash)}</td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                            {s.actualCash !== undefined ? formatRp(s.actualCash) : '-'}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono">
                            {s.actualCash !== undefined ? (
                              <span className={`font-black py-0.5 px-2 rounded-md ${
                                selisih === 0
                                  ? 'text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20'
                                  : 'text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20'
                              }`}>
                                {selisih === 0 ? '✓ Tepat' : `${selisih > 0 ? '+' : ''}${formatRp(selisih)}`}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-3 max-w-xs leading-normal">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal italic">
                              {s.notes || <span className="text-slate-300">tidak ada catatan</span>}
                            </p>
                          </td>
                          <td className="py-3.5 px-3 text-center align-middle print:hidden">
                            {userRole === 'OWNER' ? (
                              <button
                                onClick={() => handleStartEditSession(s)}
                                className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                                title="Edit Sesi"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            ) : (
                              <span title="Hanya Owner" className="text-slate-300">
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

        </div>
      )}

      {/* --- HIGH-FIDELITY EDIT TRANSACTION DIALOG --- */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in print:hidden text-left" id="edit-transaction-modal">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden text-slate-800 font-sans">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-600" />
                  Mengubah Mutasi Kas Toko
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Ubah rincian mutasi kas masuk/keluar harian</p>
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

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="py-3 px-4 text-xs font-black uppercase text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="py-3 px-4 text-xs font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- HIGH-FIDELITY EDIT CLOSED SESSION DIALOG --- */}
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in print:hidden text-left" id="edit-session-modal">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden text-slate-800 font-sans">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Mengubah Sesi Laci Kasir
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Edit modal awal dan hasil pencatatan fisik laci kasir</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-transparent border-none cursor-pointer outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="p-5 space-y-4">
              
              {/* Opening balance */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Modal Awal Sesi (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 font-mono">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={editSessionOpening}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val) {
                        setEditSessionOpening(parseInt(val, 10).toLocaleString('id-ID'));
                      } else {
                        setEditSessionOpening('');
                      }
                    }}
                    className="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-black font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Actual cash count */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Uang Fisik Terhitung (Closing)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 font-mono">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={editSessionActual}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val) {
                        setEditSessionActual(parseInt(val, 10).toLocaleString('id-ID'));
                      } else {
                        setEditSessionActual('');
                      }
                    }}
                    className="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-black font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Session notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Catatan Closing Sesi</label>
                <textarea
                  placeholder="Catatan discrepancy selisih laci atau rincian tutup kasir"
                  rows={3}
                  value={editSessionNotes}
                  onChange={(e) => setEditSessionNotes(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="py-3 px-4 text-xs font-black uppercase text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-3 px-4 text-xs font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
