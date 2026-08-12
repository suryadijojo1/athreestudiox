import React, { useState, useMemo } from 'react';
import { Invoice, Product, InvoiceItem, PRODUCT_CATEGORIES, normalizeCategory } from '../types';
import { X, Printer, Download, Filter, FileSpreadsheet, Layers, Users, Package, Award } from 'lucide-react';

interface LaporanSalesCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  products: Product[];
  officialSalesList: { code: string; name: string }[];
  salesDateFilter?: 'ALL' | 'MONTH' | 'WEEK';
}

export default function LaporanSalesCategoryModal({
  isOpen,
  onClose,
  invoices,
  products,
  officialSalesList,
  salesDateFilter = 'ALL'
}: LaporanSalesCategoryModalProps) {
  const [selectedSalesFilter, setSelectedSalesFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [datePeriodFilter, setDatePeriodFilter] = useState<'ALL' | 'MONTH' | 'WEEK'>(salesDateFilter);

  // Helper to map an item to its product category
  const getItemCategory = (item: InvoiceItem): string => {
    if (!item) return 'DLL';
    if (products && products.length > 0) {
      const prod = products.find(p => p.id === item.productId || (p.sku && p.sku.toLowerCase() === item.productId.toLowerCase()));
      if (prod && prod.category) return normalizeCategory(prod.category);

      const prodByName = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
      if (prodByName && prodByName.category) return normalizeCategory(prodByName.category);
    }
    return 'DLL';
  };

  // Get all unique categories present in products list and invoices
  const availableCategories = useMemo(() => {
    const setCat = new Set<string>(PRODUCT_CATEGORIES);
    products.forEach(p => {
      if (p.category && p.category.trim()) setCat.add(normalizeCategory(p.category));
    });
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        setCat.add(getItemCategory(item));
      });
    });
    return Array.from(setCat).sort();
  }, [products, invoices]);

  // Filter invoices based on date period
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const day = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);

    return invoices.filter(inv => {
      if (!inv.salesCode) return false;
      const code = inv.salesCode.trim().toUpperCase();

      if (selectedSalesFilter !== 'ALL' && code !== selectedSalesFilter.toUpperCase()) {
        return false;
      }

      if (datePeriodFilter === 'MONTH') {
        const invDate = new Date(inv.date);
        if (invDate < startOfMonth) return false;
      } else if (datePeriodFilter === 'WEEK') {
        const invDate = new Date(inv.date);
        if (invDate < startOfWeek) return false;
      }

      return true;
    });
  }, [invoices, selectedSalesFilter, datePeriodFilter]);

  // Comprehensive Sales x Category Aggregation Data Structure
  const reportData = useMemo(() => {
    // Map of salesCode -> sales object
    const salesMap: {
      [code: string]: {
        code: string;
        name: string;
        totalAmount: number;
        totalQty: number;
        invoiceCount: number;
        categoryBreakdown: {
          [category: string]: { qty: number; totalAmount: number; lineCount: number }
        }
      }
    } = {};

    // Map of category -> category object totals
    const categoryTotals: {
      [category: string]: { qty: number; totalAmount: number; lineCount: number }
    } = {};

    let grandTotalAmount = 0;
    let grandTotalQty = 0;
    let grandLineItems = 0;

    filteredInvoices.forEach(inv => {
      const code = inv.salesCode ? inv.salesCode.trim().toUpperCase() : 'UNKNOWN';
      const official = officialSalesList.find(s => s.code.toUpperCase() === code);
      const salesName = official ? official.name : `Sales ${code}`;

      if (!salesMap[code]) {
        salesMap[code] = {
          code,
          name: salesName,
          totalAmount: 0,
          totalQty: 0,
          invoiceCount: 0,
          categoryBreakdown: {}
        };
      }
      salesMap[code].invoiceCount += 1;

      inv.items.forEach(item => {
        const category = getItemCategory(item);

        // Filter by category if selected
        if (selectedCategoryFilter !== 'ALL' && category !== selectedCategoryFilter) {
          return;
        }

        const itemTotal = item.total || (item.qty * item.sellPrice);

        // Sales level breakdown
        if (!salesMap[code].categoryBreakdown[category]) {
          salesMap[code].categoryBreakdown[category] = { qty: 0, totalAmount: 0, lineCount: 0 };
        }
        salesMap[code].categoryBreakdown[category].qty += item.qty;
        salesMap[code].categoryBreakdown[category].totalAmount += itemTotal;
        salesMap[code].categoryBreakdown[category].lineCount += 1;

        salesMap[code].totalAmount += itemTotal;
        salesMap[code].totalQty += item.qty;

        // Overall category totals
        if (!categoryTotals[category]) {
          categoryTotals[category] = { qty: 0, totalAmount: 0, lineCount: 0 };
        }
        categoryTotals[category].qty += item.qty;
        categoryTotals[category].totalAmount += itemTotal;
        categoryTotals[category].lineCount += 1;

        grandTotalAmount += itemTotal;
        grandTotalQty += item.qty;
        grandLineItems += 1;
      });
    });

    const salesList = Object.values(salesMap).filter(s => s.totalAmount > 0 || selectedSalesFilter !== 'ALL')
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const categoriesInReport = availableCategories.filter(cat => 
      selectedCategoryFilter === 'ALL' || cat === selectedCategoryFilter
    );

    return {
      salesList,
      categoryTotals,
      categoriesInReport,
      grandTotalAmount,
      grandTotalQty,
      grandLineItems
    };
  }, [filteredInvoices, availableCategories, officialSalesList, selectedCategoryFilter, selectedSalesFilter]);

  if (!isOpen) return null;

  // CSV Exporter 1: Ringkasan per Sales & Jenis Produk
  const exportSummaryCSV = () => {
    if (reportData.salesList.length === 0) {
      alert("Tidak ada data penjualan untuk diekspor!");
      return;
    }

    const headers = [
      "Kode Sales",
      "Nama Sales Agent",
      "Jenis Produk / Kategori",
      "Jumlah Unit Terjual (pcs)",
      "Total Omset Bruto (IDR)",
      "Kontribusi Sales terhadap Omset Total (%)"
    ];

    const rows: (string | number)[][] = [];

    reportData.salesList.forEach(sales => {
      reportData.categoriesInReport.forEach(cat => {
        const catData = sales.categoryBreakdown[cat];
        if (catData && catData.totalAmount > 0) {
          const contrib = reportData.grandTotalAmount > 0 
            ? ((catData.totalAmount / reportData.grandTotalAmount) * 100).toFixed(1) + "%" 
            : "0%";

          rows.push([
            sales.code,
            sales.name,
            cat,
            catData.qty,
            catData.totalAmount,
            contrib
          ]);
        }
      });
    });

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => {
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","))
    ].join("\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Penjualan_Sales_dan_Jenis_Produk_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Exporter 2: Matrix Crosstab (Sales x Categories)
  const exportMatrixCSV = () => {
    if (reportData.salesList.length === 0) {
      alert("Tidak ada data matriks penjualan untuk diekspor!");
      return;
    }

    const headers = [
      "Kode Sales",
      "Nama Sales Agent",
      ...reportData.categoriesInReport.map(cat => `${cat} (Omset IDR)`),
      ...reportData.categoriesInReport.map(cat => `${cat} (Qty Pcs)`),
      "Total Omset Sales (IDR)",
      "Total Qty Sales (Pcs)"
    ];

    const rows = reportData.salesList.map(sales => {
      const omsetPerCat = reportData.categoriesInReport.map(cat => sales.categoryBreakdown[cat]?.totalAmount || 0);
      const qtyPerCat = reportData.categoriesInReport.map(cat => sales.categoryBreakdown[cat]?.qty || 0);

      return [
        sales.code,
        sales.name,
        ...omsetPerCat,
        ...qtyPerCat,
        sales.totalAmount,
        sales.totalQty
      ];
    });

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => {
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","))
    ].join("\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Matrix_Penjualan_Sales_x_JenisProduk_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Exporter 3: Detail Transaksi Rinci (Line Item Level)
  const exportDetailedItemCSV = () => {
    if (filteredInvoices.length === 0) {
      alert("Tidak ada data transaksi rincian untuk diekspor!");
      return;
    }

    const headers = [
      "No Nota",
      "Tanggal Nota",
      "Kode Sales",
      "Nama Sales Agent",
      "Nama Pelanggan",
      "Nama Produk",
      "Jenis Produk / Kategori",
      "Qty (Pcs)",
      "Harga Satuan (IDR)",
      "Subtotal Line (IDR)",
      "Status Pembayaran Nota",
      "Status Produksi"
    ];

    const rows: (string | number)[][] = [];

    filteredInvoices.forEach(inv => {
      const code = inv.salesCode ? inv.salesCode.trim().toUpperCase() : 'UNKNOWN';
      const official = officialSalesList.find(s => s.code.toUpperCase() === code);
      const salesName = official ? official.name : `Sales ${code}`;

      inv.items.forEach(item => {
        const cat = getItemCategory(item);
        if (selectedCategoryFilter !== 'ALL' && cat !== selectedCategoryFilter) return;

        rows.push([
          inv.invoiceNum,
          inv.date,
          code,
          salesName,
          inv.customerName || 'Pelanggan',
          item.productName,
          cat,
          item.qty,
          item.sellPrice,
          item.total || (item.qty * item.sellPrice),
          inv.status,
          inv.productionStatus || 'PROSES'
        ]);
      });
    });

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => {
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","))
    ].join("\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rincian_Transaksi_PerItem_Sales_dan_JenisProduk_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatIDR = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between shrink-0 border-b border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                Laporan Penjualan Per Sales &amp; Jenis Produk
              </h2>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                Rincian omset, kuantitas item, serta matrik kontribusi per Sales Agent dan Kategori Produk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar & Filters */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Sales Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-extrabold text-slate-600 dark:text-slate-300">Sales:</span>
              <select
                value={selectedSalesFilter}
                onChange={(e) => setSelectedSalesFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Sales Agent</option>
                {officialSalesList.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-extrabold text-slate-600 dark:text-slate-300">Jenis Produk:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Jenis Produk</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-extrabold text-slate-600 dark:text-slate-300">Periode:</span>
              <select
                value={datePeriodFilter}
                onChange={(e) => setDatePeriodFilter(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Waktu</option>
                <option value="MONTH">Bulan Ini</option>
                <option value="WEEK">Minggu Ini</option>
              </select>
            </div>
          </div>

          {/* Export & Print Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportSummaryCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              title="Unduh Ringkasan per Sales & Jenis Produk (CSV)"
            >
              <Download className="w-4 h-4" />
              <span>CSV Ringkasan</span>
            </button>

            <button
              onClick={exportMatrixCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              title="Unduh Matriks Omset (Sales x Jenis Produk) dalam format CSV"
            >
              <Layers className="w-4 h-4" />
              <span>CSV Matriks</span>
            </button>

            <button
              onClick={exportDetailedItemCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              title="Unduh Detail Item per Transaksi"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV Item Rinci</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100">
          
          {/* Printable Document Title */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h1 className="text-xl font-black uppercase">LAPORAN PENJUALAN PER SALES AGENT &amp; JENIS PRODUK</h1>
            <p className="text-xs text-slate-600 mt-1">
              Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-50/20 to-transparent p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Total Omset Terpenuhi</span>
              <p className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-1 font-mono">
                {formatIDR(reportData.grandTotalAmount)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Dari {reportData.salesList.length} Sales Agent terdaftar</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/20 to-transparent p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Total Kuantitas Terjual</span>
              <p className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-1 font-mono">
                {reportData.grandTotalQty.toLocaleString('id-ID')} <span className="text-xs font-sans">pcs</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Rincian {reportData.grandLineItems} baris item produk</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/20 to-transparent p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Kategori Produk Aktif</span>
              <p className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1 font-mono">
                {reportData.categoriesInReport.length} <span className="text-xs font-sans">Kategori</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tersebar di seluruh transaksi sales</p>
            </div>
          </div>

          {/* Crosstab Matrix Table: Sales Agent x Jenis Produk */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Matriks Omset &amp; Qty (Sales Agent vs. Jenis Produk)
            </h3>

            {reportData.salesList.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Tidak ada data penjualan yang cocok dengan kriteria filter saat ini.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider">
                        <th className="px-4 py-3 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 min-w-[150px]">
                          Sales Agent
                        </th>
                        {reportData.categoriesInReport.map(cat => (
                          <th key={cat} className="px-4 py-3 text-right border-r border-slate-800 min-w-[140px]">
                            {cat}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right bg-indigo-950 min-w-[150px]">
                          TOTAL SALES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportData.salesList.map((sales, idx) => (
                        <tr key={sales.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                                {sales.code.slice(0, 2)}
                              </span>
                              <div>
                                <div className="text-xs font-extrabold">{sales.name}</div>
                                <div className="text-[9px] font-mono text-slate-400">({sales.code})</div>
                              </div>
                            </div>
                          </td>

                          {reportData.categoriesInReport.map(cat => {
                            const cData = sales.categoryBreakdown[cat];
                            return (
                              <td key={cat} className="px-4 py-3 text-right font-mono border-r border-slate-100 dark:border-slate-800">
                                {cData && cData.totalAmount > 0 ? (
                                  <div>
                                    <div className="font-black text-slate-800 dark:text-slate-200">
                                      {formatIDR(cData.totalAmount)}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold">
                                      {cData.qty.toLocaleString('id-ID')} pcs
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="px-4 py-3 text-right font-mono bg-indigo-50/40 dark:bg-indigo-950/20 font-black text-indigo-900 dark:text-indigo-200">
                            <div>{formatIDR(sales.totalAmount)}</div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                              {sales.totalQty.toLocaleString('id-ID')} pcs
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700">
                        <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800">
                          TOTAL OMSET PER KATEGORI
                        </td>
                        {reportData.categoriesInReport.map(cat => {
                          const tot = reportData.categoryTotals[cat];
                          return (
                            <td key={cat} className="px-4 py-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">
                              {tot ? (
                                <div>
                                  <div className="text-emerald-700 dark:text-emerald-400">{formatIDR(tot.totalAmount)}</div>
                                  <div className="text-[10px] text-slate-500">{tot.qty.toLocaleString('id-ID')} pcs</div>
                                </div>
                              ) : '-'}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right font-mono bg-indigo-900 text-white text-sm">
                          <div>{formatIDR(reportData.grandTotalAmount)}</div>
                          <div className="text-[10px] text-indigo-200 font-normal">{reportData.grandTotalQty.toLocaleString('id-ID')} pcs</div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Cards by Sales Agent */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Rincian Performa Sales Agent per Kategori Produk
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.salesList.map(sales => (
                <div key={sales.code} className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center">
                        {sales.code.slice(0, 2)}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{sales.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">KODE: {sales.code}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                        {formatIDR(sales.totalAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">{sales.totalQty} pcs terjual</div>
                    </div>
                  </div>

                  {/* Category Progress items */}
                  <div className="space-y-2">
                    {Object.entries(sales.categoryBreakdown).map(([catName, stat]) => {
                      const catStat = stat as { qty: number; totalAmount: number; lineCount: number };
                      const pct = sales.totalAmount > 0 ? Math.round((catStat.totalAmount / sales.totalAmount) * 100) : 0;
                      return (
                        <div key={catName} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-700 dark:text-slate-300">{catName}</span>
                            <div className="font-mono text-right">
                              <span className="font-black text-slate-800 dark:text-slate-100">{formatIDR(catStat.totalAmount)}</span>
                              <span className="text-[10px] text-slate-400 font-semibold ml-1 font-sans">({catStat.qty} pcs • {pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-slate-850 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0 print:hidden">
          <span className="text-slate-500 font-medium">
            Memuat {reportData.salesList.length} Sales Agent dan {reportData.categoriesInReport.length} Jenis Produk.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl cursor-pointer transition shadow-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
