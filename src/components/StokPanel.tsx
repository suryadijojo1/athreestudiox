/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Product, StockMovement } from '../types';
import { 
  Search, 
  Plus, 
  RotateCcw, 
  AlertOctagon, 
  TrendingUp, 
  DollarSign, 
  PackagePlus, 
  Edit3, 
  Trash2, 
  Calculator, 
  Percent, 
  Coins,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StokPanelProps {
  products: Product[];
  onAddProduct: (product: Product, movement?: StockMovement) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestock: (productId: string, qty: number, reference: string) => void;
  onStockOpname: (productId: string, actualStock: number, reference: string) => void;
  onBulkImport?: (importedProducts: Product[], importedMovements: StockMovement[]) => void;
  userRole?: 'KASIR' | 'OWNER';
}

export default function StokPanel({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onRestock, 
  onStockOpname,
  onBulkImport,
  userRole = 'OWNER' 
}: StokPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');

  // CSV Import States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importSelectedFile, setImportSelectedFile] = useState<File | null>(null);
  const [importProductsPreview, setImportProductsPreview] = useState<Product[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal / form triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRestockId, setIsRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockRef, setRestockRef] = useState<string>('Restock Supplier');

  // Stok Opname States
  const [isOpnameOpen, setIsOpnameOpen] = useState(false);
  const [opnameProductId, setOpnameProductId] = useState<string>('');
  const [opnamePhysicalQty, setOpnamePhysicalQty] = useState<number>(0);
  const [opnameRef, setOpnameRef] = useState<string>('Penyesuaian Stok Fisik');

  // Edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // New product form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [hasInitialStock, setHasInitialStock] = useState<boolean>(true);
  const [minStock, setMinStock] = useState<number>(10);
  const [unit, setUnit] = useState('pcs');

  // Standalone Margin Calculator state
  const [calcCost, setCalcCost] = useState<number>(25000);
  const [calcMargin, setCalcMargin] = useState<number>(40); // 40% default
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);

  // Format currency helper
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Distinct categories list
  const categories = ['SEMUA', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'SEMUA' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Warehouse financial valuations
  const totalStockQty = products.reduce((acc, p) => acc + p.stock, 0);
  const totalBuyValuation = products.reduce((acc, p) => acc + (p.stock * p.buyPrice), 0);
  const totalSellValuation = products.reduce((acc, p) => acc + (p.stock * p.sellPrice), 0);
  const potentialProfitMargin = totalSellValuation - totalBuyValuation;

  // New product submissions
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !category.trim()) return;

    const finalStock = hasInitialStock ? initialStock : 0;
    const newProductId = `prod-${Date.now()}`;
    const newProduct: Product = {
      id: newProductId,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      sellPrice,
      buyPrice,
      stock: finalStock,
      minStock,
      unit: unit.trim() || 'pcs'
    };

    // If initialStock > 0 and using initial stock, make an INITIAL log entry
    let initialMovement: StockMovement | undefined;
    if (hasInitialStock && finalStock > 0) {
      initialMovement = {
        id: `move-${Date.now()}`,
        productId: newProductId,
        productName: name.trim(),
        sku: sku.trim().toUpperCase(),
        type: 'INITIAL',
        qty: finalStock,
        prevStock: 0,
        currStock: finalStock,
        date: new Date().toISOString(),
        reference: 'Input Stok Awal'
      };
    }

    onAddProduct(newProduct, initialMovement);
    
    // Reset Form
    setSku('');
    setName('');
    setCategory('');
    setSellPrice(0);
    setBuyPrice(0);
    setInitialStock(0);
    setHasInitialStock(true);
    setMinStock(10);
    setUnit('pcs');
    setIsAddOpen(false);
  };

  // Robust RFC-4180 compliant CSV Parser with auto delimiter detection (supports comma & semicolon)
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    const firstLine = text.split('\n')[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            cell += '"';
            i++; 
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          row.push(cell.trim());
          cell = '';
        } else if (char === '\n' || char === '\r') {
          row.push(cell.trim());
          cell = '';
          if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
            result.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++; 
          }
        } else {
          cell += char;
        }
      }
    }
    if (cell || row.length > 0) {
      row.push(cell.trim());
      if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
        result.push(row);
      }
    }
    return result;
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "SKU,Nama Barang,Kategori,Harga Jual,Harga Beli,Stok,Stok Minimal,Satuan\n"
      + "TSH-581,Kaos Cotton Combed,Pakaian,85000,55000,100,10,pcs\n"
      + "MUG-202,Mug Custom Keramik,Merchandise,35000,18000,50,15,pcs\n"
      + "PIN-103,Pin Peniti Custom,Aksesoris,12000,5000,200,50,pcs";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_impor_stok.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setImportSelectedFile(file);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setImportError("File kosong atau tidak dapat di-parse.");
          return;
        }

        const lines = parseCSV(text);
        if (lines.length < 2) {
          setImportError("Template CSV harus mempunyai baris header dan minimal satu baris data.");
          return;
        }

        const headers = lines[0];
        const rows = lines.slice(1);

        const headerIndexMap: Record<string, number> = {};
        headers.forEach((h, idx) => {
          const norm = h.toLowerCase().trim();
          if (norm === 'sku' || norm === 'kode' || norm === 'kode barang' || norm === 'id') {
            headerIndexMap['sku'] = idx;
          } else if (norm === 'nama barang' || norm === 'nama' || norm === 'product' || norm === 'barang') {
            headerIndexMap['name'] = idx;
          } else if (norm === 'kategori' || norm === 'category') {
            headerIndexMap['category'] = idx;
          } else if (norm === 'harga jual' || norm === 'harga' || norm === 'sellprice' || norm === 'jual') {
            headerIndexMap['sellPrice'] = idx;
          } else if (norm === 'harga beli' || norm === 'modal' || norm === 'buyprice' || norm === 'beli' || norm === 'hpp') {
            headerIndexMap['buyPrice'] = idx;
          } else if (norm === 'stok' || norm === 'stock' || norm === 'jumlah' || norm === 'qty') {
            headerIndexMap['stock'] = idx;
          } else if (norm === 'stok minimal' || norm === 'min stok' || norm === 'minstock' || norm === 'minimal') {
            headerIndexMap['minStock'] = idx;
          } else if (norm === 'satuan' || norm === 'unit') {
            headerIndexMap['unit'] = idx;
          }
        });

        if (headerIndexMap['name'] === undefined) {
          setImportError("Kolom 'Nama Barang' tidak terdeteksi. Silakan download template agar format kolom sesuai.");
          return;
        }

        const parsedProducts: Product[] = [];
        rows.forEach((row, rIdx) => {
          if (row.length === 0 || !row.some(cell => cell.trim() !== '')) return;

          const rawSku = headerIndexMap['sku'] !== undefined ? row[headerIndexMap['sku']] : '';
          const sku = rawSku ? rawSku.trim().toUpperCase() : `AUTO-${Date.now()}-${rIdx}`;
          const name = headerIndexMap['name'] !== undefined ? row[headerIndexMap['name']] : '';
          
          if (!name.trim()) return;

          const category = (headerIndexMap['category'] !== undefined ? row[headerIndexMap['category']] : '') || 'Umum';
          
          const rawSellPrice = headerIndexMap['sellPrice'] !== undefined ? row[headerIndexMap['sellPrice']] : '0';
          const sellPrice = parseFloat(rawSellPrice.replace(/[^0-9.-]+/g, '')) || 0;
          
          const rawBuyPrice = headerIndexMap['buyPrice'] !== undefined ? row[headerIndexMap['buyPrice']] : '0';
          const buyPrice = parseFloat(rawBuyPrice.replace(/[^0-9.-]+/g, '')) || 0;

          const rawStock = headerIndexMap['stock'] !== undefined ? row[headerIndexMap['stock']] : '0';
          const stock = parseInt(rawStock.replace(/[^0-9.-]+/g, '')) || 0;

          const rawMinStock = headerIndexMap['minStock'] !== undefined ? row[headerIndexMap['minStock']] : '10';
          const minStock = parseInt(rawMinStock.replace(/[^0-9.-]+/g, '')) || 10;

          const unit = (headerIndexMap['unit'] !== undefined ? row[headerIndexMap['unit']] : '') || 'pcs';

          parsedProducts.push({
            id: `temp-${Date.now()}-${rIdx}`,
            sku,
            name: name.trim(),
            category: category.trim(),
            sellPrice,
            buyPrice,
            stock,
            minStock,
            unit: unit.trim()
          });
        });

        if (parsedProducts.length === 0) {
          setImportError("Maaf, tidak ada produk valid yang terbaca dari berkas CSV.");
          return;
        }

        setImportProductsPreview(parsedProducts);
      } catch (err: any) {
        setImportError(`Error mengurai berkas CSV: ${err.message || err}`);
      }
    };
    reader.onerror = () => {
      setImportError("Gagal membaca berkas CSV.");
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importProductsPreview.length === 0 || !onBulkImport) return;
    onBulkImport(importProductsPreview, []);
    
    // Close & reset
    setIsImportOpen(false);
    setImportSelectedFile(null);
    setImportProductsPreview([]);
    setImportError(null);
  };

  // Inline edit fields trigger
  const handleStartEdit = (p: Product) => {
    setEditingProductId(p.id);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setSellPrice(p.sellPrice);
    setBuyPrice(p.buyPrice);
    setMinStock(p.minStock);
    setUnit(p.unit);
  };

  const handleSaveEdit = (pId: string) => {
    const target = products.find(p => p.id === pId);
    if (!target) return;

    const updatedProduct: Product = {
      ...target,
      sku: sku.trim().toUpperCase() || target.sku,
      name: name.trim() || target.name,
      category: category.trim() || target.category,
      sellPrice: sellPrice >= 0 ? sellPrice : target.sellPrice,
      buyPrice: buyPrice >= 0 ? buyPrice : target.buyPrice,
      minStock: minStock >= 0 ? minStock : target.minStock,
      unit: unit.trim() || target.unit
    };

    onUpdateProduct(updatedProduct);
    setEditingProductId(null);
  };

  const handleRestockSubmit = (e: React.FormEvent, pId: string) => {
    e.preventDefault();
    if (restockQty <= 0) return;
    onRestock(pId, restockQty, restockRef);
    setIsRestockId(null);
    setRestockQty(10);
    setRestockRef('Restock Supplier');
  };

  return (
    <div className="space-y-6" id="stok-barang-panel">
      
      {/* Top Banner & Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-indigo-500" />
            Katalog &amp; Gudang Persediaan Barang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen lengkap master barang, harga modal (HPP), harga jual, margin laba kotor, dan alat replenishment.
          </p>
        </div>

        {userRole === 'OWNER' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-open-stok-opname"
              onClick={() => {
                setIsOpnameOpen(true);
                // default values
                setOpnameProductId('');
                setOpnamePhysicalQty(0);
                setOpnameRef('Penyesuaian Stok Fisik');
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition duration-155 font-black rounded-2xl text-xs uppercase tracking-wider cursor-pointer shadow-xs border-solid"
            >
              <RotateCcw className="w-4 h-4" />
              Stok Opname
            </button>
            <button
              id="btn-open-import-csv"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 transition duration-155 font-black rounded-2xl text-xs uppercase tracking-wider cursor-pointer shadow-xs border-solid"
            >
              <Upload className="w-4 h-4" />
              Impor CSV
            </button>
            <button
              id="btn-open-add-product"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition duration-155 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-indigo-100 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              Tambah Barang Baru
            </button>
          </div>
        )}
      </div>

      {/* Warehouse Financial Estimations Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="warehouse-valuations-grid">
        <div className="p-4.5 bg-white border-2 border-indigo-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Volume Gudang Terisi</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalStockQty} <span className="text-xs font-bold text-slate-450 font-sans">items</span></div>
          </div>
          <div className="text-indigo-600 bg-indigo-50 p-3 rounded-2xl border-none">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4.5 bg-white border-2 border-indigo-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Estimasi Modal Aset (HPP)</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {userRole === 'KASIR' ? (
                <span className="text-sm font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">🔒 Akses Owner</span>
              ) : (
                formatRp(totalBuyValuation)
              )}
            </div>
          </div>
          <div className="text-amber-600 bg-amber-50 p-3 rounded-2xl border-none">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4.5 bg-indigo-50/15 border-2 border-indigo-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider">Prospek Untung Kotor</span>
            <div className="text-xl font-black text-indigo-600 mt-0.5">
              {userRole === 'KASIR' ? (
                <span className="text-sm font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">🔒 Akses Owner</span>
              ) : (
                formatRp(potentialProfitMargin)
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 text-[9px] font-black bg-indigo-100 text-indigo-700 rounded-md uppercase tracking-wider">Skenario Terjual</span>
          </div>
        </div>
      </div>

      {/* Standalone Margin and Retail Price Calculator Tool */}
      <div className="bg-white border-2 border-indigo-100 rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300 animate-fade-in" id="margin-calculator-box">
        {/* Toggle Header */}
        <button
          type="button"
          onClick={() => setIsCalcOpen(!isCalcOpen)}
          className="w-full text-left px-6 py-4.5 bg-slate-50 hover:bg-indigo-50/20 flex items-center justify-between border-none cursor-pointer outline-none transition duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                Kalkulator Margin &amp; Harga Jual Pintar
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black font-sans uppercase animate-pulse">Helper</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Simulasi laba kotor, persentase keuntungan, dan konversi harga jual terbaik dari harga modal (HPP).
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-indigo-600 bg-white border border-indigo-100 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition">
            {isCalcOpen ? 'Sembunyikan' : 'Buka Kalkulator'}
          </span>
        </button>

        {isCalcOpen && (
          <div className="p-6 border-t border-indigo-50 bg-white grid grid-cols-1 md:grid-cols-2 gap-6" id="calculator-body">
            {/* Input Side */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-indigo-500" />
                Parameter Biaya &amp; Keuntungan
              </h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="standalone-calc-cost">
                  Harga Modal / HPP Barang (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs font-sans">Rp</span>
                  <input
                    type="number"
                    id="standalone-calc-cost"
                    min="0"
                    value={calcCost}
                    onChange={(e) => setCalcCost(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-indigo-500"
                    placeholder="Contoh: 30000"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500" htmlFor="standalone-calc-margin">
                    Target Keuntungan dari Modal (%)
                  </label>
                  <span className="text-xs font-black text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    +{calcMargin}%
                  </span>
                </div>
                <input
                  type="range"
                  id="standalone-calc-margin"
                  min="5"
                  max="200"
                  step="5"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(Number(e.target.value))}
                  className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />
                
                {/* Preset Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[10, 20, 30, 40, 50, 75, 100].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCalcMargin(m)}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition duration-150 active:scale-95 cursor-pointer ${
                        calcMargin === m
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Calculation Output Side */}
            <div className="p-5 bg-gradient-to-br from-indigo-50/30 to-indigo-50/10 border border-indigo-100 rounded-3xl flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 border-b border-indigo-100 pb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Kuantifikasi Margin Laba
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3.5 rounded-2xl border border-indigo-50/50 shadow-xs">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">HPP (Modal)</span>
                    <p className="text-sm font-bold text-slate-705 font-mono mt-0.5">{formatRp(calcCost)}</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xs">
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-0.5">
                      <Percent className="w-2.5 h-2.5" /> Laba Bersih
                    </span>
                    <p className="text-sm font-black text-emerald-600 font-mono mt-0.5">+{formatRp(Math.round(calcCost * (calcMargin / 100)))}</p>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                  <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest block">Usulan Harga Jual Terhitung</span>
                  <span className="text-xl font-black text-indigo-700 font-mono block mt-1">
                    {formatRp(calcCost + Math.round(calcCost * (calcMargin / 100)))}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1 uppercase">
                    Modal + Untung Kotor ({calcMargin}%)
                  </span>
                </div>
              </div>

              {/* Action helper footer */}
              <div className="border-t border-indigo-100/55 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-semibold">
                <span>💡 Tip: Bulatkan digit terakhir untuk harga jual yang menarik.</span>
                <button
                  type="button"
                  onClick={() => {
                    // Set inputs in add-product form
                    setBuyPrice(calcCost);
                    setSellPrice(calcCost + Math.round(calcCost * (calcMargin / 100)));
                    setIsAddOpen(true);
                  }}
                  className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase cursor-pointer border-none shadow-xs active:scale-95 transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Gunakan di Form Tambah
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lists Filtration Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border-2 border-indigo-100 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="search-product-sku-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk atau nomor SKU..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold outline-none transition"
          />
        </div>

        {/* Categories Scroller */}
        <div className="flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 text-xs font-black rounded-xl border-none transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600'
              }`}
            >
              {cat === 'SEMUA' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-sm" id="products-table-box">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-indigo-150 bg-indigo-50/55 text-xs font-black uppercase tracking-wider text-indigo-700">
                <th className="px-5 py-4 w-32">SKU</th>
                <th className="px-5 py-4">Nama Produk / Jasa</th>
                <th className="px-5 py-4">Kategori</th>
                <th className="px-5 py-4 text-right">Harga Modal (Buy)</th>
                <th className="px-5 py-4 text-right">Harga Jual (Sell)</th>
                <th className="px-5 py-4 text-center">Stok Saat Ini</th>
                <th className="px-5 py-4 text-center w-40">Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50 text-slate-650">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400 font-bold">
                    Tidak ditemukan data produk di gudang Anda. Tambahkan produk baru menggunakan form di atas.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isEditing = editingProductId === p.id;
                  const isLow = p.stock <= p.minStock;
                  const isOut = p.stock === 0;

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-indigo-50/10 transition-colors ${
                        isOut ? 'bg-rose-50/30' : isLow ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* SKU */}
                      <td className="px-5 py-4 font-mono font-black text-indigo-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            className="bg-white border-2 border-indigo-100 px-3 py-1.5 text-xs rounded-xl text-slate-800 font-bold w-full outline-none focus:border-indigo-500"
                          />
                        ) : (
                          p.sku
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white border-2 border-indigo-100 px-3 py-1.5 text-xs rounded-xl text-slate-800 font-bold w-full outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800">{p.name}</div>
                            {isOut && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-700 rounded-md">
                                HABIS TOTAL
                              </span>
                            )}
                            {!isOut && isLow && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 rounded-md">
                                SEGERA RESTOCK (Min: {p.minStock})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="bg-white border-2 border-indigo-100 px-3 py-1.5 text-xs rounded-xl text-slate-800 w-full outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-lg font-bold">
                            {p.category}
                          </span>
                        )}
                      </td>

                      {/* Buy Price */}
                      <td className="px-5 py-4 text-right font-mono font-medium text-slate-500">
                        {isEditing ? (
                          <input
                            type="number"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(Number(e.target.value))}
                            className="bg-white border-2 border-indigo-100 px-2 py-1.5 text-xs rounded-xl text-slate-800 font-mono w-24 text-right outline-none focus:border-indigo-500"
                          />
                        ) : (
                          formatRp(p.buyPrice)
                        )}
                      </td>

                      {/* Sell Price */}
                      <td className="px-5 py-4 text-right font-mono font-bold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(Number(e.target.value))}
                            className="bg-white border-2 border-indigo-100 px-2 py-1.5 text-xs rounded-xl text-slate-800 font-mono w-24 text-right outline-none focus:border-indigo-500"
                          />
                        ) : (
                          formatRp(p.sellPrice)
                        )}
                      </td>

                      {/* Available Stock */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-block font-mono">
                          <span className={`text-base font-black ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-indigo-650'
                          }`}>
                            {p.stock}
                          </span>
                          <span className="text-xs text-slate-400 font-bold font-sans ml-1">
                            {isEditing ? (
                              <input
                                type="text"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="bg-white border-2 border-indigo-100 px-1.5 py-1 text-[11px] rounded-lg text-slate-800 w-12 outline-none"
                              />
                            ) : (
                              p.unit
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex gap-1.5 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                id={`btn-save-edit-${p.id}`}
                                onClick={() => handleSaveEdit(p.id)}
                                className="px-3 py-1.5 text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl border-none cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                id={`btn-cancel-edit-${p.id}`}
                                onClick={() => setEditingProductId(null)}
                                className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border-none cursor-pointer"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            userRole === 'KASIR' ? (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl flex items-center justify-center gap-1" id={`label-role-lock-${p.id}`}>
                                🔒 Hanya Owner
                              </span>
                            ) : (
                              <>
                                {/* Restock action */}
                                <button
                                  id={`btn-restock-${p.id}`}
                                  onClick={() => {
                                    setIsRestockId(p.id);
                                    setRestockQty(10);
                                  }}
                                  className="px-3 py-1.5 text-xs font-black bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white rounded-xl transition flex items-center gap-1 border-none cursor-pointer"
                                >
                                  + Stok
                                </button>

                                {/* Opname action */}
                                <button
                                  id={`btn-opname-${p.id}`}
                                  onClick={() => {
                                    setOpnameProductId(p.id);
                                    setOpnamePhysicalQty(p.stock);
                                    setOpnameRef('Penyesuaian Stok Fisik');
                                    setIsOpnameOpen(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-black bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white rounded-xl transition flex items-center gap-1 border-none cursor-pointer"
                                  title="Stok Opname (Penyesuaian Fisik)"
                                >
                                  Opname
                                </button>

                                {/* Edit triggers */}
                                <button
                                  id={`btn-edit-product-${p.id}`}
                                  onClick={() => handleStartEdit(p)}
                                  className="p-1.5 bg-slate-50 border-none rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  title="Ubah Info Barang"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete trigger */}
                                <button
                                  id={`btn-delete-product-${p.id}`}
                                  onClick={() => {
                                    if (confirm(`Hapus produk "${p.name}"? Transaksi lama tetap dipertahankan.`)) {
                                      onDeleteProduct(p.id);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 border-none rounded-xl text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                  title="Hapus Barang"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Modal: Add New Product */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="add-product-modal">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 border-b-2 border-indigo-50 pb-3 font-bold">
              <Plus className="text-indigo-500 w-5 h-5" />
              Daftarkan Master Barang Baru ke Gudang
            </h3>

            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-sku">
                  Kode SKU Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="add-sku"
                  required
                  placeholder="Contoh: JRS-PRM-05"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 uppercase font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-name">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="add-name"
                  required
                  placeholder="Contoh: Jersey Lengan Panjang"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-category">
                  Kategori Utama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="add-category"
                  required
                  placeholder="Contoh: Jersey / Aksesoris"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-unit">
                  Satuan Stok <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="add-unit"
                  required
                  placeholder="Contoh: pcs / pasang / stel"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-buyPrice">
                  Harga Modal (HPP Satuan) (Rp)
                </label>
                <input
                  type="number"
                  id="add-buyPrice"
                  min="0"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-sellPrice">
                  Harga Jual Satuan (Deal) (Rp)
                </label>
                <input
                  type="number"
                  id="add-sellPrice"
                  min="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-indigo-500"
                />
              </div>
              
              {/* Interactive Margin Helper Row in Add Product Form */}
              <div className="md:col-span-2 p-4 bg-indigo-50/20 border-2 border-indigo-50 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                    <Calculator className="w-4 h-4 text-indigo-500" />
                    Asisten Target Margin &amp; Harga Jual
                  </span>
                  {buyPrice > 0 && sellPrice > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-black font-mono">
                      Margin Keuntungan: {Math.round(((sellPrice - buyPrice) / buyPrice) * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                  Atur persentase keuntungan yang ditambahkan dari Harga Modal (HPP) untuk mengisi harga jual secara otomatis:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-36">
                    <input
                      type="number"
                      placeholder="Custom %"
                      min="1"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        if (buyPrice > 0 && pct > 0) {
                          setSellPrice(Math.round(buyPrice * (1 + pct / 100)));
                        }
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[10, 20, 30, 40, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          if (buyPrice > 0) {
                            setSellPrice(Math.round(buyPrice * (1 + pct / 100)));
                          }
                        }}
                        className="px-3 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-650 text-[10px] font-black rounded-lg transition active:scale-95 cursor-pointer"
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2 border-t border-indigo-50 pt-3">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
                  Metode Pengisian Stok Awal <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHasInitialStock(false);
                      setInitialStock(0);
                    }}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition text-center cursor-pointer ${
                      !hasInitialStock
                        ? "border-amber-500 bg-amber-50/30 text-amber-800"
                        : "border-indigo-50/50 bg-white hover:bg-indigo-50/20 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-tight">Tidak Menghitung Stok Awal</span>
                    <span className="text-[10px] font-medium leading-tight mt-1 text-slate-400">
                      Barang dimulai dengan stok 0
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasInitialStock(true);
                      if (initialStock === 0) setInitialStock(10);
                    }}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition text-center cursor-pointer ${
                      hasInitialStock
                        ? "border-indigo-500 bg-indigo-50/30 text-indigo-800"
                        : "border-indigo-50/50 bg-white hover:bg-indigo-50/20 text-slate-500 hover:text-slate-705"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-tight">Hitung Stok Awal</span>
                    <span className="text-[10px] font-medium leading-tight mt-1 text-slate-400">
                      Tentukan jumlah stok pembuka
                    </span>
                  </button>
                </div>
              </div>

              {hasInitialStock && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-initialStock">
                    Jumlah Stok Pembuka <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="add-initialStock"
                    min="1"
                    required
                    placeholder="Contoh: 50"
                    value={initialStock || ''}
                    onChange={(e) => setInitialStock(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className={hasInitialStock ? "" : "md:col-span-2"}>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-minStock">
                  Batas Minimum (Peringatan Tipis) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="add-minStock"
                  min="1"
                  required
                  placeholder="Contoh: 10"
                  value={minStock || ''}
                  onChange={(e) => setMinStock(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t-2 border-indigo-50 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-2xl transition border-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-confirm-add-product"
                  className="px-5 py-2.5 text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl transition uppercase tracking-wider shadow-md shadow-indigo-100 border-none cursor-pointer"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quickly Restock Item (Membeli barang dari supplier) */}
      {isRestockId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="restock-modal">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 border-b-2 border-indigo-50 pb-3 font-bold">
              <PackagePlus className="text-indigo-500 w-5 h-5" />
              Restock Manual / Tambah Stok Barang
            </h3>

            {(() => {
              const product = products.find(p => p.id === isRestockId);
              if (!product) return null;

              return (
                <form onSubmit={(e) => handleRestockSubmit(e, product.id)} className="space-y-4">
                  <div className="p-4 bg-indigo-50/30 rounded-2xl text-xs space-y-1.5 border border-indigo-50 font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Barang:</span>
                      <strong className="text-slate-800 font-bold">{product.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kode SKU:</span>
                      <strong className="text-indigo-600 font-mono font-black">{product.sku}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Stok Saat Ini:</span>
                      <strong className="text-slate-800 font-mono">{product.stock} {product.unit}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="restock-qty-input">
                        Jumlah Stok Ditambahkan ({product.unit})
                      </label>
                      <input
                        type="number"
                        id="restock-qty-input"
                        required
                        min="1"
                        value={restockQty}
                        onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                        className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="restock-ref-input">
                        Keterangan Restock (Referensi Log)
                      </label>
                      <input
                        type="text"
                        id="restock-ref-input"
                        required
                        value={restockRef}
                        onChange={(e) => setRestockRef(e.target.value)}
                        placeholder="Contoh: Re-supply, Retur kain, dsb"
                        className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-semibold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t-2 border-indigo-50">
                    <button
                      type="button"
                      onClick={() => setIsRestockId(null)}
                      className="px-4 py-2.5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-2xl transition border-none cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      id="btn-confirm-restock"
                      className="px-5 py-2.5 text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl transition uppercase tracking-wider shadow-md shadow-indigo-100 border-none cursor-pointer"
                    >
                      Konfirmasi Tambah Stok
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Stok Opname (Menyeimbangkan stok fisik dengan sistem) */}
      {isOpnameOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="stok-opname-modal">
          <div className="bg-white border-2 border-amber-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 border-b-2 border-amber-50 pb-3 font-bold">
              <RotateCcw className="text-amber-500 w-5 h-5 animate-spin-reverse" />
              Stok Opname (Penyesuaian Fisik)
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!opnameProductId) return;
              onStockOpname(opnameProductId, opnamePhysicalQty, opnameRef);
              setIsOpnameOpen(false);
              setOpnameProductId('');
              setOpnamePhysicalQty(0);
              setOpnameRef('Penyesuaian Stok Fisik');
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="opname-product-select">
                  Pilih Barang untuk Penyesuaian
                </label>
                <select
                  id="opname-product-select"
                  required
                  value={opnameProductId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setOpnameProductId(pId);
                    const prod = products.find(p => p.id === pId);
                    setOpnamePhysicalQty(prod ? prod.stock : 0);
                  }}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-55 rounded-2xl text-slate-800 font-bold outline-none focus:border-amber-500"
                >
                  <option value="" disabled>-- Pilih Barang --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Sistem: {p.stock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {opnameProductId && (() => {
                const product = products.find(p => p.id === opnameProductId);
                if (!product) return null;

                const discrepancy = opnamePhysicalQty - product.stock;

                return (
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold block">Harga Beli (HPP):</span>
                        <strong className="text-slate-800 font-mono font-bold text-sm">
                          {formatRp(product.buyPrice)}
                        </strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold block">Stok Terbaca Sistem:</span>
                        <strong className="text-slate-600 font-mono font-bold text-sm">
                          {product.stock} {product.unit}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="opname-physical-qty">
                          Jumlah Fisik Sebenarnya
                        </label>
                        <input
                          type="number"
                          id="opname-physical-qty"
                          required
                          min="0"
                          value={opnamePhysicalQty}
                          onChange={(e) => setOpnamePhysicalQty(Math.max(0, Number(e.target.value)))}
                          className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">
                          Selisih Penyesuaian
                        </span>
                        <div className={`px-4 py-2 bg-slate-50 rounded-2xl border flex items-center justify-center font-mono font-black text-sm ${
                          discrepancy > 0 
                            ? 'text-emerald-600 border-emerald-100 bg-emerald-50/20' 
                            : discrepancy < 0 
                              ? 'text-rose-600 border-rose-100 bg-rose-50/20' 
                              : 'text-slate-500 border-slate-100'
                        }`}>
                          {discrepancy > 0 ? `+${discrepancy}` : discrepancy} {product.unit}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="opname-ref-input">
                        Keterangan Penyesuaian (Alasan Selisih)
                      </label>
                      <input
                        type="text"
                        id="opname-ref-input"
                        required
                        value={opnameRef}
                        onChange={(e) => setOpnameRef(e.target.value)}
                        placeholder="Contoh: Selisih hitung, barang rusak, audit bulanan"
                        className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-semibold outline-none focus:border-amber-500"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Audit Bulanan', 'Barang Rusak/Cacat', 'Selisih Hitung', 'Salah Input Nota'].map(tag => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => setOpnameRef(tag)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-500 rounded-lg border border-slate-100 transition cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-4 border-t-2 border-indigo-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpnameOpen(false);
                    setOpnameProductId('');
                    setOpnamePhysicalQty(0);
                    setOpnameRef('Penyesuaian Stok Fisik');
                  }}
                  className="px-4 py-2.5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-2xl transition border-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!opnameProductId}
                  className={`px-5 py-2.5 text-xs font-black rounded-2xl transition uppercase tracking-wider shadow-md border-none cursor-pointer text-white ${
                    opnameProductId
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                      : 'bg-slate-300 shadow-none cursor-not-allowed'
                  }`}
                >
                  Terapkan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Modal: Import Products CSV */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="import-csv-modal">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b-2 border-indigo-50 pb-3">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="text-teal-600 w-5 h-5 animate-pulse" />
                Impor Gudang &amp; Stok Masal (.CSV)
              </h3>
              <button 
                onClick={() => {
                  setIsImportOpen(false);
                  setImportSelectedFile(null);
                  setImportProductsPreview([]);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error alerts */}
            {importError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Kesalahan Penguraian CSV:</strong>
                  <span>{importError}</span>
                </div>
              </div>
            )}

            {/* Step 1: No file selected */}
            {!importSelectedFile || importError ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertOctagon className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Panduan Impor:</span> Kode SKU berfungsi sebagai identitas unik. Jika SKU dalam berkas Anda sudah eksis di gawai, jumlah stoknya akan ditambahkan (restock) secara kumulatif dan harga-harga barunya akan langsung terupdate! Jika SKU baru, item akan didaftarkan sebagai barang baru.
                  </div>
                </div>

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 transition duration-155 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer space-y-2 group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 transition duration-155" />
                  <div>
                    <p className="text-sm font-black text-slate-700 tracking-tight">Tarik &amp; Lepaskan berkas CSV Anda di sini</p>
                    <p className="text-xs text-slate-400 mt-0.5">Atau klik untuk menelusuri penyimpanan lokal</p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block bg-slate-200/60 rounded-xl px-2.5 py-1 text-[10px] text-slate-500 font-extrabold font-mono uppercase">Maks format 5MB .csv</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-indigo-50/40 rounded-2xl gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-indigo-500 bg-white p-1.5 rounded-xl border border-indigo-100" />
                    <div>
                      <div className="text-xs font-black text-slate-800">Butuh Format File Contoh?</div>
                      <div className="text-[10px] text-slate-405">Unduh spreadsheet berformat CSV standar POS untuk diisi langsung via Excel atau Google Sheets.</div>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    type="button"
                    className="w-full sm:w-auto flex items-center justify-center gap-1 px-4.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl transition border-none cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Template CSV
                  </button>
                </div>
              </div>
            ) : (
              // Step 2: Previewing parsed products
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl gap-3 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{importSelectedFile.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-medium">Ukuran berkas: {(importSelectedFile.size / 1024).toFixed(2)} KB</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setImportSelectedFile(null);
                      setImportProductsPreview([]);
                      setImportError(null);
                    }}
                    className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3.5 py-2 rounded-xl transition cursor-pointer border-none"
                  >
                    Ganti Berkas CSV
                  </button>
                </div>

                {/* Bento Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-extrabold tracking-wider">Barang Baru Dibuat</span>
                      <div className="text-xl font-black text-slate-800 mt-0.5">{importProductsPreview.filter(p1 => !products.some(p2 => p2.sku === p1.sku)).length} item baru</div>
                    </div>
                    <div className="bg-emerald-100 rounded-xl p-2 text-emerald-600">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-600 uppercase font-extrabold tracking-wider">Barang Eksis Diupdate</span>
                      <div className="text-xl font-black text-slate-800 mt-0.5">{importProductsPreview.filter(p1 => products.some(p2 => p2.sku === p1.sku)).length} item update</div>
                    </div>
                    <div className="bg-indigo-100 rounded-xl p-2 text-indigo-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Spreadsheet Scroll Zone */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 font-sans">Lembar Pratinjau Penguraian ({importProductsPreview.length} Baris data)</span>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] sticky top-0 border-b border-slate-200 z-10 font-sans">
                          <tr>
                            <th className="py-2.5 px-3">SKU / KODE</th>
                            <th className="py-2.5 px-3">NAMA BARANG</th>
                            <th className="py-2.5 px-3">KATEGORI</th>
                            <th className="py-2.5 px-3 text-right">MODAL (HPP)</th>
                            <th className="py-2.5 px-3 text-right">HARGA JUAL</th>
                            <th className="py-2.5 px-3 text-center">STOK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
                          {importProductsPreview.map((item, idx) => {
                            const isOld = products.some(p => p.sku === item.sku);
                            return (
                              <tr key={idx} className={`hover:bg-slate-50/60 ${isOld ? 'bg-indigo-50/5' : ''}`}>
                                <td className="py-2 px-3 font-mono font-bold text-[11px] text-slate-800 tracking-wider">
                                  {item.sku}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800 text-[11px]">
                                  {item.name}
                                  {isOld && (
                                    <span className="inline-block bg-indigo-100 text-indigo-700 text-[9px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded-md ml-1.5">Eksis</span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="bg-slate-100 px-2 py-0.5 text-[10px] rounded-md font-medium">{item.category}</span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-medium">{formatRp(item.buyPrice)}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">{formatRp(item.sellPrice)}</td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-indigo-600">
                                  +{item.stock} <span className="text-[10px] text-slate-400 font-medium font-sans">{item.unit}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t-2 border-indigo-50">
                  <button
                    type="button"
                    onClick={() => {
                      setImportSelectedFile(null);
                      setImportProductsPreview([]);
                      setImportError(null);
                    }}
                    className="px-4 py-2.5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-2xl transition border-none cursor-pointer"
                  >
                    Atur Ulang
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-5 py-2.5 text-xs font-black bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-2xl transition uppercase tracking-wider shadow-md shadow-teal-100 border-none cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Terapkan &amp; Gabung Stok
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
