/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice } from '../types';
import { Printer, X, CreditCard, AlertCircle, Phone, MapPin } from 'lucide-react';

interface NotaDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onPaySettlement: (invoiceId: string, amount: number) => void;
  onUpdateProductionStatus?: (invoiceId: string, status: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL') => void;
}

export default function NotaDetailModal({ invoice, onClose, onPaySettlement, onUpdateProductionStatus }: NotaDetailModalProps) {
  if (!invoice) return null;

  const [printFormat, setPrintFormat] = useState<'a4' | 'pos80' | 'pos58'>('a4');

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePayRemaining = () => {
    if (confirm(`Apakah Anda ingin melunasi sisa tagihan sebesar ${formatRp(invoice.remainingDebt)} untuk Nota ${invoice.invoiceNum}?`)) {
      onPaySettlement(invoice.id, invoice.remainingDebt);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="detail-modal-overlay">
      
      {/* Container Card - Sizing adapts based on print format for responsive live preview */}
      <div 
        className={`bg-white border-2 border-indigo-100 rounded-3xl w-full transition-all duration-300 shadow-xl relative overflow-hidden my-8 ${
          printFormat === 'pos58' 
            ? 'max-w-[390px]' 
            : printFormat === 'pos80' 
            ? 'max-w-[460px]' 
            : 'max-w-2xl'
        }`} 
        id="detail-modal-box"
      >
        
        {/* Modal Top Control Bar (Hidden in @media print) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-6 py-4 bg-indigo-50/50 border-b border-indigo-100/80 print:hidden gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-mono">
              Nota {invoice.invoiceNum}
            </span>
            <span className="text-xs font-bold text-slate-500">Rincian Nota</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Format Selection Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs shadow-sm">
              <span className="text-[10px] uppercase font-black text-slate-400">Ukuran Printer:</span>
              <select
                id="modal-select-print-layout"
                value={printFormat}
                onChange={(e) => setPrintFormat(e.target.value as any)}
                className="bg-transparent font-black text-indigo-600 focus:outline-none cursor-pointer border-none py-0 text-xs"
              >
                <option value="a4">📄 A4 / Standar</option>
                <option value="pos80">🖨️ POS 80mm</option>
                <option value="pos58">🖨️ POS 58mm</option>
              </select>
            </div>

            {invoice.remainingDebt > 0 && (
              <button
                id="modal-btn-pay-settlement"
                onClick={handlePayRemaining}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-550 hover:bg-green-600 active:scale-95 text-white font-extrabold rounded-xl text-xs border-none cursor-pointer transition shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Bayar Lunas
              </button>
            )}

            <button
              id="modal-btn-print"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold rounded-xl text-xs border-none cursor-pointer transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Nota
            </button>

            <button
              id="modal-btn-close"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl border-none cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Outer instructions alert (Hidden in print) */}
        <div className="px-6 py-3 bg-indigo-50/20 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-600 print:hidden">
          <AlertCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="font-semibold text-slate-650 leading-normal">
            <strong className="text-indigo-700">Printer Terpilih:</strong> {printFormat === 'a4' ? 'Kertas Standar A4 / Letter' : printFormat === 'pos80' ? 'Printer Thermal POS Roll 80mm' : 'Printer Thermal POS Roll 58mm'}. Layout di bawah langsung menyesuaikan dimensi printer Anda saat dicetak!
          </p>
        </div>
        {/* PRINTABLE RECEIPT CONTAINER SHEET */}
        <div 
          className={`space-y-6 bg-white text-slate-800 font-sans print:bg-white print:text-black print:p-0 ${
            printFormat === 'a4' 
              ? 'p-6 md:p-8' 
              : printFormat === 'pos80' 
              ? 'p-4 max-w-[80mm] mx-auto format-pos-80 thermal-receipt' 
              : 'p-2 max-w-[58mm] mx-auto format-pos-58 thermal-receipt'
          }`} 
          id="printable-receipt-sheet"
        >
          {printFormat === 'a4' ? (
            <>
              {/* Receipt Header (Convection Shop Identity / Letterhead) */}
              <div className="flex flex-col md:flex-row md:justify-between border-b pb-5 border-slate-100 print:border-slate-300 print:flex-row">
                <div className="space-y-1">
                  {/* Brand Logo or Text */}
                  <h2 className="text-2xl font-black tracking-tight text-indigo-600 font-sans uppercase print:text-black">
                    ATHREE STUDIO JAYAPURA
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm font-bold print:text-slate-600">
                    Studio Printing, Custom Apparel, Sablon Jersey Premium &amp; Digital Printing Terpercaya.
                  </p>
                  
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1.5 font-sans print:text-slate-700">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500 flex-shrink-0 print:text-slate-700" />
                      <span>JL. Raya Tanah Hitam Ruko Samping Hiyake Resto, Jayapura</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold">
                      <Phone className="w-3 h-3 text-indigo-500 flex-shrink-0 print:text-slate-700" />
                      <span>WhatsApp: +62 812-3456-7890 | IG: @athreestudio_jayapura</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 text-left md:text-right flex flex-col justify-between print:mt-0 print:text-right">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans">
                      DOKUMEN NOTA
                    </span>
                    <h1 className="text-lg font-black font-mono text-indigo-600 print:text-black">
                      {invoice.invoiceNum}
                    </h1>
                    <div className="text-xs text-slate-500 mt-1 print:text-slate-600 font-semibold">
                      Tanggal: <strong className="text-slate-800 print:text-black font-bold">{new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                  </div>

                  <div className="mt-2.5 print:mt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-black rounded-full ${
                      invoice.status === 'LUNAS' 
                        ? 'bg-green-150/80 text-green-700 print:bg-slate-100 print:text-black' 
                        : invoice.status === 'DP' 
                        ? 'bg-indigo-100 text-indigo-750 print:bg-slate-100 print:text-black'
                        : 'bg-rose-100 text-rose-700 print:bg-slate-100 print:text-black'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      STATUS: {invoice.customStatusLabel || invoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Spec Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans print:grid-cols-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 print:bg-white print:border-slate-300">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    DITUJUKAN KEPADA
                  </span>
                  <p className="text-sm font-black text-indigo-600 mt-1 print:text-black">
                    {invoice.customerName}
                  </p>
                  {invoice.customerPhone && (
                    <p className="text-slate-600 mt-0.5 print:text-slate-700 font-semibold">
                      No. Telp / WA: <strong className="font-mono text-slate-800 print:text-black">{invoice.customerPhone}</strong>
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 print:bg-white print:border-slate-300">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                    STATUS PRODUKSI
                  </span>
                  
                  {/* Screen version: Select interactive dropdown */}
                  <div className="print:hidden mt-1">
                    {onUpdateProductionStatus ? (
                      <select
                        id="modal-select-production-status"
                        value={invoice.productionStatus || 'ANTREAN'}
                        onChange={(e) => onUpdateProductionStatus(invoice.id, e.target.value as any)}
                        className={`w-full px-2.5 py-1.5 text-xs font-extrabold rounded-xl border border-indigo-150 cursor-pointer outline-none transition ${
                          (invoice.productionStatus || 'ANTREAN') === 'ANTREAN'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : (invoice.productionStatus || 'ANTREAN') === 'DESAIN'
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : (invoice.productionStatus || 'ANTREAN') === 'PROSES'
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : (invoice.productionStatus || 'ANTREAN') === 'SELESAI'
                            ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <option value="ANTREAN">⏳ ANTREAN</option>
                        <option value="DESAIN">🎨 DESAIN</option>
                        <option value="PROSES">⚙️ PROSES</option>
                        <option value="SELESAI">✅ SELESAI</option>
                        <option value="SIAP_DIAMBIL">📦 SIAP</option>
                      </select>
                    ) : (
                      <span className="font-extrabold text-xs text-indigo-600 block mt-1">
                        {invoice.productionStatus || 'ANTREAN'}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 mt-1 block">Status pengerjaan tim sablon/jahit</span>
                  </div>

                  {/* Print version: Static text badge */}
                  <div className="hidden print:block mt-1.5 font-black text-xs text-black">
                    {invoice.productionStatus === 'DESAIN' && '🎨 TAHAP DESAIN'}
                    {invoice.productionStatus === 'PROSES' && '⚙️ PROSES PRODUKSI'}
                    {invoice.productionStatus === 'SELESAI' && '✅ SELESAI PRODUKSI'}
                    {invoice.productionStatus === 'SIAP_DIAMBIL' && '📦 BARANG SIAP DIAMBIL'}
                    {(!invoice.productionStatus || invoice.productionStatus === 'ANTREAN') && '⏳ ANTREAN PRODUKSI'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 print:bg-white print:border-slate-300">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    MAKLUMAT SPESIFIKASI / CATATAN
                  </span>
                  <p className="text-slate-600 mt-1 print:text-slate-800 italic font-semibold leading-relaxed">
                    {invoice.notes || "Tidak ada catatan spesifikasi tambahan untuk pesanan ini."}
                  </p>
                </div>
              </div>

              {/* Table of items */}
              <div className="border-2 border-indigo-100 rounded-2xl overflow-hidden print:border-slate-300 animate-slide-up">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-indigo-50/60 text-indigo-700 font-black border-none print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                      <th className="px-3.5 py-3 text-center w-10">No</th>
                      <th className="px-3.5 py-3">Nama Item Belanja</th>
                      <th className="px-3.5 py-3 text-right w-24">Harga Satuan</th>
                      <th className="px-4 py-3 text-center w-12">Qty</th>
                      <th className="px-3.5 py-3 text-right w-28 font-black">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 text-slate-755 print:divide-slate-200 print:text-slate-950">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-indigo-50/10 transition-colors">
                        <td className="px-3.5 py-3 text-center font-mono text-slate-400 font-bold print:text-slate-600">{idx + 1}</td>
                        <td className="px-3.5 py-3">
                          <div className="font-black text-slate-800">{item.productName}</div>
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-semibold">{formatRp(item.sellPrice)}</td>
                        <td className="px-4 py-3 text-center font-mono font-black text-slate-800 print:text-black">{item.qty}</td>
                        <td className="px-3.5 py-3 text-right font-mono font-black text-slate-900">{formatRp(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment Terms Summary Sheet */}
              <div className="flex flex-col md:flex-row md:justify-between items-start gap-4 pt-2 border-t border-slate-100 print:border-slate-350 print:flex-row col-gap-5">
                
                <div className="text-slate-400 text-[10px] space-y-1 max-w-sm print:text-slate-700 leading-relaxed font-semibold">
                  <p className="text-slate-500">📌 <strong>Ketentuan Konveksi & Sablon:</strong></p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Nota ini adalah bukti pesanan sah dan terintegrasi sistem gudang otomatis.</li>
                    <li>Barang yang sudah dipotong/sablon tidak dapat diubah ukurannya.</li>
                    <li>Sisa Tagihan (Piutang) wajib dilunasi selambatnya saat pengambilan pesanan.</li>
                  </ul>
                </div>

                {/* Calculations Blocks */}
                <div className="w-full md:w-64 space-y-1.5 text-xs text-slate-500 print:text-slate-900 self-end font-semibold">
                  <div className="flex justify-between">
                    <span>Total Jumlah Barang:</span>
                    <span className="font-mono font-black text-slate-800 print:text-black">{invoice.totalQty} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tagihan:</span>
                    <span className="font-mono font-black text-slate-800 print:text-black">{formatRp(invoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DP (Uang Muka Masuk):</span>
                    <span className="font-mono text-emerald-650 font-black print:text-emerald-800">{formatRp(invoice.downPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelunasan Bertahap:</span>
                    <span className="font-mono text-slate-500 print:text-slate-650 font-bold">{formatRp(invoice.settlement)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-indigo-150 font-black print:border-slate-300">
                    <span className="text-slate-800 print:text-black">Sisa Tagihan (Piutang):</span>
                    <span className={`font-mono ${invoice.remainingDebt > 0 ? 'text-rose-600 font-black print:text-slate-900' : 'text-slate-500 print:text-slate-700'}`}>
                      {formatRp(invoice.remainingDebt)}
                    </span>
                  </div>
                </div>

              </div>

              {/* Signatures Field (Required for physical convection receipts) */}
              <div className="grid grid-cols-2 gap-10 text-center text-xs pt-8 border-t border-slate-100 print:border-slate-300">
                <div className="space-y-12">
                  <p className="text-slate-400 font-bold print:text-slate-700">Penerima / Pemesan</p>
                  <div className="inline-block border-b border-dashed border-slate-300 w-32 print:border-slate-700" />
                  <p className="text-[10px] text-slate-500 font-medium print:text-slate-750">( {invoice.customerName.split(' ')[0]} )</p>
                </div>
                
                <div className="space-y-12">
                  <p className="text-slate-400 font-bold print:text-slate-700">Hormat Kami (Athree Studio)</p>
                  <div className="inline-block border-b border-dashed border-slate-300 w-32 print:border-slate-700" />
                  <p className="text-[10px] text-slate-500 font-medium print:text-slate-755">( Administrasi Toko )</p>
                </div>
              </div>
            </>
          ) : (
            /* Dedicated POS Thermal Receipt Layout */
            <div className="flex flex-col items-center text-black font-mono leading-relaxed mx-auto text-left w-full">
              <div className="text-center w-full space-y-1">
                <h2 className="text-xs sm:text-sm font-black tracking-tight uppercase text-black">
                  ATHREE STUDIO JAYAPURA
                </h2>
                <p className="text-[9px] leading-tight font-semibold text-slate-500">
                  Studio Printing, Custom Apparel, Sablon Jersey Premium &amp; Digital Printing
                </p>
                <p className="text-[9px] text-slate-600">
                  JL. Raya Tanah Hitam, Jayapura
                </p>
                <p className="text-[9px] text-slate-600 font-bold">
                  WA: +62 812-3456-7890 | IG: @athreestudio_jayapura
                </p>
              </div>

              {/* Dashed line */}
              <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center text-[10px] font-bold text-slate-300 select-none">
                ----------------------------------------
              </div>

              {/* Metadata log info */}
              <div className="w-full space-y-1 text-[10px] text-slate-700 font-mono">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-extrabold text-black">{invoice.invoiceNum}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal :</span>
                  <span>{new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold text-black">{invoice.customerName}</span>
                </div>
                {invoice.customerPhone && (
                  <div className="flex justify-between">
                    <span>WA/Telp  :</span>
                    <span>{invoice.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status Payment:</span>
                  <span className="font-black text-black">
                    {invoice.customStatusLabel || invoice.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pengerjaan:</span>
                  <span className="font-black text-black">
                    {invoice.productionStatus || 'ANTREAN'}
                  </span>
                </div>
              </div>

              {/* Dashed line */}
              <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center text-[10px] font-bold text-slate-300 select-none">
                ----------------------------------------
              </div>

              {/* Items details */}
              <div className="w-full space-y-2 text-[10px]">
                {invoice.items.map((item, idx) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-black">
                      <span>{idx + 1}. {item.productName}</span>
                      <span>{formatRp(item.total)}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 pl-3">
                      {item.qty} pcs x {formatRp(item.sellPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dashed line */}
              <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center text-[10px] font-bold text-slate-300 select-none">
                ----------------------------------------
              </div>

              {/* Totals math section */}
              <div className="w-full space-y-1 text-[10px] text-slate-700">
                <div className="flex justify-between">
                  <span>Total Qty:</span>
                  <span>{invoice.totalQty} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tagihan:</span>
                  <span className="font-bold text-black">{formatRp(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Uang Muka (DP):</span>
                  <span>{formatRp(invoice.downPayment)}</span>
                </div>
                {invoice.settlement > 0 && (
                  <div className="flex justify-between">
                    <span>Pelunasan Bertahap:</span>
                    <span>{formatRp(invoice.settlement)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dashed border-slate-300 font-extrabold text-black">
                  <span>Sisa Tagihan (Piutang):</span>
                  <span className={invoice.remainingDebt > 0 ? "text-rose-600 font-black" : "text-slate-600"}>
                    {formatRp(invoice.remainingDebt)}
                  </span>
                </div>
              </div>

              {/* Notes block in receipt */}
              {invoice.notes && (
                <>
                  {/* Dashed line */}
                  <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center text-[10px] font-bold text-slate-300 select-none">
                    ----------------------------------------
                  </div>
                  <div className="w-full text-left text-[9px] italic text-slate-600 leading-normal bg-slate-50 p-2 rounded-xl">
                    <span className="font-black text-slate-400 block uppercase tracking-wider text-[8px] not-italic">Catatan / Spesifikasi:</span>
                    {invoice.notes}
                  </div>
                </>
              )}

              {/* Dashed line */}
              <div className="w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center text-[10px] font-bold text-slate-300 select-none">
                ----------------------------------------
              </div>

              <div className="w-full text-center space-y-3 mt-1.5">
                <p className="text-[8px] text-slate-400 font-bold italic leading-tight uppercase">
                  -- TERIMA KASIH ATAS KUNJUNGANNYA --<br />
                  PESANAN SAH TERDEDUKSI GUDANG OTOMATIS
                </p>

                {/* POS Signature line */}
                <div className="grid grid-cols-2 gap-4 text-[9px] pt-2">
                  <div className="space-y-6 text-center">
                    <span>Penerima</span>
                    <div className="border-b border-dashed border-slate-300 mx-auto w-12" />
                    <span className="text-slate-400 text-[8px]">({invoice.customerName.split(' ')[0]})</span>
                  </div>
                  <div className="space-y-6 text-center">
                    <span>Kasir Toko</span>
                    <div className="border-b border-dashed border-slate-300 mx-auto w-12" />
                    <span className="text-slate-400 text-[8px]">(Athree Studio)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Hidden in print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 print:hidden">
          <button
            id="modal-btn-close-bottom"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-black border-none cursor-pointer transition"
          >
            Tutup Dialog
          </button>
        </div>

      </div>
    </div>
  );
}
