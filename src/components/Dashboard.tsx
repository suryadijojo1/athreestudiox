/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, Invoice } from '../types';
import { TrendingUp, Wallet, Landmark, AlertTriangle, ArrowUpRight, ArrowDownRight, Package, Lock } from 'lucide-react';
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
        <p className="font-extrabold text-slate-300 font-sans tracking-wide uppercase">{label}</p>
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
  setActiveTab: (tab: string) => void;
  userRole?: 'KASIR' | 'OWNER';
}

export default function Dashboard({ products, invoices, setActiveTab, userRole = 'OWNER' }: DashboardProps) {
  // Stats calculations
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalCashReceived = invoices.reduce((acc, inv) => acc + inv.downPayment + inv.settlement, 0);
  const totalReceivables = invoices.reduce((acc, inv) => acc + inv.remainingDebt, 0);
  const totalSoldQty = invoices.reduce((acc, inv) => acc + inv.totalQty, 0);
  
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const criticalProducts = products.filter(p => p.stock < 5);

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
      <div 
        className="p-8 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 to-indigo-600 border-b-4 border-indigo-200 shadow-xl relative overflow-hidden"
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
          </div>
          <button 
            id="btn-quick-new-note"
            onClick={() => setActiveTab('nota-baru')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-400 hover:bg-amber-500 transition-all font-black rounded-2xl shadow-lg shadow-indigo-600/40 text-slate-900 border-none text-sm self-start md:self-auto uppercase tracking-wider italic"
          >
            Buat Nota Baru
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {criticalProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-[2rem] bg-rose-50 border-2 border-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
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
              {userRole === 'KASIR' ? (
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
              {userRole === 'KASIR' ? (
                <span className="text-sm font-black text-slate-400 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">🔒 Akses Owner</span>
              ) : (
                formatRp(totalCashReceived)
              )}
            </h3>
            <div className="w-full bg-indigo-50 rounded-full h-1.5 mt-2">
              <div 
                className="bg-indigo-500 h-1.5 rounded-full" 
                style={{ width: `${userRole !== 'KASIR' && totalRevenue > 0 ? (totalCashReceived / totalRevenue) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-medium flex justify-between mt-1">
              <span>Efektivitas Pelunasan</span>
              <span className="font-bold text-indigo-600">
                {userRole === 'KASIR' ? '🔒' : `${totalRevenue > 0 ? Math.round((totalCashReceived / totalRevenue) * 100) : 0}%`}
              </span>
            </span>
          </div>
        </motion.div>

        {/* Sisa Piutang */}
        <motion.div 
          className={`p-6 rounded-3xl flex items-start gap-4 transition-all duration-300 ${
            userRole !== 'KASIR' && totalReceivables > 0 
              ? 'bg-[#FF6B6B] text-white shadow-lg border-none' 
              : 'bg-white border-2 border-indigo-50 text-slate-700 shadow-sm'
          }`}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`p-3.5 rounded-2xl ${
            userRole !== 'KASIR' && totalReceivables > 0
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-amber-50 text-amber-600 rounded-2xl border border-amber-100'
          }`}>
            <Landmark className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider ${userRole !== 'KASIR' && totalReceivables > 0 ? 'text-white/85' : 'text-slate-400'}`}>Total Piutang Usaha</p>
            <h3 className={`text-2xl font-black tracking-tight mt-1 ${userRole !== 'KASIR' && totalReceivables > 0 ? 'text-white' : 'text-slate-800'}`}>
              {userRole === 'KASIR' ? (
                <span className="text-sm font-black text-slate-400 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">🔒 Akses Owner</span>
              ) : (
                formatRp(totalReceivables)
              )}
            </h3>
            <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${userRole !== 'KASIR' && totalReceivables > 0 ? 'text-white/90' : 'text-slate-400'}`}>
              ● {userRole === 'KASIR' ? 'Hak akses terbatas' : totalReceivables > 0 ? 'Ada tagihan aktif belum lunas' : 'Seluruh piutang lunas'}
            </span>
          </div>
        </motion.div>

        {/* Peringatan Stok */}
        <motion.div 
          className={`p-6 rounded-3xl flex items-start gap-4 transition-all duration-300 cursor-pointer ${
            lowStockProducts.length > 0 
              ? 'bg-[#4ECDC4] text-white shadow-lg border-none' 
              : 'bg-white border-2 border-indigo-50 text-slate-700 shadow-sm'
          }`}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => setActiveTab('stok-barang')}
        >
          <div className={`p-3.5 rounded-2xl ${
            lowStockProducts.length > 0
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-teal-50 text-teal-600 border border-teal-100'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold uppercase tracking-wider ${lowStockProducts.length > 0 ? 'text-white/85' : 'text-slate-400'}`}>Stok Menipis / Habis</p>
              {criticalProducts.length > 0 && (
                <span className="animate-pulse bg-rose-600 border border-rose-450 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                  🔥 {criticalProducts.length} Kritis
                </span>
              )}
            </div>
            <h3 className={`text-2xl font-black tracking-tight mt-1 ${lowStockProducts.length > 0 ? 'text-white' : 'text-slate-800'}`}>
              {lowStockProducts.length} <span className={`text-xs font-semibold ${lowStockProducts.length > 0 ? 'text-white/80' : 'text-slate-404'}`}>Barang</span>
            </h3>
            <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${lowStockProducts.length > 0 ? 'text-white/95' : 'text-slate-400'}`}>
              {criticalProducts.length > 0 ? (
                <span>{criticalProducts.length} produk di bawah 5 unit!</span>
              ) : outOfStockProducts.length > 0 ? (
                <span>{outOfStockProducts.length} produk kosong gulung tikar</span>
              ) : (
                <span>Hubungi supplier untuk restock</span>
              )}
            </span>
          </div>
        </motion.div>

      </div>

      {/* Monthly Financial Trend Section */}
      <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-6 shadow-md relative overflow-hidden" id="financial-trend-card">
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
          {userRole === 'KASIR' ? (
            /* Locked Overlay for Cashier role */
            <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-md flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl z-10 text-center">
              <div className="p-4 bg-rose-50 text-rose-500 rounded-full border border-rose-100 mb-4 animate-bounce">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800">Akses Terbatas (Khusus Owner)</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Grafik performa finansial dan omset bulanan toko mengandung data sensitif dan hanya dapat diperiksa oleh manajemen / owner.
              </p>
            </div>
          ) : null}

          {/* The Real Recharts Area Chart */}
          <div className={`h-[300px] w-full ${userRole === 'KASIR' ? 'filter blur-[4px]' : ''}`}>
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

      {/* Two Columns Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
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

        {/* Right Column: Key/Quick Inventory Status (2 columns wide) */}
        <div className="lg:col-span-2 space-y-4" id="quick-stock-column">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Status Stok Menipis
            </h2>
            <button 
              id="view-all-stock"
              onClick={() => setActiveTab('stok-barang')}
              className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wider hover:underline"
            >
              Urus Stok
            </button>
          </div>

          <div className="p-6 bg-white border-2 border-indigo-100 rounded-3xl shadow-md space-y-4 min-h-[220px]" id="quick-stock-card">
            {lowStockProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 border border-green-100 flex items-center justify-center mb-3">
                  ✓
                </div>
                <p className="text-sm font-black text-slate-700">Stok Aman Terkendali</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada produk yang berada di bawah stok minimum.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 4).map((p) => {
                  const stockPercentage = Math.min(100, Math.round((p.stock / p.minStock) * 100));
                  const isCritical = p.stock < 5;
                  return (
                    <div 
                      key={p.id} 
                      className={`p-4 border rounded-2xl transition-all duration-205 flex items-center justify-between gap-3 cursor-pointer ${
                        isCritical 
                          ? 'bg-rose-50/60 hover:bg-rose-50 border-rose-200 shadow-sm' 
                          : 'bg-indigo-50/30 hover:bg-indigo-50/60 border-indigo-50/50'
                      }`}
                      onClick={() => setActiveTab('stok-barang')}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-indigo-600 font-extrabold">{p.sku}</span>
                          <span className="text-[10px] bg-white text-indigo-500 border border-indigo-100 font-black px-2 py-0.5 rounded-md uppercase">{p.category}</span>
                          {isCritical && (
                            <span className="text-[9px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-md uppercase animate-pulse flex items-center gap-1">
                              ⚠️ KRITIS
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate mt-1">{p.name}</p>
                        
                        <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-2">
                          <div 
                            className={`h-1.5 rounded-full ${isCritical ? 'bg-rose-500' : p.stock === 0 ? 'bg-rose-500' : 'bg-amber-400'}`}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className={`text-base font-black ${isCritical ? 'text-rose-600' : p.stock === 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                          {p.stock} <span className="text-xs font-semibold text-slate-500">{p.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-450 font-bold">
                          Min: {p.minStock}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {lowStockProducts.length > 4 && (
                  <div className="text-center pt-2">
                    <span 
                      onClick={() => setActiveTab('stok-barang')}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      dan {lowStockProducts.length - 4} produk lainnya...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
