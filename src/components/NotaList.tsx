/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice } from '../types';
import { Search, Eye, CircleDollarSign, Calendar, ChevronRight, Filter, Receipt, Edit } from 'lucide-react';

interface NotaListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onPaySettlement: (invoiceId: string, amount: number) => void;
  onUpdateProductionStatus: (invoiceId: string, status: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL') => void;
  onEditInvoice?: (invoice: Invoice) => void;
  userRole?: 'KASIR' | 'OWNER';
}

export default function NotaList({ invoices, onSelectInvoice, onPaySettlement, onUpdateProductionStatus, onEditInvoice, userRole = 'OWNER' }: NotaListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMAU' | 'LUNAS' | 'DP' | 'BELUM_BAYAR'>('SEMAU');
  
  // Settle amount handler state per invoice (for inline partial payment popups)
  const [settleInvoiceId, setSettleInvoiceId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

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

  const handleOpenSettle = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setSettleInvoiceId(invoice.id);
    setSettleAmount(invoice.remainingDebt);
  };

  const handleSaveSettle = (e: React.FormEvent, invoiceId: string) => {
    e.preventDefault();
    if (settleAmount <= 0) return;
    onPaySettlement(invoiceId, settleAmount);
    setSettleInvoiceId(null);
  };

  // Filter logic
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'SEMAU') return matchesSearch;
    return matchesSearch && inv.status === statusFilter;
  });

  return (
    <div className="space-y-6" id="nota-list-view">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-500" />
            Daftar Nota Penjualan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola piutang, pelunasan pembayaran bertahap, dan cetak slip pembelanjaan untuk pelanggan.
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="search-nota-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pemesan atau nomor nota..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-155 focus:ring-0"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 border-2 border-indigo-100 rounded-2xl shadow-sm">
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
                  <td colSpan={12} className="px-5 py-16 text-center text-slate-400 font-bold">
                    Tidak ditemukan nota penjualan dengan kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr 
                    key={inv.id}
                    className="hover:bg-indigo-50/10 border-b border-indigo-50/30 transition-colors group cursor-pointer text-slate-700"
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

                    {/* Customer */}
                    <td className="px-5 py-4 font-bold text-slate-800 max-w-[180px] truncate">
                      {inv.customerName}
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
                        <option value="ANTREAN">⏳ ANTREAN</option>
                        <option value="DESAIN">🎨 DESAIN</option>
                        <option value="PROSES">⚙️ PROSES</option>
                        <option value="SELESAI">✅ SELESAI</option>
                        <option value="SIAP_DIAMBIL">📦 SIAP</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        
                        {/* Record partial payment / pelunasan button */}
                        {inv.remainingDebt > 0 && (
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

                        {onEditInvoice && (
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
                      type="number"
                      id="settle-amount-input"
                      required
                      min="1"
                      max={currentInvoice.remainingDebt}
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(Math.min(currentInvoice.remainingDebt, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 outline-none focus:border-indigo-500 font-mono font-bold transition"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">
                      * Maksimum pembayaran adalah sisa tunggakan penuh yaitu {formatRp(currentInvoice.remainingDebt)}.
                    </p>
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

    </div>
  );
}
