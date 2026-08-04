import React, { useState, useMemo, useEffect } from 'react';
import { Invoice } from '../types';
import { AlertTriangle, Flame, Clock, ChevronRight, X, ChevronUp, ChevronDown, Gauge, Check } from 'lucide-react';

interface DeadlineTickerProps {
  invoices: Invoice[];
  onSelectInvoice?: (invoice: Invoice) => void;
}

export const SPEED_PRESETS = [
  { label: 'Sangat Lambat', value: 140, desc: '140s / siklus (Sangat mudah dibaca)' },
  { label: 'Lambat', value: 95, desc: '95s / siklus (Nyaman dibaca)' },
  { label: 'Sedang', value: 60, desc: '60s / siklus (Standar)' },
  { label: 'Cepat', value: 35, desc: '35s / siklus (Agak cepat)' },
  { label: 'Sangat Cepat', value: 18, desc: '18s / siklus (Maksimal)' },
];

export default function DeadlineTicker({ invoices, onSelectInvoice }: DeadlineTickerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Load speed setting from localStorage or default to 95 seconds
  const [tickerSpeed, setTickerSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nota_running_text_speed');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 5) return parsed;
      }
    } catch {
      // fallback
    }
    return 95;
  });

  // Listen to external speed changes (e.g. from PengaturanToko)
  useEffect(() => {
    const handleSpeedChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent.detail && typeof customEvent.detail === 'number') {
        setTickerSpeed(customEvent.detail);
      } else {
        const saved = localStorage.getItem('nota_running_text_speed');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) setTickerSpeed(parsed);
        }
      }
    };

    window.addEventListener('nota-running-text-speed-changed', handleSpeedChange);
    return () => {
      window.removeEventListener('nota-running-text-speed-changed', handleSpeedChange);
    };
  }, []);

  const handleUpdateSpeed = (newSpeed: number) => {
    setTickerSpeed(newSpeed);
    try {
      localStorage.setItem('nota_running_text_speed', String(newSpeed));
      window.dispatchEvent(new CustomEvent('nota-running-text-speed-changed', { detail: newSpeed }));
    } catch (e) {
      console.error("Gagal menyimpan setelan kecepatan running text:", e);
    }
    setShowSpeedMenu(false);
  };

  // Filter urgent invoices where deadlineDate is within 1-7 days before deadline or overdue (diffDays <= 7) AND job is still in progress
  const urgentInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices
      .filter((inv) => {
        if (!inv.deadlineDate) return false;
        
        // Skip completed/finished jobs (only show jobs still being processed)
        const isCompleted = inv.productionStatus === 'SELESAI' || 
                            inv.productionStatus === 'SIAP_DIAMBIL' || 
                            inv.productionStatus === 'SUDAH_DIAMBIL';
        if (isCompleted) return false;

        const parts = inv.deadlineDate.slice(0, 10).split('-').map(Number);
        if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return false;
        
        const [y, m, d] = parts;
        const deadline = new Date(y, m - 1, d);
        deadline.setHours(0, 0, 0, 0);

        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 7; // <= 7 days before deadline or overdue
      })
      .map((inv) => {
        const parts = inv.deadlineDate!.slice(0, 10).split('-').map(Number);
        const [y, m, d] = parts;
        const deadline = new Date(y, m - 1, d);
        deadline.setHours(0, 0, 0, 0);

        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return { inv, diffDays };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [invoices]);

  if (isDismissed || urgentInvoices.length === 0) {
    return null;
  }

  // Format date helper
  const formatDateShort = (dateStr: string) => {
    try {
      const parts = dateStr.slice(0, 10).split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Helper for badge styling based on diffDays
  const getBadgeStyle = (diffDays: number) => {
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        bg: 'bg-rose-600 text-white border-rose-400/30',
        text: `TELAT ${absDays} HARI`,
        icon: <Flame className="w-3.5 h-3.5 animate-bounce text-rose-200 shrink-0" />
      };
    }
    if (diffDays === 0) {
      return {
        bg: 'bg-amber-600 text-white border-amber-400/30',
        text: 'HARI INI',
        icon: <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-200 shrink-0" />
      };
    }
    if (diffDays === 1) {
      return {
        bg: 'bg-orange-600 text-white border-orange-400/30',
        text: 'BESOK (H-1)',
        icon: <Clock className="w-3.5 h-3.5 text-orange-200 shrink-0" />
      };
    }
    if (diffDays === 2) {
      return {
        bg: 'bg-amber-500 text-slate-950 border-amber-300/40',
        text: 'H-2',
        icon: <Clock className="w-3.5 h-3.5 text-slate-900 shrink-0" />
      };
    }
    if (diffDays === 3) {
      return {
        bg: 'bg-sky-600 text-white border-sky-400/30',
        text: 'H-3',
        icon: <Clock className="w-3.5 h-3.5 text-sky-200 shrink-0" />
      };
    }
    if (diffDays <= 5) {
      return {
        bg: 'bg-indigo-600 text-white border-indigo-400/30',
        text: `H-${diffDays}`,
        icon: <Clock className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
      };
    }
    return {
      bg: 'bg-slate-700 text-slate-100 border-slate-600',
      text: `H-${diffDays}`,
      icon: <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
    };
  };

  // Duplicate items array to ensure seamless continuous marquee loop
  const repeatCount = urgentInvoices.length < 5 ? 6 : 3;
  const marqueeItems = Array(repeatCount).fill(urgentInvoices).flat();

  const currentPresetLabel = SPEED_PRESETS.find(p => p.value === tickerSpeed)?.label || `${tickerSpeed}s`;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 print:hidden select-none transition-all duration-300 shadow-2xl"
      id="deadline-running-text-bar"
    >
      {isMinimized ? (
        /* Minimized state bar */
        <div className="bg-slate-950/90 backdrop-blur-md border-t border-rose-500/30 text-white px-4 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-black text-rose-300 tracking-wide uppercase text-[11px]">
              {urgentInvoices.length} NOTA DEADLINE ≤ 7 HARI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-extrabold transition cursor-pointer"
            >
              <ChevronUp className="w-3 h-3" />
              Tampilkan Running Text
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Expanded Running Text Bar */
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 text-white border-t border-rose-500/40 shadow-2xl flex items-center h-11 overflow-hidden relative">
          
          {/* Fixed Left Header Label */}
          <div className="shrink-0 z-10 px-3.5 py-1 bg-rose-600/90 backdrop-blur-xs text-white flex items-center gap-2 shadow-lg border-r border-rose-400/30 h-full">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <Flame className="w-3.5 h-3.5 text-white relative z-10" />
            </div>
            <span className="font-black text-[11px] uppercase tracking-wider whitespace-nowrap hidden sm:inline">
              DEADLINE ≤ 7 HARI
            </span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded-md font-extrabold text-[10px] whitespace-nowrap">
              {urgentInvoices.length} Nota
            </span>
          </div>

          {/* Center Marquee Content */}
          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            {/* Soft Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

            <div 
              className="animate-marquee-infinite flex items-center gap-6 px-4"
              style={{ animationDuration: `${tickerSpeed}s` }}
            >
              {marqueeItems.map(({ inv, diffDays }, idx) => {
                const badge = getBadgeStyle(diffDays);
                const formatRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;
                
                return (
                  <div
                    key={`${inv.id}-${idx}`}
                    onClick={() => onSelectInvoice?.(inv)}
                    className="flex items-center gap-2.5 py-1 px-3 bg-slate-850/80 hover:bg-rose-950/70 border border-slate-700/60 hover:border-rose-400/50 rounded-xl transition cursor-pointer shrink-0 group shadow-xs"
                    title="Klik untuk lihat detail nota"
                  >
                    {/* Badge status diff days */}
                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase tracking-tight shadow-xs ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.text}</span>
                    </div>

                    {/* Invoice Info */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-black text-rose-300 group-hover:text-rose-200">
                        {inv.invoiceNum}
                      </span>
                      <span className="text-slate-400 font-bold">•</span>
                      {(() => {
                        const st = inv.productionStatus || 'ANTREAN';
                        if (st === 'DESAIN') return <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/30 whitespace-nowrap">🎨 DESAIN</span>;
                        if (st === 'PROSES') return <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-blue-500/30 text-blue-200 border border-blue-400/30 whitespace-nowrap">⚙️ PROSES</span>;
                        return <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500/30 text-amber-200 border border-amber-400/30 whitespace-nowrap">⏳ ANTREAN</span>;
                      })()}
                      <span className="text-slate-400 font-bold">•</span>
                      <span className="font-extrabold text-slate-100 max-w-[120px] truncate">
                        {inv.customerName || 'Pelanggan'}
                      </span>
                      <span className="text-slate-400 font-bold">•</span>
                      <span className="text-slate-300 text-[11px] font-semibold">
                        Tgl: <strong className="text-white font-extrabold">{formatDateShort(inv.deadlineDate!)}</strong>
                      </span>
                      <span className="text-slate-400 font-bold">•</span>
                      <span className="text-amber-300 text-[11px] font-bold">
                        Sisa: {formatRupiah(inv.remainingDebt > 0 ? inv.remainingDebt : inv.totalAmount)}
                      </span>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition group-hover:translate-x-0.5" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="shrink-0 z-10 px-2 py-1 bg-slate-950/90 backdrop-blur-xs border-l border-slate-800 flex items-center gap-1.5 h-full relative">
            
            {/* Speed Control Button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer border border-slate-700/80 ${
                  showSpeedMenu ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Atur Kecepatan Running Text"
              >
                <Gauge className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">{currentPresetLabel}</span>
              </button>

              {/* Speed Popover Menu */}
              {showSpeedMenu && (
                <div className="absolute right-0 bottom-12 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 text-slate-200 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>Kecepatan Running Text</span>
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  {SPEED_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleUpdateSpeed(preset.value)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition cursor-pointer ${
                        tickerSpeed === preset.value
                          ? 'bg-indigo-600 text-white font-black'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{preset.label}</div>
                        <div className={`text-[9px] ${tickerSpeed === preset.value ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {preset.desc}
                        </div>
                      </div>
                      {tickerSpeed === preset.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Minimize Bar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg transition cursor-pointer"
              title="Tutup Ticker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
