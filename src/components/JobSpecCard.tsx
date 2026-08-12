import React from 'react';
import { Invoice } from '../types';
import { Clock, Scissors, Tag, Layers, Shirt, Flame, AlertTriangle } from 'lucide-react';

export interface JobSpecification {
  jenisProduksi: string;
  polaBadan: string;
  jenisKain: string;
  waktuPengerjaan: string;
  modelKerah: string;
  estimasiDeadline: string;
}

export function parseJobSpecs(invoice: Invoice): JobSpecification {
  const notes = invoice.notes || '';
  const itemNames = invoice.items ? invoice.items.map(i => i.productName).join(' ') : '';
  const fullText = (itemNames + ' ' + notes).toLowerCase();

  // Helper to extract custom spec if key exists in notes (e.g. "Jenis Produksi: DTF")
  const findValue = (keys: string[]): string | null => {
    for (const key of keys) {
      const regex = new RegExp(`${key}\\s*[:=]\\s*([^,|\\n\\;]+)`, 'i');
      const match = notes.match(regex);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    return null;
  };

  // 1. Jenis Produksi
  let jenisProduksi = findValue(['jenis produksi', 'produksi', 'jenis print', 'teknik']);
  if (!jenisProduksi) {
    if (/dtf/i.test(fullText)) jenisProduksi = 'Sablon DTF';
    else if (/bordir/i.test(fullText)) jenisProduksi = 'Bordir Komputer';
    else if (/polyflex/i.test(fullText)) jenisProduksi = 'Polyflex';
    else if (/screen|manual/i.test(fullText)) jenisProduksi = 'Sablon Manual';
    else jenisProduksi = 'S.FullP'; // Default standard Sublimation Full Print
  }

  // 2. Pola Badan
  let polaBadan = findValue(['pola badan', 'pola', 'model baju', 'potongan']);
  if (!polaBadan) {
    if (/panjang|lg\.pnjg|lengan panjang/i.test(fullText)) polaBadan = 'Std Lg.Pnjg';
    else if (/raglan/i.test(fullText)) polaBadan = 'Pola Raglan';
    else if (/singlet|kutang|tanpa lengan/i.test(fullText)) polaBadan = 'Singlet/Tanpa Lengan';
    else if (/oversize/i.test(fullText)) polaBadan = 'Oversize Fit';
    else polaBadan = 'Std Lg.Pndk'; // Default Standard Lengan Pendek
  }

  // 3. Jenis Kain Baju
  let jenisKain = findValue(['jenis kain baju', 'jenis kain', 'kain', 'bahan']);
  if (!jenisKain) {
    if (/jarum/i.test(fullText)) jenisKain = 'DRYFIT JARUM';
    else if (/dryfit|drifit|dry-fit/i.test(fullText)) jenisKain = 'DRYFIT';
    else if (/pique|polo|wafell|wafel/i.test(fullText)) jenisKain = 'PIQUE WAFEL';
    else if (/combed|cotton|katun/i.test(fullText)) jenisKain = 'COTTON COMBED';
    else if (/hyget/i.test(fullText)) jenisKain = 'HYGET SERENA';
    else jenisKain = 'MILANO'; // Default MILANO as in sample image
  }

  // 4. Waktu Pengerjaan
  let waktuPengerjaan = findValue(['waktu pengerjaan', 'waktu', 'tipe pengerjaan', 'prioritas']);
  if (!waktuPengerjaan) {
    if (invoice.deadlineDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dl = new Date(invoice.deadlineDate);
      dl.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3 && diffDays >= 0) waktuPengerjaan = 'EXPRESS / KILAT';
      else if (diffDays < 0) waktuPengerjaan = 'URGENT OVERDUE';
      else waktuPengerjaan = 'NORMAL';
    } else {
      waktuPengerjaan = 'NORMAL';
    }
  }

  // 5. Model Kerah
  let modelKerah = findValue(['model kerah', 'kerah', 'neck']);
  if (!modelKerah) {
    if (/v\s*neck|v-neck/i.test(fullText)) modelKerah = 'V NECK';
    else if (/kerah|wangki|polo/i.test(fullText)) modelKerah = 'POLO KERAH';
    else if (/sanghai|shanghai/i.test(fullText)) modelKerah = 'SANGHAI';
    else if (/round|melingkar/i.test(fullText)) modelKerah = 'ROUND NECK';
    else modelKerah = 'O NECK'; // Default O NECK
  }

  // 6. Estimasi Deadline
  let estimasiDeadline = 'Terjadwal';
  if (invoice.deadlineDate) {
    const parts = invoice.deadlineDate.slice(0, 10).split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      estimasiDeadline = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      estimasiDeadline = invoice.deadlineDate;
    }
  } else if (invoice.date) {
    const parts = invoice.date.slice(0, 10).split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + 7);
      estimasiDeadline = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      estimasiDeadline = invoice.date;
    }
  }

  return {
    jenisProduksi,
    polaBadan,
    jenisKain,
    waktuPengerjaan,
    modelKerah,
    estimasiDeadline
  };
}

interface JobSpecCardProps {
  key?: React.Key;
  invoice: Invoice;
  onSelect?: (invoice: Invoice) => void;
  onUpdateProductionStatus?: (id: string, status: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL' | 'SUDAH_DIAMBIL') => void;
  showStatusDropdown?: boolean;
  className?: string;
}

export default function JobSpecCard({
  invoice,
  onSelect,
  onUpdateProductionStatus,
  showStatusDropdown = true,
  className = ''
}: JobSpecCardProps) {
  const specs = parseJobSpecs(invoice);

  // Status color styles
  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'DESAIN':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'PROSES':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
      case 'SELESAI':
        return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
      case 'SIAP_DIAMBIL':
      case 'SUDAH_DIAMBIL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const isTakenWithDebt = (invoice.productionStatus === 'SUDAH_DIAMBIL' || invoice.productionStatus === 'SIAP_DIAMBIL') && invoice.remainingDebt > 0;

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div
      onClick={() => onSelect?.(invoice)}
      className={`bg-white dark:bg-slate-900 border-2 ${
        isTakenWithDebt 
          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20' 
          : 'border-slate-200 dark:border-slate-800'
      } rounded-3xl p-5 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200 cursor-pointer space-y-4 group relative overflow-hidden ${className}`}
    >
      {/* Banner Merah untuk Barang DIAMBIL tapi Belum Lunas */}
      {isTakenWithDebt && (
        <div className="bg-rose-600 text-white rounded-2xl px-3 py-1.5 flex items-center justify-between gap-2 shadow-md animate-pulse">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            🔴 DIAMBIL (BELUM LUNAS)
          </span>
          <span className="font-mono font-black text-xs text-amber-200 bg-rose-800/80 px-2 py-0.5 rounded-lg border border-rose-500">
            Sisa: {formatRp(invoice.remainingDebt)}
          </span>
        </div>
      )}
      {/* Top Header: Invoice No, Pemesan, Status Dropdown */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
              {invoice.invoiceNum}
            </span>
            <span className="text-slate-300 dark:text-slate-700 font-black">•</span>
            <span className="font-black text-slate-800 dark:text-slate-100 text-xs truncate max-w-[150px] sm:max-w-[200px]" title={invoice.customerName}>
              {invoice.customerName}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
            <span>Total Qty: <strong className="text-slate-700 dark:text-slate-300">{invoice.totalQty} pcs</strong></span>
            <span>•</span>
            <span>{new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
          </p>
        </div>

        {/* Status Dropdown / Badge */}
        {showStatusDropdown && onUpdateProductionStatus ? (
          <select
            value={invoice.productionStatus || 'ANTREAN'}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onUpdateProductionStatus(invoice.id, e.target.value as any);
            }}
            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xl border cursor-pointer outline-none transition ${getStatusBadgeClass(invoice.productionStatus)}`}
          >
            <option value="ANTREAN">⏳ ANTREAN</option>
            <option value="DESAIN">🎨 DESAIN</option>
            <option value="PROSES">⚙️ PROSES</option>
            <option value="SELESAI">✅ SELESAI</option>
            <option value="SIAP_DIAMBIL">📦 SIAP</option>
            <option value="SUDAH_DIAMBIL">🤝 DIAMBIL</option>
          </select>
        ) : (
          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl border ${getStatusBadgeClass(invoice.productionStatus)}`}>
            {invoice.productionStatus || 'ANTREAN'}
          </span>
        )}
      </div>

      {/* Dotted Specification Card Content - MATCHING USER'S ATTACHED IMAGE */}
      <div className="space-y-2 text-xs font-sans">
        
        {/* Row 1: Jenis Produksi */}
        <div className="flex items-baseline justify-between gap-1 text-slate-600 dark:text-slate-300">
          <span className="font-semibold shrink-0 text-slate-500 dark:text-slate-400">Jenis Produksi</span>
          <div className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-1.5 transform -translate-y-0.5" />
          <span className="font-black text-slate-900 dark:text-white shrink-0 font-mono tracking-tight">{specs.jenisProduksi}</span>
        </div>

        {/* Row 2: Pola Badan */}
        <div className="flex items-baseline justify-between gap-1 text-slate-600 dark:text-slate-300">
          <span className="font-semibold shrink-0 text-slate-500 dark:text-slate-400">Pola Badan</span>
          <div className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-1.5 transform -translate-y-0.5" />
          <span className="font-black text-slate-900 dark:text-white shrink-0 font-mono tracking-tight">{specs.polaBadan}</span>
        </div>

        {/* Row 3: Jenis Kain Baju */}
        <div className="flex items-baseline justify-between gap-1 text-slate-600 dark:text-slate-300">
          <span className="font-semibold shrink-0 text-slate-500 dark:text-slate-400">Jenis Kain Baju</span>
          <div className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-1.5 transform -translate-y-0.5" />
          <span className="font-black text-slate-900 dark:text-white shrink-0 font-mono tracking-tight">{specs.jenisKain}</span>
        </div>

        {/* Row 4: Waktu Pengerjaan */}
        <div className="flex items-baseline justify-between gap-1 text-slate-600 dark:text-slate-300">
          <span className="font-semibold shrink-0 text-slate-500 dark:text-slate-400">Waktu Pengerjaan</span>
          <div className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-1.5 transform -translate-y-0.5" />
          <span className="font-black text-slate-900 dark:text-white shrink-0 font-mono tracking-tight">{specs.waktuPengerjaan}</span>
        </div>

        {/* Row 5: Model Kerah */}
        <div className="flex items-baseline justify-between gap-1 text-slate-600 dark:text-slate-300">
          <span className="font-semibold shrink-0 text-slate-500 dark:text-slate-400">Model Kerah</span>
          <div className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-1.5 transform -translate-y-0.5" />
          <span className="font-black text-slate-900 dark:text-white shrink-0 font-mono tracking-tight">{specs.modelKerah}</span>
        </div>

        {/* Row 6: ESTIMASI DEADLINE (Red/Pink Highlighted) */}
        <div className="flex items-baseline justify-between gap-1 pt-1.5 text-rose-500 dark:text-rose-400">
          <span className="font-black uppercase tracking-wider shrink-0 text-[11px]">ESTIMASI DEADLINE</span>
          <div className="flex-1 border-b-2 border-dotted border-rose-300 dark:border-rose-800 mx-1.5 transform -translate-y-0.5" />
          <span className="font-black text-right shrink-0 text-xs font-mono">{specs.estimasiDeadline}</span>
        </div>

      </div>

      {/* Optional Note excerpt if exists */}
      {invoice.notes && (
        <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 italic truncate border-t border-slate-100 dark:border-slate-800">
          Catatan: <span className="font-medium text-slate-700 dark:text-slate-300">{invoice.notes}</span>
        </div>
      )}
    </div>
  );
}
