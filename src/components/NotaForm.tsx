/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Invoice, InvoiceItem, StockMovement } from '../types';
import { Plus, Trash, Save, ShoppingCart, User, Phone, FileText, Landmark, Calendar, Info, Search, ChevronDown, X } from 'lucide-react';

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
  const [salesCode, setSalesCode] = useState(invoiceToEdit ? invoiceToEdit.salesCode || '' : '');
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
  const [deadlineDate, setDeadlineDate] = useState(() => {
    if (invoiceToEdit && invoiceToEdit.deadlineDate) {
      return invoiceToEdit.deadlineDate.slice(0, 10);
    }
    return '';
  });
  const [notes, setNotes] = useState(invoiceToEdit ? invoiceToEdit.notes || '' : '');
  const [productionStatus, setProductionStatus] = useState<'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL'>(
    invoiceToEdit ? invoiceToEdit.productionStatus || 'ANTREAN' : 'ANTREAN'
  );

  // Selected item line builder
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
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
  const [paymentMethodDP, setPaymentMethodDP] = useState<'CASH' | 'TRANSFER'>(
    invoiceToEdit ? (invoiceToEdit.paymentMethodDP || 'CASH') : 'CASH'
  );
  const [errorMessage, setErrorMessage] = useState('');

  // Loaded bank accounts for transfer payment display in dropdown / lists
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bankName: string; accountNumber: string; accountOwner: string }[]>(() => {
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
  });

  useEffect(() => {
    const handleRefresh = () => {
      try {
        const saved = localStorage.getItem('athree_bank_accounts');
        if (saved) setBankAccounts(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('athree-rekening-changed', handleRefresh);
    return () => window.removeEventListener('athree-rekening-changed', handleRefresh);
  }, []);

  const [officialSales, setOfficialSales] = useState<{ code: string; name: string }[]>(() => {
    const saved = localStorage.getItem('athree_sales_agents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { code: 'SL-01', name: 'Dewi Lestari' },
      { code: 'SL-02', name: 'Budi Hermawan' },
      { code: 'SL-03', name: 'Stephanus' },
      { code: 'SL-04', name: 'Martha Papua' }
    ];
  });

  useEffect(() => {
    const handleSyncSales = () => {
      const saved = localStorage.getItem('athree_sales_agents');
      if (saved) {
        try {
          setOfficialSales(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('athree-sales-agents-changed', handleSyncSales);
    window.addEventListener('storage', handleSyncSales);
    return () => {
      window.removeEventListener('athree-sales-agents-changed', handleSyncSales);
      window.removeEventListener('storage', handleSyncSales);
    };
  }, []);

  // Synchronize form values when invoiceToEdit changes
  useEffect(() => {
    if (invoiceToEdit) {
      setCustomerName(invoiceToEdit.customerName);
      setCustomerPhone(invoiceToEdit.customerPhone || '');
      setSalesCode(invoiceToEdit.salesCode || '');
      setDate(invoiceToEdit.date.slice(0, 10));
      setDeadlineDate(invoiceToEdit.deadlineDate ? invoiceToEdit.deadlineDate.slice(0, 10) : '');
      setNotes(invoiceToEdit.notes || '');
      setProductionStatus(invoiceToEdit.productionStatus || 'ANTREAN');
      setDraftItems(invoiceToEdit.items);
      setDownPayment(invoiceToEdit.downPayment);
      setPaymentMethodDP(invoiceToEdit.paymentMethodDP || 'CASH');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setSalesCode('');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setDeadlineDate('');
      setNotes('');
      setProductionStatus('ANTREAN');
      setDraftItems([]);
      setDownPayment(0);
      setPaymentMethodDP('CASH');
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
    setProductSearchTerm('');
    setIsProductDropdownOpen(false);
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

    if (salesCode.trim()) {
      const codeToCheck = salesCode.trim().toUpperCase();
      const isValid = officialSales.some(s => s.code.toUpperCase() === codeToCheck);
      if (!isValid) {
        setErrorMessage(`Kode Sales "${salesCode}" tidak terdaftar dalam daftar sales resmi! Silakan periksa kembali atau daftarkan Kode Sales baru di menu Pengaturan Toko.`);
        return;
      }
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
      salesCode: salesCode.trim() || undefined,
      items: draftItems,
      totalQty,
      totalAmount,
      downPayment,
      settlement: 0,
      remainingDebt,
      status: currentStatusInfo.status,
      customStatusLabel: currentStatusInfo.label,
      notes: notes.trim() || undefined,
      productionStatus: productionStatus,
      deadlineDate: deadlineDate ? deadlineDate : undefined,
      paymentMethodDP: downPayment > 0 ? paymentMethodDP : undefined
    };

    onSave(newInvoice, movements);

    // Reset whole form states after save
    setCustomerName('');
    setCustomerPhone('');
    setSalesCode('');
    setDeadlineDate('');
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
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="input-sales-code">
                  Kode Sales (Opsional)
                </label>
                <input
                  type="text"
                  id="input-sales-code"
                  placeholder="Contoh: SL-01, DEWI, dsb."
                  value={salesCode}
                  onChange={(e) => setSalesCode(e.target.value)}
                  list="sales-suggestions"
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-150 uppercase font-black tracking-normal"
                />
                <datalist id="sales-suggestions">
                  {officialSales.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </datalist>

                {salesCode.trim() && (() => {
                  const verified = officialSales.find(s => s.code.toUpperCase() === salesCode.trim().toUpperCase());
                  return verified ? (
                    <p className="mt-1 text-[10.5px] font-extrabold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-xl inline-flex items-center gap-1 border border-emerald-100/40">
                      <span>✓</span> Sales Terdaftar: <strong className="uppercase">{verified.name}</strong>
                    </p>
                  ) : (
                    <p className="mt-1 text-[10.5px] font-extrabold text-rose-600 bg-rose-50/50 px-2.5 py-1 rounded-xl inline-flex items-center gap-1 border border-rose-100/40">
                      <span>✗</span> Kode tidak valid / tidak terdaftar
                    </p>
                  );
                })()}
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
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="input-deadline-date">
                  Tanggal Deadline (Tenggat Selesai) <span className="text-indigo-500/80 font-semibold">(Opsional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                  </div>
                  <input
                    type="date"
                    id="input-deadline-date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
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
              <div className="md:col-span-5 relative" id="product-combobox-container">
                <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="select-inventory-item-search">
                  Pilih Produk Dari Gudang (Bisa Diketik)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="select-inventory-item-search"
                    placeholder="Ketik nama produk untuk mencari..."
                    value={activeProduct && !isProductDropdownOpen ? activeProduct.name : productSearchTerm}
                    onFocus={() => {
                      setIsProductDropdownOpen(true);
                      if (activeProduct) {
                        setProductSearchTerm('');
                      }
                    }}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-indigo-50/10 hover:bg-indigo-55/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-155"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4 text-indigo-400" />
                  </div>
                  {selectedProductId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductId('');
                        setProductSearchTerm('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-650 border-none bg-transparent cursor-pointer flex items-center justify-center rounded-lg hover:bg-rose-50"
                      title="Hapus pilihan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Dropdown list of filtered products */}
                {isProductDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsProductDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border-2 border-indigo-100 rounded-2xl shadow-xl z-40 divide-y divide-slate-100 select-none">
                      {(() => {
                        const filtered = products.filter(p => 
                          p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()))
                        );
                        
                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-xs font-black text-slate-400 text-center flex flex-col items-center justify-center gap-1">
                              <span>❌ Produk tidak ditemukan</span>
                              <span className="text-[10px] font-medium text-slate-400">Coba kata kunci pencarian lainnya</span>
                            </div>
                          );
                        }
                        
                        return filtered.map((p) => {
                          const isSelected = p.id === selectedProductId;
                          const isOutOfStock = p.stock <= 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                if (!isOutOfStock) {
                                  setSelectedProductId(p.id);
                                  setProductSearchTerm('');
                                  setIsProductDropdownOpen(false);
                                }
                              }}
                              className={`w-full text-left px-3.5 py-3 text-xs transition duration-100 flex items-center justify-between border-none cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-50 text-indigo-700 font-extrabold' 
                                  : isOutOfStock 
                                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-60' 
                                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-650 font-bold'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <span className={`block ${isSelected ? 'font-black text-indigo-700' : isOutOfStock ? 'text-slate-350 line-through' : 'text-slate-800'}`}>
                                  {p.name}
                                </span>
                                {p.sku && (
                                  <span className="text-[9.5px] text-slate-400 font-mono tracking-tight font-medium">SKU: {p.sku}</span>
                                )}
                              </div>
                              <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                <span className={`font-mono ${isSelected ? 'font-black text-indigo-700' : isOutOfStock ? 'text-slate-300' : 'font-extrabold text-slate-800'}`}>
                                  {formatRp(p.sellPrice)}
                                </span>
                                <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                                  isOutOfStock 
                                    ? 'bg-rose-50 text-rose-500' 
                                    : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {isOutOfStock ? 'HABIS' : `Stok: ${p.stock} ${p.unit}`}
                                </span>
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
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

            {/* DP Payment Method Selection */}
            {downPayment > 0 && (
              <div className="space-y-2 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Metode Pembayaran DP
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodDP('CASH')}
                    className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethodDP === 'CASH'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs'
                        : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    💵 Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethodDP('TRANSFER')}
                    className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethodDP === 'TRANSFER'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs'
                        : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    🏦 Transfer Bank
                  </button>
                </div>

                {paymentMethodDP === 'TRANSFER' && bankAccounts.length > 0 && (
                  <div className="mt-2 text-[10.5px] border-t border-indigo-100/50 pt-2.5 space-y-1.5">
                    <p className="font-extrabold text-slate-500 uppercase tracking-wider block">Pilihan Rekening Pembayaran Toko:</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {bankAccounts.map((acc) => (
                        <div key={acc.id} className="p-2 border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl flex justify-between items-center">
                          <div className="leading-normal">
                            <span className="font-black text-indigo-600 block">{acc.bankName}</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{acc.accountNumber}</span>
                          </div>
                          <span className="font-bold text-[9.5px] text-slate-400 text-right leading-none block">a/n {acc.accountOwner}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
