/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { Search, Eye, CircleDollarSign, Calendar, ChevronRight, Filter, Receipt, Edit, Printer, AlertTriangle, Clock, Info, Bell, Trash2 } from 'lucide-react';

interface NotaListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onPaySettlement: (invoiceId: string, amount: number, paymentMethod?: 'CASH' | 'TRANSFER') => void;
  onUpdateProductionStatus: (invoiceId: string, status: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL') => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onQuickPrint?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  userRole?: 'KASIR' | 'OWNER' | 'PRODUKSI';
}

export default function NotaList({ invoices, onSelectInvoice, onPaySettlement, onUpdateProductionStatus, onEditInvoice, onQuickPrint, onDeleteInvoice, userRole = 'OWNER' }: NotaListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMAU' | 'LUNAS' | 'DP' | 'BELUM_BAYAR'>('SEMAU');
  const [productionFilter, setProductionFilter] = useState<'SEMAU' | 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL'>('SEMAU');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deadlineAlertFilter, setDeadlineAlertFilter] = useState<boolean>(false);
  
  // Settle amount handler state per invoice (for inline partial payment popups)
  const [settleInvoiceId, setSettleInvoiceId] = useState<string | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'CASH' | 'TRANSFER'>('CASH');

  // Loaded bank accounts for settlement payment display
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bankName: string; accountNumber: string; accountOwner: string }[]>(() => {
    try {
      const saved = localStorage.getItem('athree_bank_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((acc: any) => acc.id !== 'bca-seed' && acc.id !== 'papua-seed' && acc.bankName !== 'BCA' && acc.bankName !== 'BANK PAPUA');
        const hasBni = filtered.some((acc: any) => acc.accountNumber === '0152452997' || acc.id === 'bni-seed');
        if (!hasBni) {
          filtered.push({ id: 'bni-seed', bankName: 'BNI', accountNumber: '0152452997', accountOwner: 'DEWI ADHITYARANI M' });
        }
        return filtered;
      }
    } catch (e) {}
    return [
      { id: 'bni-seed', bankName: 'BNI', accountNumber: '0152452997', accountOwner: 'DEWI ADHITYARANI M' }
    ];
  });

  React.useEffect(() => {
    const handleRefresh = () => {
      try {
        const saved = localStorage.getItem('athree_bank_accounts');
        if (saved) setBankAccounts(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('athree-rekening-changed', handleRefresh);
    return () => window.removeEventListener('athree-rekening-changed', handleRefresh);
  }, []);

  const [salesAgents, setSalesAgents] = useState<{ code: string; name: string }[]>(() => {
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

  useEffect(() => {
    const handleRefreshSales = () => {
      try {
        const saved = localStorage.getItem('athree_sales_agents');
        if (saved) setSalesAgents(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('athree-sales-agents-changed', handleRefreshSales);
    window.addEventListener('storage', handleRefreshSales);
    return () => {
      window.removeEventListener('athree-sales-agents-changed', handleRefreshSales);
      window.removeEventListener('storage', handleRefreshSales);
    };
  }, []);

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDateShort = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Return DD/MM format like "15/06" in the picture
        return `${parts[2]}/${parts[1]}`;
      }
      const instance = new Date(dateStr);
      const day = String(instance.getDate()).padStart(2, '0');
      const month = String(instance.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  const getDeadlineBadge = (deadlineDateStr: string | undefined, productionStatus: string | undefined) => {
    if (!deadlineDateStr) return <span className="text-slate-350 text-xs font-extrabold">-</span>;
    const isCompleted = productionStatus === 'SELESAI' || productionStatus === 'SIAP_DIAMBIL';
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const deadline = new Date(deadlineDateStr);
      deadline.setHours(0, 0, 0, 0);
      
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const formatted = formatDateShort(deadlineDateStr);
      
      if (isCompleted) {
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] bg-slate-50 text-slate-400 font-extrabold px-2.5 py-0.5 rounded-full border border-slate-250/20">
            ✓ {formatted}
          </span>
         );
      }
      
      if (diffDays < 0) {
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] bg-rose-50 text-rose-600 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-100 animate-pulse" title="Terlewat / Overdue!">
            ⚠️ {formatted}
          </span>
        );
      } else if (diffDays === 0) {
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] bg-amber-50 text-amber-600 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-150/60 animate-pulse" title="Selesai hari ini!">
            ⏰ Hari Ini ({formatted})
          </span>
        );
      } else if (diffDays <= 2) {
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100" title={`${diffDays} hari lagi!`}>
            ⏳ {formatted} ({diffDays}H)
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-100">
            📅 {formatted}
          </span>
        );
      }
    } catch {
      return <span className="text-slate-500 font-extrabold">{formatDateShort(deadlineDateStr)}</span>;
    }
  };

  const handleOpenSettle = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setSettleInvoiceId(invoice.id);
    setSettleAmount(invoice.remainingDebt);
  };

  const getDeadlineStatus = (deadlineDateStr: string | undefined, productionStatus: string | undefined) => {
    if (!deadlineDateStr) return null;
    const isCompleted = productionStatus === 'SELESAI' || productionStatus === 'SIAP_DIAMBIL';
    if (isCompleted) return null;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const deadline = new Date(deadlineDateStr);
      deadline.setHours(0, 0, 0, 0);
      
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return 'overdue';
      } else if (diffDays === 0) {
        return 'today';
      }
    } catch {}
    return null;
  };

  const getRowBgClass = (deadlineDateStr: string | undefined, productionStatus: string | undefined) => {
    const dlStatus = getDeadlineStatus(deadlineDateStr, productionStatus);
    if (dlStatus === 'overdue') {
      return "bg-rose-50/65 hover:bg-rose-100 border-b border-rose-100/85 text-rose-950 font-semibold";
    }
    if (dlStatus === 'today') {
      return "bg-amber-50/65 hover:bg-amber-100 border-b border-amber-150/85 text-amber-950 font-semibold";
    }
    return "hover:bg-indigo-50/10 border-b border-indigo-50/30 text-slate-705";
  };

  const handleSaveSettle = (e: React.FormEvent, invoiceId: string) => {
    e.preventDefault();
    if (settleAmount <= 0) return;
    onPaySettlement(invoiceId, settleAmount, settleMethod);
    setSettleInvoiceId(null);
  };

  // Filter logic
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.salesCode && inv.salesCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Check if within date range (YYYY-MM-DD comparison is safe with standard string comparison)
    const matchesDateRange = 
      (!startDate || inv.date >= startDate) && 
      (!endDate || inv.date <= endDate);

    if (!matchesDateRange) return false;
    
    // Check status filter
    if (statusFilter !== 'SEMAU' && inv.status !== statusFilter) return false;

    // Check production status filter
    if (productionFilter !== 'SEMAU') {
      const currentProdStatus = inv.productionStatus || 'ANTREAN';
      if (currentProdStatus !== productionFilter) return false;
    }

    // Check deadline alert filter
    if (deadlineAlertFilter) {
      const dlStatus = getDeadlineStatus(inv.deadlineDate, inv.productionStatus);
      if (dlStatus !== 'overdue' && dlStatus !== 'today') {
        return false;
      }
    }

    return matchesSearch;
  }).sort((a, b) => {
    // Sort by date descending (newest date first)
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    
    // If date is equal, sort by invoice number descending (so newest invoice first)
    return b.invoiceNum.localeCompare(a.invoiceNum, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Count due/overdue invoices
  const overdueInvoices = invoices.filter(inv => getDeadlineStatus(inv.deadlineDate, inv.productionStatus) === 'overdue');
  const todayInvoices = invoices.filter(inv => getDeadlineStatus(inv.deadlineDate, inv.productionStatus) === 'today');
  const totalAlerts = overdueInvoices.length + todayInvoices.length;

  return (
    <div className="space-y-6" id="nota-list-view">
      
      {/* Pengingat Jatuh Tempo / Due Date Alert Banner */}
      {totalAlerts > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border-2 border-amber-200 rounded-3xl p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-red-500 border border-amber-100 flex-shrink-0 animate-bounce">
              <Bell className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                🔔 Pengingat Jatuh Tempo Produksi
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ada <span className="font-extrabold text-rose-650 font-mono">{overdueInvoices.length} nota melewati batas deadline (Overdue)</span> dan <span className="font-extrabold text-amber-655 font-mono">{todayInvoices.length} nota batas selesai hari ini</span> yang produksinya masih berjalan. Segera selesaikan dan hubungi pelanggan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDeadlineAlertFilter(!deadlineAlertFilter)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition duration-150 active:scale-95 flex items-center gap-2 cursor-pointer border-none ${
                deadlineAlertFilter
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                  : 'bg-white hover:bg-slate-50 text-indigo-700 border-2 border-indigo-150 shadow-sm'
              }`}
            >
              <Filter className="w-4 h-4" />
              {deadlineAlertFilter ? 'Tampilkan Semua Nota' : 'Filter Jatuh Tempo Urgent'}
            </button>
          </div>
        </div>
      )}
      
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-500" />
            Daftar Nota Pembayaran
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cari nota, kelola sisa piutang, pelunasan pembayaran bertahap, dan cetak slip kasir untuk pelanggan.
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto">
          {/* Fitur Filter Rentang Tanggal */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 border-2 border-indigo-100 rounded-2xl shadow-sm flex-shrink-0">
            <span className="text-[10px] uppercase font-black text-slate-400 px-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              Periode:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                id="filter-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-indigo-50/30 hover:bg-indigo-50/70 px-2.5 py-1 text-xs font-bold text-slate-700 rounded-xl outline-none border border-indigo-100/50 focus:border-indigo-400 w-[125px] cursor-pointer transition duration-150"
                title="Tanggal Mulai"
              />
              <span className="text-xs text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                id="filter-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-indigo-50/30 hover:bg-indigo-50/70 px-2.5 py-1 text-xs font-bold text-slate-700 rounded-xl outline-none border border-indigo-100/50 focus:border-indigo-400 w-[125px] cursor-pointer transition duration-150"
                title="Tanggal Selesai"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  id="btn-clear-date-filter"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-lg text-[9px] font-black transition duration-150 active:scale-95 cursor-pointer"
                  title="Reset Filter Tanggal"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 lg:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="search-nota-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pelanggan atau nomor nota..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-155 focus:ring-0"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 border-2 border-indigo-100 rounded-2xl shadow-sm flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-500" />
              Status:
            </span>
            <button
              id="filter-all-btn"
              onClick={() => setStatusFilter('SEMAU')}
              className={`px-3 py-1 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                statusFilter === 'SEMAU' 
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              Semua
            </button>
            <button
              id="filter-lunas-btn"
              onClick={() => setStatusFilter('LUNAS')}
              className={`px-3 py-1 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                statusFilter === 'LUNAS' 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-green-600'
              }`}
            >
              Lunas
            </button>
            <button
              id="filter-dp-btn"
              onClick={() => setStatusFilter('DP')}
              className={`px-3 py-1 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                statusFilter === 'DP' 
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 font-black' 
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              DP Active
            </button>
          </div>

          {/* Filter Status Produksi */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 border-2 border-indigo-100 rounded-2xl shadow-sm flex-shrink-0">
            <span className="text-[10px] uppercase font-black text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Produksi:
            </span>
            <select
              id="filter-production-select"
              value={productionFilter}
              onChange={(e) => setProductionFilter(e.target.value as any)}
              className="bg-slate-50 border-2 border-indigo-50/50 hover:border-indigo-200 focus:border-indigo-500 text-xs font-black text-slate-705 rounded-xl px-2.5 py-1 outline-none transition cursor-pointer"
            >
              <option value="SEMAU">✨ SEMUA PEKERJAAN</option>
              <option value="ANTREAN">⏳ ANTREAN</option>
              <option value="DESAIN">✏️ TAHAP DESAIN</option>
              <option value="PROSES">⚙️ PROSES PRODUKSI</option>
              <option value="SELESAI">✅ SELESAI PRODUKSI</option>
              <option value="SIAP_DIAMBIL">📦 SIAP DIAMBIL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Panel closely styled like the screenshot */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-sm" id="invoices-main-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b-2 border-indigo-150 bg-indigo-50/55 text-xs font-black uppercase tracking-wider text-indigo-700">
                <th className="px-5 py-4">No.</th>
                <th className="px-5 py-4">No. Nota</th>
                <th className="px-5 py-4">Tanggal</th>
                <th className="px-5 py-4">Deadline</th>
                <th className="px-5 py-4">Nama Pemesan / Tim</th>
                <th className="px-5 py-4 text-center">Total Qty</th>
                <th className="px-5 py-4 text-right">Total Tagihan</th>
                <th className="px-5 py-4 text-right">DP (Masuk)</th>
                <th className="px-5 py-4 text-right">Pelunasan</th>
                <th className="px-5 py-4 text-right">Sisa Piutang</th>
                <th className="px-5 py-4 text-center">Status Bayar</th>
                <th className="px-5 py-4 text-center">Status Produksi</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50 text-slate-650">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-5 py-16 text-center text-slate-400 font-bold">
                    Tidak ditemukan nota penjualan dengan kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr 
                    key={inv.id}
                    className={`${getRowBgClass(inv.deadlineDate, inv.productionStatus)} transition-colors group cursor-pointer`}
                    onClick={() => onSelectInvoice(inv)}
                  >
                    {/* Index */}
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs font-bold">
                      {idx + 1}
                    </td>

                    {/* No Nota */}
                    <td className="px-5 py-4 font-mono font-black text-indigo-600 group-hover:text-indigo-500">
                      {inv.invoiceNum}
                    </td>

                    {/* Tanggal */}
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-semibold">
                      {formatDateShort(inv.date)}
                    </td>

                    {/* Deadline */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getDeadlineBadge(inv.deadlineDate, inv.productionStatus)}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4 max-w-[180px]">
                      <div className="font-bold text-slate-800 truncate" title={inv.customerName}>
                        {inv.customerName}
                      </div>
                      {inv.salesCode && (() => {
                        const agent = salesAgents.find(s => s.code.toUpperCase() === inv.salesCode?.trim().toUpperCase());
                        return (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100/30 max-w-full truncate" title={`Sales: ${inv.salesCode} ${agent ? `(${agent.name})` : ''}`}>
                              Sales: {inv.salesCode} {agent ? `(${agent.name})` : ''}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Total Qty */}
                    <td className="px-5 py-4 text-center font-mono font-bold text-indigo-600">
                      {inv.totalQty} <span className="text-[10px] text-slate-400 font-medium font-sans">pcs</span>
                    </td>

                    {/* Total Tagihan */}
                    <td className="px-5 py-4 text-right font-mono font-black text-slate-800">
                      {formatRp(inv.totalAmount)}
                    </td>

                    {/* DP */}
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-705">
                      {formatRp(inv.downPayment)}
                    </td>

                    {/* Pelunasan */}
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-705">
                      {formatRp(inv.settlement)}
                    </td>

                    {/* Sisa Piutang */}
                    <td className="px-5 py-4 text-right font-mono font-black">
                      {inv.remainingDebt > 0 ? (
                        <span className="text-amber-600">{formatRp(inv.remainingDebt)}</span>
                      ) : (
                        <span className="text-slate-400 font-medium font-sans">Rp 0</span>
                      )}
                    </td>

                    {/* Status Bayar */}
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-3.5 py-1 text-xs font-black rounded-full ${
                        inv.status === 'LUNAS' 
                          ? 'bg-green-100 text-green-700' 
                          : inv.status === 'DP' 
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {inv.customStatusLabel || inv.status}
                      </span>
                    </td>

                    {/* Status Produksi */}
                    <td className="px-5 py-4 text-center whitespace-nowrap animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <select
                        id={`select-prod-status-${inv.id}`}
                        value={inv.productionStatus || 'ANTREAN'}
                        onChange={(e) => onUpdateProductionStatus(inv.id, e.target.value as any)}
                        className={`px-3 py-1.5 text-xs font-black rounded-2xl border-2 cursor-pointer outline-none transition duration-150 ${
                          (inv.productionStatus || 'ANTREAN') === 'ANTREAN'
                            ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            : (inv.productionStatus || 'ANTREAN') === 'DESAIN'
                            ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 hover:border-amber-200'
                            : (inv.productionStatus || 'ANTREAN') === 'PROSES'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200'
                            : (inv.productionStatus || 'ANTREAN') === 'SELESAI'
                            ? 'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100 hover:border-teal-200'
                            : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100 hover:border-green-200'
                        }`}
                      >
                        {userRole !== 'PRODUKSI' ? (
                          <>
                            <option value="ANTREAN">⏳ ANTREAN</option>
                            <option value="DESAIN">🎨 DESAIN</option>
                            <option value="PROSES">⚙️ PROSES</option>
                            <option value="SELESAI">✅ SELESAI</option>
                            <option value="SIAP_DIAMBIL">📦 SIAP</option>
                          </>
                        ) : (
                          <>
                            {(inv.productionStatus === 'ANTREAN' || !inv.productionStatus) && (
                              <option value="ANTREAN">⏳ ANTREAN</option>
                            )}
                            <option value="DESAIN">🎨 DESAIN</option>
                            <option value="PROSES">⚙️ PROSES</option>
                            <option value="SELESAI">✅ SELESAI</option>
                            {inv.productionStatus === 'SIAP_DIAMBIL' && (
                              <option value="SIAP_DIAMBIL">📦 SIAP</option>
                            )}
                          </>
                        )}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        
                        {/* Record partial payment / pelunasan button */}
                        {inv.remainingDebt > 0 && userRole !== 'PRODUKSI' && (
                          <button
                            id={`btn-settle-${inv.id}`}
                            onClick={(e) => handleOpenSettle(e, inv)}
                            title="Proses Pelunasan Piutang"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-500 hover:text-white text-indigo-600 rounded-xl transition flex items-center gap-1 text-xs font-black border-none cursor-pointer"
                          >
                            <CircleDollarSign className="w-3.5 h-3.5" />
                            Pelunasan
                          </button>
                        )}

                        {onEditInvoice && userRole !== 'PRODUKSI' && (
                          <button
                            id={`btn-edit-${inv.id}`}
                            onClick={() => onEditInvoice(inv)}
                            title="Edit / Revisi Rincian Nota"
                            className="p-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 rounded-xl transition flex items-center gap-1 text-xs font-black border-none cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Revisi
                          </button>
                        )}

                        {onQuickPrint && (
                          <button
                            id={`btn-quick-print-${inv.id}`}
                            onClick={() => onQuickPrint(inv)}
                            title="Cetak Cepat Nota"
                            className="p-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-1 text-xs font-black border-none cursor-pointer shadow-xs active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Cetak Cepat
                          </button>
                        )}

                        {onDeleteInvoice && userRole === 'OWNER' && (
                          <button
                            id={`btn-delete-${inv.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteInvoiceId(inv.id);
                            }}
                            title="Hapus Nota Permanen"
                            className="p-1.5 bg-rose-50 hover:bg-rose-550 hover:text-white text-rose-600 rounded-xl transition flex items-center gap-1 text-xs font-black border-none cursor-pointer active:scale-95 duration-100"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 group-hover:text-white" />
                            Hapus
                          </button>
                        )}

                        <button
                          id={`btn-view-${inv.id}`}
                          onClick={() => onSelectInvoice(inv)}
                          title="Cetak/Lihat Invoice"
                          className="p-1.5 bg-slate-50 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl transition flex items-center gap-1 text-xs font-black border-none cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pop-up Dialog: Installment / Settle Payment */}
      {settleInvoiceId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="settlement-dialog">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 border-b-2 border-indigo-50 pb-3 font-bold">
              <CircleDollarSign className="text-indigo-500 w-5 h-5" />
              Catat Pelunasan Tagihan Sisa
            </h3>
            
            {(() => {
              const currentInvoice = invoices.find(inv => inv.id === settleInvoiceId);
              if (!currentInvoice) return null;
              
              return (
                <form onSubmit={(e) => handleSaveSettle(e, currentInvoice.id)} className="space-y-4">
                  <div className="p-4 bg-indigo-50/30 rounded-2xl text-xs space-y-1.5 border border-indigo-50 font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">No. Nota:</span>
                      <strong className="text-indigo-600 font-mono font-black">{currentInvoice.invoiceNum}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pelanggan:</span>
                      <strong className="text-slate-800 font-bold">{currentInvoice.customerName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Tagihan:</span>
                      <strong className="text-slate-800 font-mono font-bold">{formatRp(currentInvoice.totalAmount)}</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-indigo-100/60 font-bold">
                      <span className="text-indigo-500 font-bold">Tunggakan Sisa Piutang:</span>
                      <strong className="text-amber-600 font-mono font-black">{formatRp(currentInvoice.remainingDebt)}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1" htmlFor="settle-amount-input">
                      Jumlah Pelunasan Masuk (Rp)
                    </label>
                    <input
                      type="text"
                      id="settle-amount-input"
                      required
                      value={settleAmount === 0 ? '' : settleAmount.toLocaleString('id-ID')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const numVal = val ? parseInt(val, 10) : 0;
                        setSettleAmount(Math.min(currentInvoice.remainingDebt, numVal));
                      }}
                      className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 outline-none focus:border-indigo-500 font-mono font-bold transition"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">
                      * Maksimum pembayaran adalah sisa tunggakan penuh yaitu {formatRp(currentInvoice.remainingDebt)}.
                    </p>
                  </div>

                  {/* Settle Payment Method Selection */}
                  <div className="space-y-2 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setSettleMethod('CASH')}
                        className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          settleMethod === 'CASH'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-750 font-extrabold shadow-3xs'
                            : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        💵 Tunai (Cash)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettleMethod('TRANSFER')}
                        className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          settleMethod === 'TRANSFER'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs'
                            : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        🏦 Transfer
                      </button>
                    </div>

                    {settleMethod === 'TRANSFER' && bankAccounts.length > 0 && (
                      <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-750 text-[10.5px]">
                        <p className="font-extrabold text-slate-500 uppercase tracking-tight mb-1">Daftar Rekening Toko:</p>
                        <div className="space-y-1">
                          {bankAccounts.map((acc) => (
                            <div key={acc.id} className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-lg flex justify-between items-center font-sans">
                              <div>
                                <span className="font-black text-indigo-600 mr-2">{acc.bankName}</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{acc.accountNumber}</span>
                              </div>
                              <span className="text-[9.5px] text-slate-400">a/n {acc.accountOwner}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSettleInvoiceId(null)}
                      className="px-4 py-2.5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 hover:text-slate-800 transition border-none cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      id="btn-confirm-settlement"
                      className="px-5 py-2.5 text-xs font-black bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-white transition flex items-center gap-1.5 uppercase tracking-wider shadow-md shadow-indigo-100 border-none cursor-pointer"
                    >
                      Konfirmasi Pelunasan
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Pop-up Dialog: Confirm Delete Invoice */}
      {deleteInvoiceId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="delete-invoice-dialog">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-rose-600 uppercase tracking-tight flex items-center gap-2 border-b-2 border-rose-50 pb-3 font-bold">
              <AlertTriangle className="text-rose-500 w-5 h-5 animate-pulse" />
              Konfirmasi Hapus Nota
            </h3>
            
            {(() => {
              const currentInvoice = invoices.find(inv => inv.id === deleteInvoiceId);
              if (!currentInvoice) return null;
              
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50/50 rounded-2xl text-xs space-y-1.5 border border-rose-100/50 font-semibold text-rose-950">
                    <p className="font-extrabold text-xs mb-1">Apakah Anda yakin ingin menghapus nota penjualan berikut?</p>
                    <div className="flex justify-between">
                      <span className="text-rose-700 font-medium">No. Nota:</span>
                      <strong className="font-mono font-black">{currentInvoice.invoiceNum}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-700 font-medium">Pelanggan:</span>
                      <strong className="font-bold">{currentInvoice.customerName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-700 font-medium">Total Nilai:</span>
                      <strong className="font-mono font-bold">{formatRp(currentInvoice.totalAmount)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-700 font-medium">Sisa Piutang:</span>
                      <strong className="font-mono font-bold">{formatRp(currentInvoice.remainingDebt)}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    ⚠️ <strong>PERINGATAN:</strong> Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Menghapus nota ini juga akan menghapus data pelunasan kas masuk terkait dari laporan keuangan.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteInvoiceId(null)}
                      className="px-4 py-2.5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 hover:text-slate-800 transition border-none cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-delete"
                      onClick={() => {
                        if (onDeleteInvoice) {
                          onDeleteInvoice(deleteInvoiceId);
                        }
                        setDeleteInvoiceId(null);
                      }}
                      className="px-5 py-2.5 text-xs font-black bg-rose-600 hover:bg-rose-700 rounded-2xl text-white transition flex items-center gap-1.5 uppercase tracking-wider shadow-md shadow-rose-100 border-none cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
