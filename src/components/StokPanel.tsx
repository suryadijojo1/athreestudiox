/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, StockMovement } from '../types';
import { Search, Plus, RotateCcw, AlertOctagon, TrendingUp, DollarSign, PackagePlus, Edit3, Trash2 } from 'lucide-react';

interface StokPanelProps {
  products: Product[];
  onAddProduct: (product: Product, movement?: StockMovement) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestock: (productId: string, qty: number, reference: string) => void;
  userRole?: 'KASIR' | 'OWNER';
}

export default function StokPanel({ products, onAddProduct, onUpdateProduct, onDeleteProduct, onRestock, userRole = 'OWNER' }: StokPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');

  // Modal / form triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRestockId, setIsRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockRef, setRestockRef] = useState<string>('Restock Supplier');

  // Edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // New product form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [unit, setUnit] = useState('pcs');

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

    const newProductId = `prod-${Date.now()}`;
    const newProduct: Product = {
      id: newProductId,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      sellPrice,
      buyPrice,
      stock: initialStock,
      minStock,
      unit: unit.trim() || 'pcs'
    };

    // If initialStock > 0, make an INITIAL log entry
    let initialMovement: StockMovement | undefined;
    if (initialStock > 0) {
      initialMovement = {
        id: `move-${Date.now()}`,
        productId: newProductId,
        productName: name.trim(),
        sku: sku.trim().toUpperCase(),
        type: 'INITIAL',
        qty: initialStock,
        prevStock: 0,
        currStock: initialStock,
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
    setMinStock(10);
    setUnit('pcs');
    setIsAddOpen(false);
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
          <button
            id="btn-open-add-product"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition duration-155 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-indigo-100 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            Tambah Barang Baru
          </button>
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

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-initialStock">
                  Mulai Stok Awal Gudang
                </label>
                <input
                  type="number"
                  id="add-initialStock"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 rounded-2xl text-slate-800 font-mono font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="add-minStock">
                  Batas Peringatan Minimum
                </label>
                <input
                  type="number"
                  id="add-minStock"
                  min="1"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
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

    </div>
  );
}
