/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StockMovement } from '../types';
import { RotateCcw, Search, BarChart3, HelpCircle, FileDown, ArrowUpRight, ArrowDownRight, RefreshCcw, Printer, X, AlertCircle, Phone, MapPin, ChevronDown, ChevronUp, Check, Settings } from 'lucide-react';

interface LaporanStokProps {
  movements: StockMovement[];
  onClearLogs?: () => void;
}

export default function LaporanStok({ movements, onClearLogs }: LaporanStokProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'SEMAU' | 'IN' | 'OUT' | 'INITIAL'>('SEMAU');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<'a4' | 'pos80' | 'pos58'>(() => {
    const saved = localStorage.getItem('athree-workshop-print-format');
    return (saved as 'a4' | 'pos80' | 'pos58') || 'a4';
  });

  const [showPrintConfig, setShowPrintConfig] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(() => {
    return localStorage.getItem('athree-printer-tujuan') || 'EPSON8BDF43 (L655 Series)';
  });
  const [selectedPages, setSelectedPages] = useState('Semua');
  const [selectedCopies, setSelectedCopies] = useState(1);
  const [selectedLayout, setSelectedLayout] = useState<'potret' | 'lanskap'>(() => {
    return (localStorage.getItem('athree-printer-layout') as 'potret' | 'lanskap') || 'potret';
  });
  const [selectedColor, setSelectedColor] = useState<'warna' | 'monokrom'>(() => {
    return (localStorage.getItem('athree-printer-warna') as 'warna' | 'monokrom') || 'warna';
  });
  const [showOtherSettings, setShowOtherSettings] = useState(false);
  const [isSimulatingPrint, setIsSimulatingPrint] = useState(false);

  const handleSetPrintFormat = (format: 'a4' | 'pos80' | 'pos58') => {
    setPrintFormat(format);
    localStorage.setItem('athree-workshop-print-format', format);
  };

  const formatDateLong = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Filter logs logic
  const filteredMovements = [...movements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((move) => {
      const matchesSearch = 
        move.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        move.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        move.reference.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (typeFilter === 'SEMAU') return matchesSearch;
      if (typeFilter === 'IN') {
        return matchesSearch && (move.type === 'IN' || move.type === 'INITIAL');
      }
      return matchesSearch && move.type === typeFilter;
    });

  // Calculate quick stats in ledger
  const totalItemsSold = movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.qty, 0);
  const totalItemsAdded = movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0);

  // Export JSON utility so they can backup stock
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(movements, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `laporan_mutasi_stok_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6" id="reporting-ledger-panel">
      
      {/* Dashboard Reporting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Laporan Mutasi Stok Otomatis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jejak audit otomatis (Log Audit) - melacak seluruh perubahan masuk, keluar, dan penyesuaian stok per item di gudang.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            id="btn-export-stok-logs"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-black border-none cursor-pointer transition duration-155"
          >
            <FileDown className="w-3.5 h-3.5" />
            Ekspor Log (.json)
          </button>

          <button
            id="btn-print-stok-logs"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black border-none cursor-pointer transition duration-155 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="ledger-counters">
        <div className="p-4.5 rounded-2xl bg-white border-2 border-indigo-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Transaksi Mutasi</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{movements.length} <span className="text-xs font-bold text-slate-400">entri</span></div>
          </div>
          <div className="bg-indigo-50 p-3 text-indigo-600 rounded-2xl">
            <RefreshCcw className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border-2 border-indigo-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider">Persediaan Masuk (Restock)</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">+{totalItemsAdded} <span className="text-xs text-slate-450 font-bold whitespace-nowrap">pcs</span></div>
          </div>
          <div className="bg-green-50 text-emerald-600 p-3 rounded-2xl border-none">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border-2 border-indigo-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider">Persediaan Keluar (Terjual)</span>
            <div className="text-xl font-black text-rose-600 mt-0.5">-{totalItemsSold} <span className="text-xs text-slate-450 font-bold whitespace-nowrap">pcs</span></div>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border-none">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border-2 border-indigo-100 shadow-sm">
        
        {/* Search tool */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="search-movement-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SKU, Nama Produk, atau Referensi Nota..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold outline-none transition"
          />
        </div>

        {/* Buttons filters */}
        <div className="flex items-center gap-1.5 bg-slate-55 p-1 border-none rounded-xl shrink-0">
          <button
            id="type-all-movement"
            onClick={() => setTypeFilter('SEMAU')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition border-none cursor-pointer ${
              typeFilter === 'SEMAU' 
                ? 'bg-indigo-500 text-white shadow-sm' 
                : 'text-slate-500 hover:text-indigo-600 font-bold'
            }`}
          >
            Semua
          </button>
          <button
            id="type-in-movement"
            onClick={() => setTypeFilter('IN')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition border-none cursor-pointer ${
              typeFilter === 'IN' 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'text-slate-500 hover:text-green-600 font-bold'
            }`}
          >
            Masuk / Restock
          </button>
          <button
            id="type-out-movement"
            onClick={() => setTypeFilter('OUT')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition border-none cursor-pointer ${
              typeFilter === 'OUT' 
                ? 'bg-rose-500 text-white shadow-sm' 
                : 'text-slate-500 hover:text-rose-600 font-bold'
            }`}
          >
            Keluar (Penjualan)
          </button>
        </div>
      </div>

      {/* Ledger lists panel */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-sm" id="ledger-history-table-box">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-indigo-150 bg-indigo-50/55 text-xs font-black uppercase tracking-wider text-indigo-700">
                <th className="px-5 py-4">Waktu Mutasi</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Nama Produk</th>
                <th className="px-5 py-4 text-center">Jenis Aktivitas</th>
                <th className="px-5 py-4 text-center">Jumlah Perubahan</th>
                <th className="px-5 py-4 text-center">Alur Level Stok</th>
                <th className="px-5 py-4">Keterangan / Referensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50 text-slate-650">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400 font-bold">
                    Tidak ditemukan rekaman mutasi stok barang yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((move) => {
                  const isAddType = move.type === 'IN' || move.type === 'INITIAL';

                  return (
                    <tr key={move.id} className="hover:bg-indigo-50/10 transition-colors">
                      {/* Waktu */}
                      <td className="px-5 py-4 text-slate-400 text-xs font-bold whitespace-nowrap">
                        {formatDateLong(move.date)}
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-4 font-mono text-indigo-600 font-black text-xs">
                        {move.sku}
                      </td>

                      {/* Product Name */}
                      <td className="px-5 py-4 font-bold text-slate-800 max-w-[200px] truncate">
                        {move.productName}
                      </td>

                      {/* Activity Tag */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${
                          move.type === 'INITIAL'
                            ? 'bg-blue-100 text-blue-700'
                            : move.type === 'IN'
                            ? 'bg-green-100 text-green-700'
                            : move.type === 'OUT'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {move.type === 'INITIAL' 
                            ? 'STOK AWAL' 
                            : move.type === 'IN' 
                            ? 'STOK MASUK' 
                            : move.type === 'OUT' 
                            ? 'STOK KELUAR' 
                            : 'PENYESUAIAN'}
                        </span>
                      </td>

                      {/* Quantity change */}
                      <td className="px-5 py-4 text-center font-mono font-black">
                        <span className={isAddType ? 'text-emerald-600' : 'text-rose-600'}>
                          {isAddType ? `+${move.qty}` : `-${move.qty}`}
                        </span>
                      </td>

                      {/* Stock levels stream */}
                      <td className="px-5 py-4 text-center text-xs font-mono text-slate-400 font-semibold whitespace-nowrap">
                        <span>{move.prevStock}</span>
                        <span className="text-slate-300 mx-1.5">→</span>
                        <strong className="text-slate-800 font-black">{move.currStock}</strong>
                      </td>

                      {/* Note / Reference */}
                      <td className="px-5 py-4 font-sans text-slate-700 font-semibold">
                        <span>{move.reference}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persistent global overlay sheet for Report detail visualization/printing */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="report-print-modal-overlay">
          <div 
            className={`bg-white border-2 border-indigo-100 rounded-3xl w-full transition-all duration-300 shadow-xl relative overflow-hidden my-8 ${
              printFormat === 'pos58' 
                ? 'max-w-[390px]' 
                : printFormat === 'pos80' 
                ? 'max-w-[460px]' 
                : 'max-w-4xl'
            }`} 
            id="report-print-modal-box"
          >
            {/* Top Bar (Hidden on print) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-6 py-4 bg-indigo-50/50 border-b border-indigo-100/80 print:hidden gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-mono">
                  Mutasi Stok
                </span>
                <span className="text-xs font-bold text-slate-500">Cetak Laporan</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Print Sizer Select */}
                <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs shadow-sm">
                  <span className="text-[10px] uppercase font-black text-slate-400">Ukuran Printer:</span>
                  <select
                    id="report-select-print-layout"
                    value={printFormat}
                    onChange={(e) => handleSetPrintFormat(e.target.value as any)}
                    className="bg-transparent font-black text-indigo-600 focus:outline-none cursor-pointer border-none py-0 text-xs"
                  >
                    <option value="a4">📄 A4 / Standar</option>
                    <option value="pos80">🖨️ POS 80mm</option>
                    <option value="pos58">🖨️ POS 58mm</option>
                  </select>
                </div>

                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-black uppercase tracking-wider">
                  💡 Cetakan Di Bagian Bawah
                </span>

                <button
                  id="report-btn-close"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl border-none cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print advice warning (hidden in print) */}
            <div className="px-6 py-3 bg-indigo-50/20 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-600 print:hidden">
              <AlertCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-slate-650 leading-normal">
                <strong className="text-indigo-700">Dimensi Aktif:</strong> Laporan akan di-print menggunakan layout {printFormat === 'a4' ? 'Halaman Standar A4 / Letter' : printFormat === 'pos80' ? 'Printer Kasir POS 80mm' : 'Printer Kasir POS 58mm'}. Area di bawah dapat Anda pratinjau sekarang!
              </p>
            </div>

            {/* Printable Content Frame */}
            <div 
              className={`space-y-6 bg-white text-slate-800 font-sans print:bg-white print:text-black print:p-0 ${
                printFormat === 'a4' 
                  ? 'p-6 md:p-8' 
                  : printFormat === 'pos80' 
                  ? 'p-4 max-w-[80mm] mx-auto format-pos-80 thermal-receipt' 
                  : 'p-2 max-w-[58mm] mx-auto format-pos-58 thermal-receipt'
              }`} 
              id="printable-report-sheet"
            >
              {printFormat === 'a4' ? (
                <>
                  {/* A4 Letterhead */}
                  <div className="flex flex-col md:flex-row md:justify-between border-b pb-5 border-slate-100 print:border-slate-300 print:flex-row">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black tracking-tight text-indigo-600 font-sans uppercase print:text-black">
                        ATHREE STUDIO JAYAPURA
                      </h2>
                      <p className="text-[11px] text-slate-500 max-w-sm font-bold print:text-slate-600">
                        Studio Printing, Custom Apparel, Sablon Jersey Premium &amp; Digital Printing Terpercaya.
                      </p>
                      
                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1.5 font-sans print:text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500 flex-shrink-0 print:text-slate-700" />
                          <span>JL. Raya Tanah Hitam Ruko Samping Hiyake Resto, Jayapura</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 text-left md:text-right flex flex-col justify-between print:mt-0 print:text-right">
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans">
                          LAPORAN INTERNAL
                        </span>
                        <h1 className="text-base font-black font-sans text-indigo-600 print:text-black uppercase">
                          MUTASI STOK BARANG
                        </h1>
                        <div className="text-[11px] text-slate-500 mt-1 print:text-slate-655 font-semibold">
                          Dicetak pada: <strong className="text-slate-800 print:text-black font-bold">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-4 text-xs font-sans">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 print:bg-white print:border-slate-300">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Entri Log</span>
                      <p className="text-sm font-black text-slate-805 mt-1">{filteredMovements.length} transaksi</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 print:bg-white print:border-slate-300">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Barang Masuk</span>
                      <p className="text-sm font-black text-emerald-655 mt-1">+{totalItemsAdded} pcs</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 print:bg-white print:border-slate-300">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Barang Keluar</span>
                      <p className="text-sm font-black text-rose-655 mt-1">-{totalItemsSold} pcs</p>
                    </div>
                  </div>

                  {/* Table of Movements */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden print:border-slate-300">
                    <table className="w-full text-left text-[11px] border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-100 text-slate-705 font-bold border-b border-slate-200 print:bg-slate-200 print:text-slate-900">
                          <th className="p-2 w-8 text-center font-black">No</th>
                          <th className="p-2 w-28 font-black">Waktu</th>
                          <th className="p-2 w-24 font-black">SKU</th>
                          <th className="p-2 font-black">Nama Barang</th>
                          <th className="p-2 text-center w-24 font-black">Aktivitas</th>
                          <th className="p-2 text-center w-20 font-black">Mutasi</th>
                          <th className="p-2 text-center w-24 font-black">Alur Stok</th>
                          <th className="p-2 w-36 font-black">Referensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 print:divide-slate-200">
                        {filteredMovements.map((move, idx) => {
                          const isAdd = move.type === 'IN' || move.type === 'INITIAL';
                          return (
                            <tr key={move.id} className="hover:bg-slate-50/40">
                              <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2 whitespace-nowrap text-slate-500">{formatDateLong(move.date)}</td>
                              <td className="p-2 font-mono font-bold text-indigo-700 print:text-black">{move.sku}</td>
                              <td className="p-2 font-bold">{move.productName}</td>
                              <td className="p-2 text-center font-semibold text-slate-650">
                                {move.type === 'INITIAL' ? 'Stok Awal' : move.type === 'IN' ? 'Stok Masuk' : 'Stok Keluar'}
                              </td>
                              <td className={`p-2 text-center font-mono font-black ${isAdd ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {isAdd ? `+${move.qty}` : `-${move.qty}`}
                              </td>
                              <td className="p-2 text-center font-mono text-slate-505">
                                {move.prevStock} → <strong>{move.currStock}</strong>
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[120px]">{move.reference}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Signature */}
                  <div className="grid grid-cols-2 gap-10 text-center text-xs pt-8 border-t border-slate-100 print:border-slate-300">
                    <div></div>
                    <div className="space-y-12">
                      <p className="text-slate-450 font-bold print:text-slate-700">Penanggung Jawab Gudang</p>
                      <div className="inline-block border-b border-dashed border-slate-300 w-32 print:border-slate-700" />
                      <p className="text-[10px] text-slate-505 font-medium print:text-slate-755">( Kepala Logistik )</p>
                    </div>
                  </div>
                </>
              ) : (
                /* Thermal POS slip layout */
                <div className="flex flex-col items-center text-black font-mono leading-relaxed mx-auto text-left w-full text-[10px]">
                  <div className="text-center w-full space-y-1">
                    <h2 className="text-xs sm:text-sm font-black tracking-tight uppercase text-black">
                      ATHREE STUDIO JAYAPURA
                    </h2>
                    <p className="text-[8px] leading-tight font-bold text-slate-505">
                      LAPORAN RINGKAS MUTASI STOK
                    </p>
                    <p className="text-[8px] text-slate-600">
                      Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center select-none text-[8px] text-slate-400">
                    ----------------------------------------
                  </div>

                  {/* Summary of changes */}
                  <div className="w-full space-y-0.5 font-bold animate-fade-in">
                    <div className="flex justify-between">
                      <span>Rentang Log:</span>
                      <span>{filteredMovements.length} transaksi</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 text-[9px]">
                      <span>Total Masuk  :</span>
                      <span>+{totalItemsAdded} pcs</span>
                    </div>
                    <div className="flex justify-between text-rose-800 text-[9px]">
                      <span>Total Keluar :</span>
                      <span>-{totalItemsSold} pcs</span>
                    </div>
                  </div>

                  <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center select-none text-[8px] text-slate-400">
                    ----------------------------------------
                  </div>

                  {/* Simple vertical listing for POS rolls */}
                  <div className="w-full space-y-2">
                    <p className="font-bold underline text-center mb-1 text-[9px]">RINCIAN MUTASI GUDANG</p>
                    {filteredMovements.slice(0, 15).map((move, idx) => {
                      const isAdd = move.type === 'IN' || move.type === 'INITIAL';
                      return (
                        <div key={move.id} className="space-y-0.5 border-b border-dashed border-slate-205 pb-1">
                          <div className="flex justify-between font-bold text-black text-[9px]">
                            <span>{idx + 1}. {move.productName.slice(0, 18)}..</span>
                            <span className={isAdd ? "text-emerald-700" : "text-rose-700"}>
                              {isAdd ? `+${move.qty}` : `-${move.qty}`}
                            </span>
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-505 font-medium">
                            <span>SKU: {move.sku}</span>
                            <span>{move.prevStock}→{move.currStock} pcs</span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredMovements.length > 15 && (
                      <p className="text-center text-[8px] text-slate-400 italic">
                        * Dan {filteredMovements.length - 15} entri mutasi lainnya...
                      </p>
                    )}
                  </div>

                  <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center select-none text-[8px] text-slate-400">
                    ----------------------------------------
                  </div>

                  <div className="w-full text-center space-y-2 mt-1">
                    <p className="text-[7px] text-slate-400 font-bold italic uppercase">
                      -- AKHIR DARI LAPORAN --<br />
                      SINKRONISASI STOK DIKUNCI SISTEM
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Controls with Print Options (Hidden in print) */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Printer:</span>
                <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded font-extrabold text-[10px] uppercase">
                  💾 {selectedPrinter.split(' ')[0]} ({printFormat.toUpperCase()})
                </span>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  id="report-btn-close-bottom"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-black border-none cursor-pointer transition animate-none"
                >
                  Tutup Dialog
                </button>
                <button
                  id="report-btn-print-bottom"
                  onClick={() => setShowPrintConfig(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs cursor-pointer border-none transition shadow-lg shadow-indigo-600/20"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Nota / Pilih Printer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- HIGH-FIDELITY STOCK REPORT PRINT SETTINGS DIALOG --- */}
      {showPrintConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in print:hidden" id="stock-print-options-backdrop">
          <div className="bg-[#2d2e30] border border-slate-750 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden text-slate-200 font-sans">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  Cetak Laporan Mutasi Stok
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Konfigurasi printer fisik gudang &amp; format slip</p>
              </div>
              <div className="text-[10px] font-black tracking-widest bg-zinc-800 text-sky-300 px-2 py-1 rounded border border-zinc-700">
                {printFormat.toUpperCase()} SLIP
              </div>
            </div>

            {/* Config Fields */}
            <div className="p-5 space-y-4">
              
              {/* Destination printer select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Tujuan Printer</label>
                <div className="relative">
                  <select
                    value={selectedPrinter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPrinter(val);
                      localStorage.setItem('athree-printer-tujuan', val);
                      
                      if (val.includes('80mm')) {
                        handleSetPrintFormat('pos80');
                      } else if (val.includes('58mm')) {
                        handleSetPrintFormat('pos58');
                      }
                    }}
                    className="w-full bg-[#1e1f21] hover:bg-[#252628] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer font-bold transition focus:outline-none appearance-none"
                  >
                    <option value="EPSON8BDF43 (L655 Series)">🖨️ EPSON8BDF43 (L655 Series) - Inkjet</option>
                    <option value="Canon Pixma iP2770 Series">🖨️ Canon Pixma iP2770 Series - Standar</option>
                    <option value="HP DeskJet Ink Advantage 2700">🖨️ HP DeskJet Ink Advantage 2700</option>
                    <option value="Thermal Receipt POS-80 (80mm)">📟 Thermal Receipt POS-80 (Printer Kasir)</option>
                    <option value="Thermal Receipt POS-58 (58mm)">📟 Thermal Receipt POS-58 (Mini Thermal)</option>
                    <option value="Microsoft Print to PDF">📄 Microsoft Print to PDF (Simpan Digital)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Print type format */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Jenis Laporan / Ukuran Kertas</label>
                <div className="relative">
                  <select
                    value={printFormat}
                    onChange={(e) => {
                      const val = e.target.value as 'a4' | 'pos80' | 'pos58';
                      handleSetPrintFormat(val);
                    }}
                    className="w-full bg-[#1e1f21] hover:bg-[#252628] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer font-bold transition focus:outline-none appearance-none"
                  >
                    <option value="a4">📄 Kertas Ukuran A4 (Laporan Detail)</option>
                    <option value="pos80">📟 Printer thermal POS Roll 80mm</option>
                    <option value="pos58">📟 Printer thermal POS Roll 58mm</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
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
                    className="w-full bg-[#1e1f21] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Layout and Color */}
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

              {/* Accordion other custom settings */}
              <div className="border-t border-zinc-750 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOtherSettings(!showOtherSettings)}
                  className="w-full flex justify-between items-center text-xs font-bold text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    Setelan Tambahan Gudang
                  </span>
                  {showOtherSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOtherSettings && (
                  <div className="mt-3 p-3 bg-zinc-800/40 rounded-xl space-y-2 border border-zinc-750 text-[11px] text-zinc-400">
                    <div>• Menyertakan kode SKU barcode item</div>
                    <div>• Rentang logs filter: Terpilih/Aktif layar saat ini</div>
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
                  }, 800);
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

    </div>
  );
}
