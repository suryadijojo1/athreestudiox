/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Invoice, InvoiceItem, StockMovement } from '../types';
import { Plus, Trash, Save, ShoppingCart, User, Phone, FileText, Landmark, Calendar, Info } from 'lucide-react';

interface NotaFormProps {
  products: Product[];
  onSave: (invoice: Invoice, movements: StockMovement[]) => void;
  nextInvoiceNum: string;
  invoiceToEdit?: Invoice | null;
  onCancelEdit?: () => void;
}

export default function NotaForm({ products, onSave, nextInvoiceNum, invoiceToEdit, onCancelEdit }: NotaFormProps) {
  // Customer details
  const [customerName, setCustomerName] = useState(invoiceToEdit ? invoiceToEdit.customerName : '');
  const [customerPhone, setCustomerPhone] = useState(invoiceToEdit ? invoiceToEdit.customerPhone || '' : '');
  const [date, setDate] = useState(() => {
    if (invoiceToEdit) {
      return invoiceToEdit.date.slice(0, 10);
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [notes, setNotes] = useState(invoiceToEdit ? invoiceToEdit.notes || '' : '');
  const [productionStatus, setProductionStatus] = useState<'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL'>(
    invoiceToEdit ? invoiceToEdit.productionStatus || 'ANTREAN' : 'ANTREAN'
  );

  // Selected item line builder
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Added items in the current draft note
  const [draftItems, setDraftItems] = useState<InvoiceItem[]>(
    invoiceToEdit ? invoiceToEdit.items : []
  );
  
  // Payment states
  const [downPayment, setDownPayment] = useState<number>(
    invoiceToEdit ? invoiceToEdit.downPayment : 0
  );
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronize form values when invoiceToEdit changes
  useEffect(() => {
    if (invoiceToEdit) {
      setCustomerName(invoiceToEdit.customerName);
      setCustomerPhone(invoiceToEdit.customerPhone || '');
      setDate(invoiceToEdit.date.slice(0, 10));
      setNotes(invoiceToEdit.notes || '');
      setProductionStatus(invoiceToEdit.productionStatus || 'ANTREAN');
      setDraftItems(invoiceToEdit.items);
      setDownPayment(invoiceToEdit.downPayment);
    } else {
      setCustomerName('');
      setCustomerPhone('');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setNotes('');
      setProductionStatus('ANTREAN');
      setDraftItems([]);
      setDownPayment(0);
    }
    setErrorMessage('');
  }, [invoiceToEdit]);

  // Automatically fetch selected product data
  const activeProduct = products.find(p => p.id === selectedProductId);

  // Sync customPrice whenever active product changes
  useEffect(() => {
    if (activeProduct) {
      setCustomPrice(activeProduct.sellPrice);
      setItemQty(1);
    } else {
      setCustomPrice(0);
      setItemQty(1);
    }
  }, [selectedProductId, activeProduct]);

  // Calculations
  const totalAmount = draftItems.reduce((acc, item) => acc + item.total, 0);
  const totalQty = draftItems.reduce((acc, item) => acc + item.qty, 0);
  const remainingDebt = Math.max(0, totalAmount - downPayment);

  // Suggest status based on DP
  const getStatusInfo = () => {
    if (totalAmount === 0) return { status: 'BELUM_BAYAR' as const, label: 'Draft Kosong' };
    if (downPayment === 0) return { status: 'BELUM_BAYAR' as const, label: 'BELUM BAYAR' };
    if (downPayment >= totalAmount) return { status: 'LUNAS' as const, label: 'LUNAS' };
    
    // DP exists
    const percentage = Math.round((downPayment / totalAmount) * 100);
    return { status: 'DP' as const, label: `DP ${percentage}%` };
  };

  const currentStatusInfo = getStatusInfo();

  // Add Item to list
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !activeProduct) {
      setErrorMessage('Pilih produk terlebih dahulu.');
      return;
    }

    if (itemQty <= 0) {
      setErrorMessage('Jumlah qty barang wajib lebih dari 0.');
      return;
    }

    // Check if there is enough stock
    // Consider quantity already added in draftItems
    const existingDraftItem = draftItems.find(item => item.productId === selectedProductId);
    const alreadyDraftedQty = existingDraftItem ? existingDraftItem.qty : 0;
    const totalRequestedQty = alreadyDraftedQty + itemQty;

    // Factoring inside original allocations if editing
    const originalItem = invoiceToEdit ? invoiceToEdit.items.find(item => item.productId === selectedProductId) : null;
    const originalQtyInOldInvoice = originalItem ? originalItem.qty : 0;
    const maxAvailableStock = activeProduct.stock + originalQtyInOldInvoice;

    if (maxAvailableStock < totalRequestedQty) {
      setErrorMessage(`Stok tidak mencukupi! Stok yang tersedia (termasuk alokasi nota lama) untuk "${activeProduct.name}" hanya ${maxAvailableStock} ${activeProduct.unit}.`);
      return;
    }

    setErrorMessage('');

    if (existingDraftItem) {
      // Modify existing item row
      setDraftItems(draftItems.map(item => {
        if (item.productId === selectedProductId) {
          const updatedQty = item.qty + itemQty;
          return {
            ...item,
            qty: updatedQty,
            sellPrice: customPrice,
            total: updatedQty * customPrice
          };
        }
        return item;
      }));
    } else {
      // Push new item row
      const newItem: InvoiceItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: selectedProductId,
        productName: activeProduct.name,
        qty: itemQty,
        sellPrice: customPrice,
        total: itemQty * customPrice
      };
      setDraftItems([...draftItems, newItem]);
    }

    // Reset items select form input
    setSelectedProductId('');
  };

  // Remove Item from draft
  const handleRemoveDraftItem = (itemId: string) => {
    setDraftItems(draftItems.filter(item => item.id !== itemId));
  };

  // Submit Invoice Form
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setErrorMessage('Nama Pemesan / Tim wajib diisi.');
      return;
    }

    if (draftItems.length === 0) {
      setErrorMessage('Tambahkan minimal 1 item barang ke dalam daftar nota.');
      return;
    }

    if (downPayment < 0) {
      setErrorMessage('Jumlah DP masuk tidak boleh bernilai negatif.');
      return;
    }

    if (downPayment > totalAmount) {
      setErrorMessage('Jumlah DP melebihi total tagihan penjualan.');
      return;
    }

    // Prepare movements and update products
    const currentTimeStamp = new Date().toISOString();
    const movements: StockMovement[] = draftItems.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: item.productId,
        productName: item.productName,
        sku: product.sku,
        type: 'OUT',
        qty: item.qty,
        prevStock: product.stock,
        currStock: product.stock - item.qty,
        date: currentTimeStamp,
        reference: `Nota ${nextInvoiceNum}`
      };
    });

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNum: nextInvoiceNum,
      date,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      items: draftItems,
      totalQty,
      totalAmount,
      downPayment,
      settlement: 0,
      remainingDebt,
      status: currentStatusInfo.status,
      customStatusLabel: currentStatusInfo.label,
      notes: notes.trim() || undefined,
      productionStatus: productionStatus
    };

    onSave(newInvoice, movements);

    // Reset whole form states after save
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setProductionStatus('ANTREAN');
    setDraftItems([]);
    setDownPayment(0);
    setSelectedProductId('');
    setErrorMessage('');
  };

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6" id="nota-form-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-500" />
            {invoiceToEdit ? `Revisi Nota Penjualan` : `Tulis Nota Penjualan Baru`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {invoiceToEdit 
              ? `Melakukan perubahan rincian harga, kuantitas item, penyesuaian otomatis stok gudang, & sisa pelunasan.` 
              : `Nota transaksional dengan auto-deduksi stok gudang, kalkulator termin DP/Pelunasan.`}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          {invoiceToEdit && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 text-xs font-black text-rose-600 hover:text-white bg-white hover:bg-rose-500 border-2 border-rose-100 hover:border-rose-500 rounded-2xl cursor-pointer transition shadow-sm"
              id="btn-cancel-revision"
            >
              Batalkan Revisi ❌
            </button>
          )}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-indigo-100 font-mono text-sm shadow-sm">
            <span className="text-slate-500 font-medium">{invoiceToEdit ? 'No. Nota Direvisi:' : 'No. Nota Berikutnya:'}</span>
            <span className="text-indigo-600 font-black">{nextInvoiceNum}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
          <span className="text-base font-bold">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitInvoice} className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="invoice-builder-form">
        
        {/* Left Column - Customer Details & Add Items Input (2 spans wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Customer Profiling */}
          <div className="p-6 rounded-3xl bg-white border-2 border-indigo-50 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 border-indigo-50 pb-3">
              <User className="w-4 h-4 text-indigo-500" />
              Informasi Pelanggan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="input-customer-name">
                  Nama Pemesan / Tim <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-customer-name"
                    required
                    placeholder="Contoh: Garuda FC (Budi)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-150 animate-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="input-customer-phone">
                  Nomor HP / WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-customer-phone"
                    placeholder="Contoh: 0812345xxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="input-invoice-date">
                  Tanggal Nota <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    id="input-invoice-date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 outline-none transition duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="input-invoice-notes">
                  Catatan Sizing / Warna Desain (Opsional)
                </label>
                <input
                  type="text"
                  id="input-invoice-notes"
                  placeholder="Contoh: Kaos Navy size L=10, XL=10"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-150"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="input-production-status">
                  Status Produksi Awal <span className="text-rose-500">*</span>
                </label>
                <select
                  id="input-production-status"
                  value={productionStatus}
                  onChange={(e) => setProductionStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 font-extrabold outline-none transition duration-150 cursor-pointer"
                >
                  <option value="ANTREAN">⏳ ANTREAN (Belum Mulai)</option>
                  <option value="DESAIN">🎨 DESAIN (Mockup/Approval)</option>
                  <option value="PROSES">⚙️ PROSES (Produksi/Sablon/Jahit)</option>
                  <option value="SELESAI">✅ SELESAI (Finishing/QC)</option>
                  <option value="SIAP_DIAMBIL">📦 SIAP DIAMBIL (Menunggu Pelanggan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Widget: Add Item Row to Receipt */}
          <div className="p-6 rounded-3xl bg-white border-2 border-indigo-50 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 border-indigo-50 pb-3">
              <Plus className="w-4 h-4 text-indigo-500" />
              Masukkan Pilihan Barang / Jasa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              
              {/* Product Select combobox */}
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="select-inventory-item">
                  Pilih Produk Dari Gudang
                </label>
                <select
                  id="select-inventory-item"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition duration-155"
                >
                  <option value="">-- Silakan Pilih Produk --</option>
                  {products.map((p) => (
                    <option 
                      key={p.id} 
                      value={p.id} 
                      className="bg-white text-slate-800"
                      disabled={p.stock <= 0}
                    >
                      {p.name} {p.stock === 0 ? '(STOK HABIS)' : `[Stok: ${p.stock} ${p.unit}]`} - {formatRp(p.sellPrice)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price adjustments (editable sell price per deal) */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="input-custom-price">
                  Harga Satuan (Rp)
                </label>
                <input
                  type="number"
                  id="input-custom-price"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  placeholder="Harga"
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition"
                />
              </div>

              {/* Qty Selector */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="input-item-qty">
                  Jumlah (Qty) {activeProduct ? `(${activeProduct.unit})` : ''}
                </label>
                <input
                  type="number"
                  id="input-item-qty"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition"
                />
              </div>

              {/* Add trigger */}
              <div className="md:col-span-2">
                <button
                  id="btn-add-item-to-draft"
                  type="button"
                  onClick={handleAddItem}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-sm bg-indigo-500 hover:bg-indigo-600 transition text-white font-extrabold rounded-2xl shadow-md uppercase tracking-wider cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>

            </div>

            {/* Display active product info block */}
            {activeProduct && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-500 flex items-center justify-between" id="active-product-helper-badge">
                <span className="flex items-center gap-1.5 font-medium">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  SKU: <strong className="text-slate-700 font-mono">{activeProduct.sku}</strong> | 
                  Kategori: <strong className="text-slate-700">{activeProduct.category}</strong>
                </span>
                <span className="font-bold">
                  Stok tersedia saat ini: <strong className={`font-mono ${activeProduct.stock <= activeProduct.minStock ? 'text-rose-500 animate-pulse' : 'text-emerald-600'}`}>{activeProduct.stock} {activeProduct.unit}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Table: Item List for the current Invoice */}
          <div className="p-0.5 rounded-3xl bg-white border-2 border-indigo-100 overflow-hidden shadow-sm" id="draft-items-table-container">
            <div className="p-4 border-b-2 border-indigo-50 bg-indigo-50/30 flex justify-between items-center">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Daftar Barang Belanjaan</h4>
              <span className="text-xs bg-white text-indigo-600 border border-indigo-100 px-3 py-1 rounded-xl font-bold">
                Total Item: {totalQty}
              </span>
            </div>
            <div className="overflow-x-auto min-h-[160px]">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="bg-indigo-50/50 text-indigo-700 font-black text-xs border-b border-indigo-100 uppercase tracking-wider">
                    <th className="px-5 py-3 w-12 text-center">No</th>
                    <th className="px-5 py-3">Nama Produk</th>
                    <th className="px-5 py-3 text-right">Harga Jual</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                    <th className="px-5 py-3 w-16 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 text-slate-650">
                  {draftItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-bold">
                        Belum ada barang dimasukkan. Gunakan form pilihan barang di atas untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    draftItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-indigo-50/10 text-slate-700">
                        <td className="px-5 py-3.5 text-center font-mono text-xs">{index + 1}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{item.productName}</td>
                        <td className="px-5 py-3.5 text-right font-mono">{formatRp(item.sellPrice)}</td>
                        <td className="px-5 py-3.5 text-center font-black text-indigo-600 font-mono">{item.qty}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-black text-slate-800">{formatRp(item.total)}</td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column - Total billing calculation & payment terms (1 span wide) */}
        <div className="space-y-6">
          
          {/* Card: Calculations Receipt & Payment status */}
          <div className="p-6 rounded-3xl bg-white border-2 border-indigo-100 border-t-8 border-t-indigo-500 space-y-5 shadow-md">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b-2 border-indigo-50">
              <FileText className="w-4 h-4 text-indigo-500" />
              Rincian Pembayaran
            </h3>

            {/* Total Billing */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold">Total Qty Terpilih</span>
                <span className="text-xs font-bold text-slate-700">{totalQty} pcs</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-indigo-100/60 font-bold">
                <span className="text-sm font-black text-slate-700">Total Tagihan</span>
                <span className="text-xl font-black text-indigo-600 font-mono">{formatRp(totalAmount)}</span>
              </div>
            </div>

            {/* DP Input and calculation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500" htmlFor="input-dp-amount">
                DP (Pembayaran Uang Muka) (Rp)
              </label>
              <input
                type="number"
                id="input-dp-amount"
                min="0"
                max={totalAmount}
                value={downPayment || ''}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                placeholder="Contoh: 1500000"
                className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 font-mono font-bold transition"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-bold pt-1">
                <span>DP Sebesar:</span>
                <span className="font-extrabold text-indigo-600">
                  {totalAmount > 0 ? Math.round((downPayment / totalAmount) * 100) : 0}% dari Tagihan
                </span>
              </div>
            </div>

            {/* Outstanding Receivables (Piutang) */}
            <div className="space-y-3 pt-3 border-t-2 border-indigo-50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                  Sisa Piutang (Tagihan Sisa)
                </span>
                <span className={`text-base font-black font-mono ${remainingDebt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatRp(remainingDebt)}
                </span>
              </div>

              {/* Real-time Status Predictor badge */}
              <div className="flex justify-between items-center py-2.5 px-3 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                <span className="text-xs text-slate-500 font-bold">Prediksi Status Bayar</span>
                <span className={`px-3 py-1 text-xs font-black rounded-full ${
                  currentStatusInfo.status === 'LUNAS' 
                    ? 'bg-green-100 text-green-700' 
                    : currentStatusInfo.status === 'DP' 
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {currentStatusInfo.label}
                </span>
              </div>
            </div>

            {/* Note on automatic integration details */}
            <div className="p-4 bg-indigo-50/20 rounded-2xl border border-indigo-50 text-[11px] text-slate-500 leading-relaxed font-bold">
              💡 <strong>Integrasi Otomatis:</strong> Mengklik tombol simpan di bawah akan mengurangi stok masing-masing produk yang tertera di atas secara otomatis di daftar katalog toko Anda.
            </div>

            {/* Submit Action */}
            <button
              id="btn-save-invoice-records"
              type="submit"
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition duration-155 font-black text-white text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-150 uppercase tracking-widest cursor-pointer border-none"
            >
              <Save className="w-4 h-4" />
              Simpan &amp; Kurangi Stok Gudang
            </button>

          </div>
        </div>

      </form>
    </div>
  );
}
