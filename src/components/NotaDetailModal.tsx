/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice } from '../types';
import { Printer, X, CreditCard, AlertCircle, Phone, MapPin, Eye, Settings, HelpCircle, Columns, ChevronDown, ChevronUp, Check, Shield } from 'lucide-react';
import LogoRenderer from './LogoRenderer';

interface NotaDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onPaySettlement: (invoiceId: string, amount: number, paymentMethod?: 'CASH' | 'TRANSFER') => void;
  onUpdateProductionStatus?: (invoiceId: string, status: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL') => void;
  isQuickPrint?: boolean;
}

export default function NotaDetailModal({ invoice, onClose, onPaySettlement, onUpdateProductionStatus, isQuickPrint = false }: NotaDetailModalProps) {
  if (!invoice) return null;

  const bankAccounts = React.useMemo(() => {
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
  }, []);

  const [printFormat, setPrintFormat] = useState<'a4' | 'pos80' | 'pos58'>(() => {
    const saved = localStorage.getItem('athree-workshop-print-format');
    return (saved as 'a4' | 'pos80' | 'pos58') || 'a4';
  });

  const [printerWidth, setPrinterWidth] = useState<string>(() => {
    return localStorage.getItem('last_used_printer_size') || '80mm';
  });

  // States for custom print dialog simulation
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
  const [showPaySelect, setShowPaySelect] = useState(false);

  // Logo & Shop Details loading
  const [logoType, setLogoType] = useState<'none' | 'preset' | 'custom'>(() => {
    return (localStorage.getItem('athree-shop-logo-type') as 'none' | 'preset' | 'custom') || 'preset';
  });
  const [presetKey, setPresetKey] = useState<string>(() => {
    return localStorage.getItem('athree-shop-logo-preset') || 'shield';
  });
  const [customUrl, setCustomUrl] = useState<string | null>(() => {
    return localStorage.getItem('athree_custom_logo_data');
  });
  const [shopName, setShopName] = useState<string>(() => {
    return localStorage.getItem('athree-shop-name') || 'ATHREE STUDIO JAYAPURA';
  });
  const [shopSlogan, setShopSlogan] = useState<string>(() => {
    return localStorage.getItem('athree-shop-slogan') || 'Studio Printing, Custom Apparel, Sablon Jersey Premium & Digital Printing Terpercaya.';
  });

  // Listen for logo alterations
  React.useEffect(() => {
    const reloadLogoSettings = () => {
      setLogoType((localStorage.getItem('athree-shop-logo-type') as 'none' | 'preset' | 'custom') || 'preset');
      setPresetKey(localStorage.getItem('athree-shop-logo-preset') || 'shield');
      setCustomUrl(localStorage.getItem('athree_custom_logo_data'));
      setShopName(localStorage.getItem('athree-shop-name') || 'ATHREE STUDIO JAYAPURA');
      setShopSlogan(localStorage.getItem('athree-shop-slogan') || 'Studio Printing, Custom Apparel, Sablon Jersey Premium & Digital Printing Terpercaya.');
    };

    window.addEventListener('athree-logo-changed', reloadLogoSettings);
    return () => {
      window.removeEventListener('athree-logo-changed', reloadLogoSettings);
    };
  }, []);

  // Automatically read user's last used printer size on mount / modal open
  React.useEffect(() => {
    if (invoice) {
      const lastUsed = localStorage.getItem('last_used_printer_size');
      if (lastUsed === '58mm') {
        setPrinterWidth('58mm');
        setPrintFormat('pos58');
      } else if (lastUsed === '80mm') {
        setPrinterWidth('80mm');
        setPrintFormat('pos80');
      }
    }
  }, [invoice]);
  
  // States for advanced thermal real-time simulation view with smart defaults
  const [fontSize, setFontSizeState] = useState<'normal' | 'small' | 'large'>(() => {
    const saved = localStorage.getItem('athree-workshop-font-size');
    return (saved as 'normal' | 'small' | 'large') || 'normal';
  });
  
  const [monochromeMode, setMonochromeModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('athree-workshop-monochrome');
    return saved === null ? false : saved === 'true';
  });
  
  const [isThermalRuler, setIsThermalRulerState] = useState<boolean>(() => {
    const saved = localStorage.getItem('athree-workshop-thermal-ruler');
    return saved === null ? false : saved === 'true';
  });
  
  const [simulatePaper, setSimulatePaperState] = useState<boolean>(() => {
    const saved = localStorage.getItem('athree-workshop-simulate-paper');
    return saved === null ? true : saved === 'true';
  });
  
  const [feedSpace, setFeedSpaceState] = useState<boolean>(() => {
    const saved = localStorage.getItem('athree-workshop-feed-space');
    return saved === null ? true : saved === 'true';
  });

  const handleSetPrintFormat = (format: 'a4' | 'pos80' | 'pos58') => {
    setPrintFormat(format);
    localStorage.setItem('athree-workshop-print-format', format);
    if (format === 'pos58') {
      setPrinterWidth('58mm');
      localStorage.setItem('last_used_printer_size', '58mm');
    } else if (format === 'pos80') {
      setPrinterWidth('80mm');
      localStorage.setItem('last_used_printer_size', '80mm');
    }
  };

  const setFontSize = (size: 'normal' | 'small' | 'large') => {
    setFontSizeState(size);
    localStorage.setItem('athree-workshop-font-size', size);
  };

  const setMonochromeMode = (val: boolean) => {
    setMonochromeModeState(val);
    localStorage.setItem('athree-workshop-monochrome', String(val));
  };

  const setIsThermalRuler = (val: boolean) => {
    setIsThermalRulerState(val);
    localStorage.setItem('athree-workshop-thermal-ruler', String(val));
  };

  const setSimulatePaper = (val: boolean) => {
    setSimulatePaperState(val);
    localStorage.setItem('athree-workshop-simulate-paper', String(val));
  };

  const setFeedSpace = (val: boolean) => {
    setFeedSpaceState(val);
    localStorage.setItem('athree-workshop-feed-space', String(val));
  };

  const handleQuickPrintAction = () => {
    setTimeout(() => {
      window.print();
      onClose();
    }, 150);
  };

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

  const handlePayRemaining = (method: 'CASH' | 'TRANSFER') => {
    onPaySettlement(invoice.id, invoice.remainingDebt, method);
    setShowPaySelect(false);
  };

  const getPOSSizeClass = (baseSize: 'xs' | 'custom-8' | 'custom-9' | 'custom-10' | 'sm' | 'base') => {
    if (fontSize === 'small') {
      if (baseSize === 'xs') return 'text-[7px]';
      if (baseSize === 'custom-8') return 'text-[7px]';
      if (baseSize === 'custom-9') return 'text-[8px]';
      if (baseSize === 'custom-10') return 'text-[8.5px]';
      if (baseSize === 'sm') return 'text-[9.5px]';
      return 'text-[11px]';
    } else if (fontSize === 'large') {
      if (baseSize === 'xs') return 'text-[10px]';
      if (baseSize === 'custom-8') return 'text-[10.5px]';
      if (baseSize === 'custom-9') return 'text-[11px]';
      if (baseSize === 'custom-10') return 'text-[12px]';
      if (baseSize === 'sm') return 'text-[13px]';
      return 'text-[15px]';
    } else {
      if (baseSize === 'xs') return 'text-[8px]';
      if (baseSize === 'custom-8') return 'text-[8px]';
      if (baseSize === 'custom-9') return 'text-[9px]';
      if (baseSize === 'custom-10') return 'text-[10px]';
      if (baseSize === 'sm') return 'text-[11px]';
      return 'text-[13px]';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:bg-transparent print:block" 
      id="detail-modal-overlay"
    >
      
      {/* Container Card - Sizing adapts based on print format for responsive live preview */}
      <div 
        className={`bg-white border-2 border-indigo-100 rounded-3xl w-full transition-all duration-300 shadow-xl relative overflow-hidden my-8 print:my-0 print:border-none print:shadow-none font-sans ${
          printFormat === 'pos58' 
            ? 'max-w-[390px] lg:max-w-4xl' 
            : printFormat === 'pos80' 
            ? 'max-w-[460px] lg:max-w-4xl' 
            : 'max-w-2xl'
        }`} 
        id="detail-modal-box"
      >
        
        {/* Modal Top Control Bar (Hidden in @media print) */}
        {isQuickPrint ? (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-200 print:hidden gap-4 animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black bg-amber-500 text-white px-3 py-1 rounded-full font-mono flex items-center gap-1 shadow-3xs">
                <Printer className="w-3.5 h-3.5 animate-pulse" />
                CETAK CEPAT NOTA
              </span>
              <span className="text-xs font-black text-amber-850 bg-amber-100/50 px-2.5 py-0.5 rounded-lg">{invoice.invoiceNum}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Info Indicator */}
              <div className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                💡 Cetakan Di Bagian Bawah
              </div>

              <button
                id="quick-print-close"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer transition active:scale-95 border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
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
                onChange={(e) => handleSetPrintFormat(e.target.value as any)}
                className="bg-transparent font-black text-indigo-600 focus:outline-none cursor-pointer border-none py-0 text-xs"
              >
                <option value="a4">📄 A4 / Standar</option>
                <option value="pos80">🖨️ POS 80mm</option>
                <option value="pos58">🖨️ POS 58mm</option>
              </select>
            </div>

            {invoice.remainingDebt > 0 && (
              <div className="flex items-center gap-1.5">
                {!showPaySelect ? (
                  <button
                    id="modal-btn-pay-settlement"
                    onClick={() => setShowPaySelect(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-550 hover:bg-green-600 active:scale-95 text-white font-extrabold rounded-xl text-xs border-none cursor-pointer transition shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Bayar Lunas
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-indigo-100/50 animate-fade-in">
                    <span className="text-[10px] text-slate-500 font-bold px-1.5">Metode:</span>
                    <button
                      type="button"
                      onClick={() => handlePayRemaining('CASH')}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-black hover:bg-emerald-700 cursor-pointer"
                    >
                      💵 Tunai
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePayRemaining('TRANSFER')}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-black hover:bg-indigo-700 cursor-pointer"
                    >
                      🏦 Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaySelect(false)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                      title="Batal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              id="modal-btn-close"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl border-none cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
       {/* Outer instructions alert (Hidden in print) */}
        <div className="px-6 py-3 bg-indigo-50/20 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-600 print:hidden">
          <AlertCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="font-semibold text-slate-650 leading-normal">
            <strong className="text-indigo-700">Printer Terpilih:</strong> {printFormat === 'a4' ? 'Kertas Standar A4 / Letter' : printFormat === 'pos80' ? 'Printer Thermal POS Roll 80mm' : 'Printer Thermal POS Roll 58mm'}. {printFormat !== 'a4' ? 'Gunakan pengukur rasio karakter di sebelah kiri untuk mengonfirmasi rincian sebelum mencetak.' : 'Layout di bawah langsung menyesuaikan dimensi printer Anda saat dicetak!'}
          </p>
        </div>

        {/* Conditional Layout for Thermal Simulator vs A4 Standard */}
        <div className={printFormat === 'a4' ? "" : "grid grid-cols-1 lg:grid-cols-12 gap-0"}>
          
          {/* LEFT COLUMN: Thermal Simulator Dashboard & Settings Panel */}
          {printFormat !== 'a4' && (
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-indigo-50/20 border-r border-indigo-100 p-5 space-y-4 print:hidden flex flex-col justify-between" id="thermal-control-sidebar">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Kualifikasi Thermal</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Asisten Pratinjau Kertas Kasir</p>
                  </div>
                </div>

                {/* 1. Paper Type Meter */}
                <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hasil Kalibrasi Roll:</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-black uppercase">Presisi</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[8px] text-slate-400 block font-semibold uppercase">Lebar Roll</span>
                      <strong className="text-xs font-black text-slate-800">{printFormat === 'pos58' ? '58 mm' : '80 mm'}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[8px] text-slate-400 block font-semibold uppercase">Panjang Est.</span>
                      <strong className="text-xs font-black text-indigo-600 font-mono">
                        ~{95 + invoice.items.length * 8 + (invoice.notes ? 15 : 0) + (feedSpace ? 20 : 0)} mm
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Style Control Toggles */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-indigo-950 uppercase tracking-wider">Simulasi Layout &amp; Media</h4>
                  
                  {/* Simulate heat paper background */}
                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 cursor-pointer shadow-3xs select-none transition">
                    <span className="text-xs font-black text-slate-700">Simulasi Warna Kertas Panas</span>
                    <input 
                      type="checkbox" 
                      id="toggle-simulate-paper"
                      checked={simulatePaper}
                      onChange={(e) => setSimulatePaper(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4 accent-indigo-500"
                    />
                  </label>

                  {/* Pure Monochrome black ribbon preview */}
                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 cursor-pointer shadow-3xs select-none transition">
                    <span className="text-xs font-black text-slate-700">Tampilan Pita Monokrom</span>
                    <input 
                      type="checkbox" 
                      id="toggle-monochrome"
                      checked={monochromeMode}
                      onChange={(e) => setMonochromeMode(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4 accent-indigo-500"
                    />
                  </label>

                  {/* Character alignment lines */}
                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 cursor-pointer shadow-3xs select-none transition">
                    <span className="text-xs font-black text-slate-700">Tampilkan Rambu Karakter</span>
                    <input 
                      type="checkbox" 
                      id="toggle-ruler"
                      checked={isThermalRuler}
                      onChange={(e) => setIsThermalRuler(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4 accent-indigo-500"
                    />
                  </label>

                  {/* Feed Padding Space */}
                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 cursor-pointer shadow-3xs select-none transition">
                    <span className="text-xs font-black text-slate-700">Spasi Tarikan (Feed Spacing)</span>
                    <input 
                      type="checkbox" 
                      id="toggle-feed-space"
                      checked={feedSpace}
                      onChange={(e) => setFeedSpace(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4 accent-indigo-500"
                    />
                  </label>
                </div>

                {/* 3. Text Sizing Slider/Multipliers */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-indigo-950 uppercase tracking-wider">Kerapatan Huruf</h4>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-3xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-slate-600">
                      <span>Ukuran Huruf Nota:</span>
                      <span className="font-mono text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded text-[9px] uppercase">
                        {fontSize === 'small' ? 'Compact (-15%)' : fontSize === 'large' ? 'Large (+15%)' : 'Standard'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 animate-fade-in">
                      {(['small', 'normal', 'large'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          id={`btn-sz-${sz}`}
                          onClick={() => setFontSize(sz)}
                          className={`py-1.5 text-[9px] font-black rounded-lg border transition active:scale-95 cursor-pointer select-none ${
                            fontSize === sz
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {sz === 'small' ? 'Kecil' : sz === 'large' ? 'Besar' : 'Sedang'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calibration Instructions Footer */}
              <div className="bg-indigo-950 text-indigo-200 p-3 rounded-2xl text-[9px] leading-relaxed">
                <span className="font-black text-white uppercase block mb-0.5">Kapasitas Maksimal Karakter:</span>
                <p className="font-medium text-slate-300">
                  • Lebar 58mm: Nyaman di 32 baris kolom.<br />
                  • Lebar 80mm: Nyaman di 42 baris kolom.<br />
                  • Kertas asli akan memotong otomatis pada rintisan garis sobek gerigi preview.
                </p>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: Realistic Live Thermal Roll Board */}
          <div className={printFormat === 'a4' ? "" : "lg:col-span-7 bg-slate-100/60 p-4 sm:p-6 flex justify-center items-start overflow-x-auto print:bg-white print:p-0 print:block flex-shrink-0"}>
            
            {/* Simulation Outer Paper Holder with Tear/Serrated styling if simulated paper is on */}
            <div 
              className={printFormat === 'a4' ? "w-full" : `relative w-full ${
                simulatePaper 
                  ? 'bg-[#FDFCF7] shadow-xl border border-stone-200/60 rounded-sm' 
                  : 'bg-white'
              }`}
              id="paper-roll-holder-simulation"
            >
              {/* Top Serated Cut Simulation Line on screen */}
              {printFormat !== 'a4' && simulatePaper && (
                <div className="h-2 w-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-100/30 to-transparent flex justify-between select-none print:hidden" style={{ backgroundImage: 'linear-gradient(45deg, #e7e5e4 25%, transparent 25%), linear-gradient(-45deg, #e7e5e4 25%, transparent 25%)', backgroundSize: '6px 12px', backgroundPosition: '50% 0' }} />
              )}
              
              {/* CHARACTER RULER GUIDANCE: Overlaid vertically down the screen list */}
              {printFormat !== 'a4' && isThermalRuler && (
                <div className="absolute inset-y-0 left-0 right-0 pointer-events-none border-x border-indigo-200/30 bg-[linear-gradient(to_right,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:4%_100%] print:hidden flex justify-between px-2 text-[8px] text-indigo-400 font-mono select-none">
                  <div>| 1</div>
                  <div>Col-Align-Ruler</div>
                  <div>{printFormat === 'pos58' ? '32' : '42'} |</div>
                </div>
              )}

              {/* PRINTABLE RECEIPT CONTAINER SHEET */}
              <div 
                className={`space-y-6 text-slate-800 font-sans print:bg-white print:text-black print:p-0 ${
                  printFormat === 'a4' 
                    ? 'p-6 md:p-8 bg-white' 
                    : `p-4 mx-auto ${
                        printFormat === 'pos80' 
                          ? 'max-w-[80mm] format-pos-80 thermal-receipt' 
                          : 'max-w-[58mm] format-pos-58 thermal-receipt'
                      } ${
                        simulatePaper ? 'bg-transparent shadow-none border-none' : 'bg-white'
                      } ${
                        feedSpace ? 'pb-20' : 'pb-6'
                      }`
                }`} 
                id="printable-receipt-sheet"
              >
                {printFormat === 'a4' ? (
                  <>
              {/* Receipt Header (Convection Shop Identity / Letterhead) */}
              <div className="flex flex-col md:flex-row md:justify-between border-b pb-5 border-slate-100 print:border-slate-300 print:flex-row gap-4 items-start">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {logoType !== 'none' && (
                    <div className="shrink-0 p-1 bg-slate-50 border border-slate-100 rounded-xl print:bg-transparent print:border-none print:p-0">
                      <LogoRenderer
                        logoType={logoType}
                        presetKey={presetKey}
                        customUrl={customUrl}
                        className="w-14 h-14 text-indigo-600 print:text-black"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    {/* Brand Logo or Text */}
                    <h2 className="text-2xl font-black tracking-tight text-indigo-600 font-sans uppercase print:text-black">
                      {shopName}
                    </h2>
                    <p className="text-xs text-slate-500 max-w-sm font-bold print:text-slate-600">
                      {shopSlogan}
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
                    {invoice.deadlineDate && (
                      <div className="text-xs text-slate-500 mt-1 print:text-slate-600 font-semibold">
                        Deadline: <strong className="text-red-600 print:text-black font-bold">{new Date(invoice.deadlineDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                      </div>
                    )}
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
                  {invoice.salesCode && (
                    <p className="text-slate-600 mt-1 print:text-slate-705 font-bold text-xs flex items-center gap-1">
                      Sales: <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wider print:border print:border-slate-300">{invoice.salesCode}</span>
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

                  {bankAccounts.length > 0 && (
                    <div className="mt-3 p-2.5 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 print:bg-transparent print:border-slate-300">
                      <p className="text-[9px] font-black text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1">🏦 Rekening Transfer Bank Resmi Toko:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] font-mono leading-normal">
                        {bankAccounts.map((acc: any) => (
                          <div key={acc.id} className="text-slate-650 dark:text-slate-350 pl-1.5 border-l border-indigo-400 print:border-slate-400">
                            <strong>{acc.bankName}</strong>: {acc.accountNumber} <br />
                            a/n {acc.accountOwner}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
            <div className={`flex flex-col items-center text-black font-mono leading-relaxed mx-auto text-left w-full ${
              monochromeMode ? 'filter grayscale contrast-125 font-bold' : ''
            }`}>
              <div className="text-center w-full space-y-1 flex flex-col items-center">
                {logoType !== 'none' && (
                  <div className="mb-1 flex justify-center shrink-0">
                    <LogoRenderer
                      logoType={logoType}
                      presetKey={presetKey}
                      customUrl={customUrl}
                      className="w-12 h-12 text-black"
                    />
                  </div>
                )}
                <h2 className={`font-black tracking-tight uppercase text-black ${getPOSSizeClass('sm')}`}>
                  {shopName}
                </h2>
                <p className={`leading-tight font-semibold text-slate-505 ${getPOSSizeClass('custom-9')}`}>
                  {shopSlogan}
                </p>
                <p className={`text-slate-600 ${getPOSSizeClass('custom-9')}`}>
                  JL. Raya Tanah Hitam, Jayapura
                </p>
                <p className={`text-slate-600 font-bold ${getPOSSizeClass('custom-9')}`}>
                  WA: +62 812-3456-7890 | IG: @athreestudio_jayapura
                </p>
              </div>

              {/* Dashed line */}
              <div className={`w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center font-bold text-slate-300 select-none font-sans ${getPOSSizeClass('custom-10')}`}>
                ----------------------------------------
              </div>

              {/* Metadata log info */}
              <div className={`w-full space-y-1 text-slate-705 font-mono ${getPOSSizeClass('custom-10')} ${monochromeMode ? 'text-black' : 'text-slate-700'}`}>
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-extrabold text-black">{invoice.invoiceNum}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal :</span>
                  <span>{new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {invoice.deadlineDate && (
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="font-extrabold text-rose-600 print:text-black">{new Date(invoice.deadlineDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
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
                {invoice.salesCode && (
                  <div className="flex justify-between">
                    <span>Sales    :</span>
                    <span className="font-semibold text-black">{invoice.salesCode}</span>
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
              <div className={`w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center font-bold text-slate-300 select-none font-sans ${getPOSSizeClass('custom-10')}`}>
                ----------------------------------------
              </div>

              {/* Items details */}
              <div className={`w-full space-y-2 ${getPOSSizeClass('custom-10')}`}>
                {invoice.items.map((item, idx) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-black">
                      <span>{idx + 1}. {item.productName}</span>
                      <span>{formatRp(item.total)}</span>
                    </div>
                    <div className={`pl-3 ${getPOSSizeClass('custom-9')} ${monochromeMode ? 'text-black font-semibold' : 'text-slate-500'}`}>
                      {item.qty} pcs x {formatRp(item.sellPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dashed line */}
              <div className={`w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center font-bold text-slate-300 select-none font-sans ${getPOSSizeClass('custom-10')}`}>
                ----------------------------------------
              </div>

              {/* Totals math section */}
              <div className={`w-full space-y-1 ${getPOSSizeClass('custom-10')} ${monochromeMode ? 'text-black' : 'text-slate-700'}`}>
                <div className="flex justify-between">
                  <span>Total Qty:</span>
                  <span>{invoice.totalQty} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tagihan:</span>
                  <span className="font-bold text-black">{formatRp(invoice.totalAmount)}</span>
                </div>
                <div className={`flex justify-between font-bold ${monochromeMode ? 'text-black' : 'text-emerald-700'}`}>
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
                  <span className={invoice.remainingDebt > 0 ? "text-rose-600 font-black" : (monochromeMode ? "text-black" : "text-slate-600")}>
                    {formatRp(invoice.remainingDebt)}
                  </span>
                </div>
              </div>

              {/* Notes block in receipt */}
              {invoice.notes && (
                <>
                  {/* Dashed line */}
                  <div className={`w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center font-bold text-slate-300 select-none font-sans ${getPOSSizeClass('custom-10')}`}>
                    ----------------------------------------
                  </div>
                  <div className={`w-full text-left italic leading-normal p-2 rounded-xl bg-slate-50 ${getPOSSizeClass('custom-9')} ${monochromeMode ? 'border border-dashed border-black bg-white text-black' : 'text-slate-600'}`}>
                    <span className={`font-black text-slate-400 block uppercase tracking-wider not-italic ${getPOSSizeClass('xs')}`}>Catatan / Spesifikasi:</span>
                    {invoice.notes}
                  </div>
                </>
              )}

              {/* Dashed line */}
              <div className={`w-full border-t border-dashed border-slate-400 my-2 pt-0.5 text-center font-bold text-slate-300 select-none font-sans ${getPOSSizeClass('custom-10')}`}>
                ----------------------------------------
              </div>

              <div className="w-full text-center space-y-3 mt-1.5">
                <p className={`text-slate-450 font-bold italic leading-tight uppercase ${getPOSSizeClass('xs')} ${monochromeMode ? 'text-black' : 'text-slate-400'}`}>
                  -- TERIMA KASIH ATAS KUNJUNGANNYA --<br />
                  PESANAN SAH TERDEDUKSI GUDANG OTOMATIS
                </p>

                {/* POS Signature line */}
                <div className={`grid grid-cols-2 gap-4 pt-2 ${getPOSSizeClass('custom-9')}`}>
                  <div className="space-y-6 text-center">
                    <span>Penerima</span>
                    <div className="border-b border-dashed border-slate-300 mx-auto w-12" />
                    <span className={`text-slate-400 ${getPOSSizeClass('xs')}`}>({invoice.customerName.split(' ')[0]})</span>
                  </div>
                  <div className="space-y-6 text-center">
                    <span>Kasir Toko</span>
                    <div className="border-b border-dashed border-slate-300 mx-auto w-12" />
                    <span className={`text-slate-400 ${getPOSSizeClass('xs')}`}>(Athree Studio)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
              
              {/* Bottom serrated sheet tear simulation */}
              {printFormat !== 'a4' && simulatePaper && (
                <div className="h-2 w-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-100/30 to-transparent flex justify-between select-none print:hidden z-10" style={{ backgroundImage: 'linear-gradient(45deg, transparent 75%, #e7e5e4 75%), linear-gradient(-45deg, transparent 75%, #e7e5e4 75%)', backgroundSize: '6px 12px', backgroundPosition: '0 100%' }} />
              )}

            </div>

          </div>

        </div>

        {/* Modal Footer Controls (Hidden in print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
            <span>Tujuan Aktif:</span>
            <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md font-extrabold uppercase tracking-tight text-[10px] flex items-center gap-1">
              💾 {selectedPrinter.split(' ')[0]} ({printFormat.toUpperCase()})
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              id="modal-btn-close-bottom"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-black border-none cursor-pointer transition"
            >
              Tutup Dialog
            </button>
            <button
              id="modal-btn-print-bottom"
              onClick={() => setShowPrintConfig(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs cursor-pointer border-none transition shadow-lg shadow-indigo-600/20"
            >
              <Printer className="w-4 h-4" />
              Cetak Nota / Pilih Printer
            </button>
          </div>
        </div>

      </div>

      {/* --- HIGH-FIDELITY PRINT SETTINGS DIALOG (SIMULATED PRINTER & DESTINATION CONFIGURATION) --- */}
      {showPrintConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto animate-fade-in print:hidden" id="custom-print-options-backdrop">
          <div className="bg-[#2d2e30] border border-slate-750 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden text-slate-200 font-sans" id="custom-print-options-box">
            
            {/* Header portion */}
            <div className="px-5 py-4 border-b border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  Cetak Nota Penjualan
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Konfigurasi format &amp; tujuan printer fisik kasir</p>
              </div>
              <div className="text-[10px] font-black tracking-widest bg-zinc-800 text-sky-300 px-2 py-1 rounded border border-zinc-700">
                1 lembar kertas
              </div>
            </div>

            {/* Form list fields */}
            <div className="p-5 space-y-4">
              
              {/* Row 1: Tujuan (Destination Printer Selection) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Tujuan Printer</label>
                <div className="relative">
                  <select
                    value={selectedPrinter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPrinter(val);
                      localStorage.setItem('athree-printer-tujuan', val);
                      
                      // Auto format adjustment guidance
                      if (val.includes('80mm')) {
                        handleSetPrintFormat('pos80');
                      } else if (val.includes('58mm')) {
                        handleSetPrintFormat('pos58');
                      }
                    }}
                    className="w-full bg-[#1e1f21] hover:bg-[#252628] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer font-bold transition focus:outline-none focus:border-sky-500 appearance-none"
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

              {/* Row 2: Jenis Printer / Ukuran Kertas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Jenis Printer &amp; Ukuran Kertas</label>
                <div className="relative">
                  <select
                    value={printFormat}
                    onChange={(e) => {
                      const val = e.target.value as 'a4' | 'pos80' | 'pos58';
                      handleSetPrintFormat(val);
                    }}
                    className="w-full bg-[#1e1f21] hover:bg-[#252628] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer font-bold transition focus:outline-none focus:border-sky-500 appearance-none"
                  >
                    <option value="a4">📄 Kertas Standar A4 (Inkjet/Laser)</option>
                    <option value="pos80">📟 Printer Thermal POS 80mm Roll</option>
                    <option value="pos58">📟 Printer Thermal POS 58mm Roll</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[9px] text-zinc-500 font-bold leading-normal">
                  * Mengubah jenis di atas akan secara otomatis menyesuaikan pratinjau slip di layar kasir secara real-time.
                </p>
              </div>

              {/* Row 3: Halaman & Salinan (Grid) */}
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

              {/* Row 4: Tata Letak & Warna (Grid) */}
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
                        setMonochromeMode(val === 'monokrom');
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

              {/* Accordion: Setelan Lain (Real-time Customizer Option overrides) */}
              <div className="border-t border-zinc-750 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOtherSettings(!showOtherSettings)}
                  className="w-full flex justify-between items-center text-xs font-bold text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    Setelan Lain {printFormat !== 'a4' && '(Pengaturan Kertas/Rasio Kasir)'}
                  </span>
                  {showOtherSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOtherSettings && (
                  <div className="mt-3 p-3 bg-zinc-800/40 rounded-xl space-y-2 border border-zinc-750 animate-fade-in text-xs">
                    {printFormat !== 'a4' ? (
                      <>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-300 font-bold">Rasio Huruf Cetak:</span>
                          <select
                            value={fontSize}
                            onChange={(e) => setFontSize(e.target.value as any)}
                            className="bg-[#1e1f21] text-white border border-zinc-700 rounded px-1.5 py-1 text-[11px] font-bold"
                          >
                            <option value="normal">Normal size</option>
                            <option value="small">Sempit (Small)</option>
                            <option value="large">Lebar (Large)</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-300 font-bold">Tambahkan Feed Kertas:</span>
                          <input
                            type="checkbox"
                            checked={feedSpace}
                            onChange={(e) => setFeedSpace(e.target.checked)}
                            className="w-3.5 h-3.5 accent-sky-500"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-300 font-bold">Tampilkan Mistar Kertas:</span>
                          <input
                            type="checkbox"
                            checked={isThermalRuler}
                            onChange={(e) => setIsThermalRuler(e.target.checked)}
                            className="w-3.5 h-3.5 accent-sky-500"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-zinc-400 font-medium italic">
                        Pengonfigurasi thermal ruler dinonaktifkan untuk cetak format standard A4. Halaman akan dicetak standar menggunakan margin browser Google Chrome/Edge Anda.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Bottom decision dialog buttons */}
            <div className="px-5 py-4 border-t border-zinc-700 bg-[#252628] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPrintConfig(false)}
                className="px-4 py-2 bg-transparent hover:bg-zinc-800 border border-zinc-700 text-zinc-350 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition active:scale-95"
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
                    // Open browser native print dialog
                    window.print();
                  }, 800);
                }}
                disabled={isSimulatingPrint}
                className="flex items-center gap-1.5 px-6 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-700 text-white font-extrabold rounded-lg text-xs cursor-pointer border-none transition active:scale-95 shadow-md shadow-sky-500/10"
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
