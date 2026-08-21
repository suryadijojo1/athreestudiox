/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Product, Invoice, InvoiceItem, StockMovement } from '../types';
import { Plus, Trash, Save, ShoppingCart, User, Phone, FileText, Landmark, Calendar, Info, Search, ChevronDown, X, Shirt, Sparkles, Layers, CheckCircle2, Upload, Image as ImageIcon, Clipboard, Eye, ZoomIn, Maximize2, Camera, Check } from 'lucide-react';

export interface JerseyCollarOption {
  id: string;
  name: string;
  category: 'FREE' | 'PREMIUM';
}

export const JERSEY_COLLAR_FREE: JerseyCollarOption[] = [
  { id: 'o-neck', name: 'O NECK', category: 'FREE' },
  { id: 'v-neck', name: 'V NECK', category: 'FREE' },
  { id: 'v-neck-2', name: 'V NECK 2', category: 'FREE' },
  { id: 'v-neck-regular', name: 'V NECK REGULAR', category: 'FREE' },
  { id: 'v-neck-regular-1', name: 'V NECK REGULAR 1', category: 'FREE' },
  { id: 'v-neck-regular-2', name: 'V NECK REGULAR 2', category: 'FREE' },
  { id: 'v-neck-standar', name: 'V NECK STANDAR', category: 'FREE' },
  { id: 'v-neck-siku', name: 'V NECK SIKU', category: 'FREE' },
];

export const JERSEY_COLLAR_PREMIUM: JerseyCollarOption[] = [
  { id: 'v-neck-variasi', name: 'V NECK VARIASI', category: 'PREMIUM' },
  { id: 'v-neck-regular-3', name: 'V NECK REGULAR 3', category: 'PREMIUM' },
  { id: 'v-neck-regular-4', name: 'V NECK REGULAR 4', category: 'PREMIUM' },
  { id: 'polo-variasi-lapisan', name: 'POLO VARIASI LAPISAN', category: 'PREMIUM' },
  { id: 'polo-tali', name: 'POLO TALI', category: 'PREMIUM' },
  { id: 'o-neck-kancing', name: 'O NECK KANCING', category: 'PREMIUM' },
  { id: 'shanghai', name: 'SHANGHAI', category: 'PREMIUM' },
  { id: 'o-reguler', name: 'O REGULER', category: 'PREMIUM' },
  { id: 'polo-variasi', name: 'POLO VARIASI', category: 'PREMIUM' },
  { id: 'polo', name: 'POLO', category: 'PREMIUM' },
  { id: 'kerah-resleting', name: 'KERAH PAKAI RESLETING', category: 'PREMIUM' },
];

export const ALL_JERSEY_COLLARS = [...JERSEY_COLLAR_FREE, ...JERSEY_COLLAR_PREMIUM];

export interface JerseyFabricOption {
  id: string;
  name: string;
  category: 'STANDAR' | 'EMBOSH';
}

export const JERSEY_FABRIC_STANDARD: JerseyFabricOption[] = [
  { id: 'benzema', name: 'BENZEMA', category: 'STANDAR' },
  { id: 'bintik', name: 'BINTIK', category: 'STANDAR' },
  { id: 'milano', name: 'MILANO', category: 'STANDAR' },
];

export const JERSEY_FABRIC_EMBOSH: JerseyFabricOption[] = [
  { id: 'embosh-straw', name: 'Embosh Straw', category: 'EMBOSH' },
  { id: 'embosh-sulkul-nano', name: 'Embosh Sulkul Nano', category: 'EMBOSH' },
  { id: 'embosh-mixed', name: 'Embosh Mixed', category: 'EMBOSH' },
  { id: 'embosh-sulkul-drako', name: 'Embosh Sulkul Drako', category: 'EMBOSH' },
  { id: 'embosh-thopo', name: 'Embosh Thopo', category: 'EMBOSH' },
];

export const ALL_JERSEY_FABRICS = [...JERSEY_FABRIC_STANDARD, ...JERSEY_FABRIC_EMBOSH];

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
  const [notes, setNotes] = useState(invoiceToEdit ? invoiceToEdit.notes || 'JERSEY' : 'JERSEY');
  const [productionStatus, setProductionStatus] = useState<'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL' | 'SUDAH_DIAMBIL'>(
    invoiceToEdit ? invoiceToEdit.productionStatus || 'ANTREAN' : 'ANTREAN'
  );

  // Selected item line builder
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [itemQty, setItemQty] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Jersey Custom Item Builder States (When Jenis Pekerjaan === 'JERSEY')
  const [jerseyPackage, setJerseyPackage] = useState<'Atasan' | 'Atasan + Celana Half' | 'Atasan + Celana Full Printing'>('Atasan');
  const [jerseyFabric, setJerseyFabric] = useState('MILANO');
  const [customFabricText, setCustomFabricText] = useState('');
  const [jerseyCollar, setJerseyCollar] = useState('O NECK');
  const [customCollarText, setCustomCollarText] = useState('');
  const [jerseyQty, setJerseyQty] = useState<number>(1);
  const [jerseyPrice, setJerseyPrice] = useState<number>(120000);
  const [showInventoryPickerInJersey, setShowInventoryPickerInJersey] = useState(false);
  const [showCollarModal, setShowCollarModal] = useState(false);
  const [showFabricModal, setShowFabricModal] = useState(false);

  // Design Upload & Clipboard Paste States
  const [itemDesignImage, setItemDesignImage] = useState<string>('');
  const [invoiceDesignImage, setInvoiceDesignImage] = useState<string>(
    invoiceToEdit ? (invoiceToEdit.designImage || '') : ''
  );
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; title: string } | null>(null);
  const [showPasteToast, setShowPasteToast] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to compress and convert image file to Data URL
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File yang dipilih harus berupa gambar (JPG, PNG, WEBP, dll)'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressedDataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Global listener for clipboard paste (Ctrl+V) anywhere while form is open
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            try {
              const dataUrl = await processImageFile(file);
              setItemDesignImage(dataUrl);
              setShowPasteToast(true);
              setTimeout(() => setShowPasteToast(false), 3500);
            } catch (err: any) {
              console.error('Error processing pasted image:', err);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setItemDesignImage(dataUrl);
      setShowPasteToast(true);
      setTimeout(() => setShowPasteToast(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses gambar');
    }
  };

  const handleDropImage = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setItemDesignImage(dataUrl);
      setShowPasteToast(true);
      setTimeout(() => setShowPasteToast(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses gambar');
    }
  };

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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOfficialSales(parsed);
          }
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
      setNotes(invoiceToEdit.notes || 'JERSEY');
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
      setNotes('JERSEY');
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

  // Add Jersey Custom Item to list
  const handleAddJerseyItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (jerseyQty <= 0) {
      setErrorMessage('Jumlah (Qty) jersey harus minimal 1.');
      return;
    }

    if (jerseyPrice < 0) {
      setErrorMessage('Harga satuan tidak boleh bernilai negatif.');
      return;
    }

    setErrorMessage('');

    // Format descriptive name according to user options
    let formattedName = `Jersey ${jerseyPackage}`;
    const specs: string[] = [];
    const resolvedFabric = jerseyFabric === 'CUSTOM' ? (customFabricText.trim() || 'Custom') : jerseyFabric;
    if (resolvedFabric.trim()) {
      specs.push(`Kain: ${resolvedFabric.trim()}`);
    }
    
    const resolvedCollar = jerseyCollar === 'CUSTOM' ? (customCollarText.trim() || 'Custom') : jerseyCollar;
    if (resolvedCollar) {
      specs.push(`Kerah: ${resolvedCollar}`);
    }

    if (specs.length > 0) {
      formattedName += ` (${specs.join(', ')})`;
    }

    // Match existing Jersey product if available or fallback
    const matchingProduct = products.find(p => p.category === 'JERSEY' || p.name.toLowerCase().includes('jersey')) || products[0];
    const targetProductId = matchingProduct ? matchingProduct.id : 'prod-1';

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: targetProductId,
      productName: formattedName,
      qty: jerseyQty,
      sellPrice: jerseyPrice,
      total: jerseyQty * jerseyPrice,
      designImage: itemDesignImage || undefined
    };

    setDraftItems([...draftItems, newItem]);
    // Reset secondary specs but keep package
    setCustomFabricText('');
    setCustomCollarText('');
    setJerseyQty(1);
    setItemDesignImage('');
  };

  // Add Item to list (Standard Inventory)
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
            total: updatedQty * customPrice,
            designImage: itemDesignImage || item.designImage
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
        total: itemQty * customPrice,
        designImage: itemDesignImage || undefined
      };
      setDraftItems([...draftItems, newItem]);
    }

    // Reset items select form input
    setSelectedProductId('');
    setProductSearchTerm('');
    setIsProductDropdownOpen(false);
    setItemDesignImage('');
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
      const product = products.find(p => p.id === item.productId);
      const sku = product ? product.sku : 'JRS-CST';
      const prevStock = product ? product.stock : 999;
      const currStock = product ? Math.max(0, product.stock - item.qty) : 999;
      return {
        id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: item.productId,
        productName: item.productName,
        sku: sku,
        type: 'OUT',
        qty: item.qty,
        prevStock: prevStock,
        currStock: currStock,
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
                    placeholder="Contoh: GARUDA FC (BUDI)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition duration-150 animate-all uppercase font-semibold"
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
                <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="select-job-type">
                  Jenis Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-job-type"
                  value={
                    ['JERSEY', 'KAOS SABLON', 'MUG CUSTOM'].includes(notes)
                      ? notes
                      : notes
                      ? 'DLL'
                      : 'JERSEY'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'DLL') {
                      setNotes(notes && !['JERSEY', 'KAOS SABLON', 'MUG CUSTOM'].includes(notes) ? notes : 'DLL');
                    } else {
                      setNotes(val);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-2xl text-slate-800 font-extrabold outline-none transition duration-150 cursor-pointer"
                >
                  <option value="JERSEY">JERSEY</option>
                  <option value="KAOS SABLON">KAOS SABLON</option>
                  <option value="MUG CUSTOM">MUG CUSTOM</option>
                  <option value="DLL">DLL (Lainnya)</option>
                </select>
                {(!['JERSEY', 'KAOS SABLON', 'MUG CUSTOM'].includes(notes)) && (
                  <div className="mt-2">
                    <input
                      type="text"
                      id="input-invoice-notes-custom"
                      placeholder="Tuliskan jenis pekerjaan / spesifikasi lainnya..."
                      value={notes === 'DLL' ? '' : notes}
                      onChange={(e) => setNotes(e.target.value ? e.target.value : 'DLL')}
                      className="w-full px-4 py-2 text-xs bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition duration-150 font-semibold"
                    />
                  </div>
                )}
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
                  <option value="SUDAH_DIAMBIL">🤝 SUDAH DI AMBIL (Selesai Penyerahan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Widget: Add Item Row to Receipt */}
          <div className="p-6 rounded-3xl bg-white border-2 border-indigo-50 space-y-4 shadow-sm" id="widget-add-item-container">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-indigo-50 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                {notes === 'JERSEY' && !showInventoryPickerInJersey ? (
                  <>
                    <Shirt className="w-4 h-4 text-indigo-500" />
                    Pilihan Paket Jersey
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Masukkan Pilihan Barang / Jasa
                  </>
                )}
              </h3>
              {notes === 'JERSEY' && (
                <button
                  type="button"
                  onClick={() => setShowInventoryPickerInJersey(!showInventoryPickerInJersey)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border-none cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {showInventoryPickerInJersey ? (
                    <>
                      <Shirt className="w-3.5 h-3.5" />
                      Kembali ke Opsi Paket Jersey
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Pilih dari Stok Gudang
                    </>
                  )}
                </button>
              )}
            </div>

            {notes === 'JERSEY' && !showInventoryPickerInJersey ? (
              /* Jersey Specific Custom Form */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* a. Paket - Dibuat Menurun (Vertikal) */}
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      a. Paket Jersey <span className="text-rose-500">*</span>
                    </label>
                    <div className="space-y-1.5" role="radiogroup" aria-label="Pilihan Paket Jersey">
                      {[
                        { id: 'Atasan', label: '1. Atasan' },
                        { id: 'Atasan + Celana Half', label: '2. Atasan + Celana Half' },
                        { id: 'Atasan + Celana Full Printing', label: '3. Atasan + Celana Full Printing' },
                      ].map((pkg) => {
                        const isSelected = jerseyPackage === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setJerseyPackage(pkg.id as 'Atasan' | 'Atasan + Celana Half' | 'Atasan + Celana Full Printing')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition text-left cursor-pointer border-2 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs'
                                : 'border-indigo-50/70 bg-white hover:bg-indigo-50/30 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="leading-tight">{pkg.label}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Spesifikasi Lainnya (Jenis Kain, Kerah, Harga, Qty, Tombol Tambah) */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* b. Jenis Kain */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-500" htmlFor="select-jersey-fabric">
                            b. Jenis Kain <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowFabricModal(true)}
                            className="text-[10.5px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition"
                            title="Buka katalog jenis kain"
                          >
                            <Layers className="w-3 h-3 text-indigo-500" />
                            <span>Lihat Katalog</span>
                          </button>
                        </div>
                        <select
                          id="select-jersey-fabric"
                          value={jerseyFabric}
                          onChange={(e) => setJerseyFabric(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs font-bold bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition cursor-pointer"
                        >
                          <optgroup label="✨ KAIN STANDAR">
                            {JERSEY_FABRIC_STANDARD.map(f => (
                              <option key={f.id} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="💎 KAIN EMBOSH">
                            {JERSEY_FABRIC_EMBOSH.map(f => (
                              <option key={f.id} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="✍️ KUSTOM / LAINNYA">
                            <option value="CUSTOM">Input Manual / Lainnya...</option>
                          </optgroup>
                        </select>

                        {jerseyFabric === 'CUSTOM' && (
                          <input
                            type="text"
                            placeholder="Ketik jenis kain manual..."
                            value={customFabricText}
                            onChange={(e) => setCustomFabricText(e.target.value)}
                            className="mt-1.5 w-full px-3 py-2 text-xs font-semibold bg-white border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl text-slate-800 placeholder-slate-400"
                            autoFocus
                          />
                        )}
                      </div>

                      {/* c. Model Kerah */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-500" htmlFor="select-jersey-collar">
                            c. Kerah <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCollarModal(true)}
                            className="text-[10.5px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition"
                            title="Buka katalog kerah"
                          >
                            <Layers className="w-3 h-3 text-indigo-500" />
                            <span>Lihat Katalog</span>
                          </button>
                        </div>
                        <select
                          id="select-jersey-collar"
                          value={jerseyCollar}
                          onChange={(e) => setJerseyCollar(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs font-bold bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition cursor-pointer"
                        >
                          <optgroup label="KERAH FREE">
                            {JERSEY_COLLAR_FREE.map(c => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="KERAH PREMIUM">
                            {JERSEY_COLLAR_PREMIUM.map(c => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="KUSTOM / LAINNYA">
                            <option value="CUSTOM">Input Manual / Lainnya...</option>
                          </optgroup>
                        </select>

                        {jerseyCollar === 'CUSTOM' && (
                          <input
                            type="text"
                            placeholder="Ketik model kerah manual..."
                            value={customCollarText}
                            onChange={(e) => setCustomCollarText(e.target.value)}
                            className="mt-1.5 w-full px-3 py-2 text-xs font-semibold bg-white border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl text-slate-800 placeholder-slate-400"
                            autoFocus
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Harga Satuan */}
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="input-jersey-price">
                          Harga Satuan (Rp)
                        </label>
                        <input
                          type="text"
                          id="input-jersey-price"
                          value={jerseyPrice === 0 ? '' : jerseyPrice.toLocaleString('id-ID')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setJerseyPrice(val ? parseInt(val, 10) : 0);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2.5 text-xs font-mono font-bold bg-indigo-50/10 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition"
                        />
                      </div>

                      {/* d. Jumlah (Qty) */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 mb-1" htmlFor="input-jersey-qty">
                          d. Qty (Pcs)
                        </label>
                        <input
                          type="number"
                          id="input-jersey-qty"
                          min="1"
                          value={jerseyQty}
                          onChange={(e) => setJerseyQty(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-2.5 text-xs font-bold text-center bg-indigo-50/10 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition"
                        />
                      </div>

                      {/* Tombol Tambah */}
                      <div className="sm:col-span-3">
                        <button
                          id="btn-add-jersey-item-to-draft"
                          type="button"
                          onClick={handleAddJerseyItem}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold rounded-2xl shadow-md uppercase tracking-wider cursor-pointer border-none"
                          title="Tambahkan item paket jersey ke draft nota"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-[11px] text-slate-600">
                      Preview Item: <strong className="text-indigo-700">Jersey {jerseyPackage}</strong>
                      <span> • Kain: <strong className="text-slate-800">{jerseyFabric === 'CUSTOM' ? (customFabricText || 'Custom') : jerseyFabric}</strong></span>
                      <span> • Kerah: <strong className="text-slate-800">{jerseyCollar === 'CUSTOM' ? (customCollarText || 'Custom') : jerseyCollar}</strong></span>
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500">
                    Harga: <span className="font-mono text-indigo-600">{formatRp(jerseyPrice)}</span> x {jerseyQty} = <strong className="text-indigo-700 font-mono text-xs">{formatRp(jerseyQty * jerseyPrice)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Inventory Selector */
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
                  type="text"
                  id="input-custom-price"
                  value={customPrice === 0 ? '' : customPrice.toLocaleString('id-ID')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setCustomPrice(val ? parseInt(val, 10) : 0);
                  }}
                  placeholder="Harga"
                  className="w-full px-4 py-2.5 text-sm bg-indigo-50/10 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none rounded-2xl text-slate-800 outline-none transition font-mono font-bold"
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
          )}

          {/* Display active product info block */}
          {activeProduct && (!notes || notes !== 'JERSEY' || showInventoryPickerInJersey) && (
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
                type="text"
                id="input-dp-amount"
                value={downPayment === 0 ? '' : downPayment.toLocaleString('id-ID')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  const numVal = val ? parseInt(val, 10) : 0;
                  setDownPayment(Math.min(totalAmount, numVal));
                }}
                placeholder="Contoh: 1.500.000"
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

      {/* Modal Katalog Kerah - Athree Studio Jayapura */}
      {showCollarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-indigo-100 dark:border-slate-800 p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-200">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white tracking-wide uppercase">
                    Katalog Kerah Jersey
                  </h3>
                  <p className="text-xs font-bold text-orange-600 tracking-wider">
                    ATHREE STUDIO JAYAPURA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCollarModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: KERAH FREE */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-lg">
                  KERAH <span className="text-orange-400">FREE</span>
                </span>
                <span className="text-xs text-slate-400 font-semibold">Pilihan model kerah standar</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {JERSEY_COLLAR_FREE.map((collar) => {
                  const isSelected = jerseyCollar === collar.name;
                  return (
                    <button
                      key={collar.id}
                      type="button"
                      onClick={() => {
                        setJerseyCollar(collar.name);
                        setShowCollarModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200 font-extrabold shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black tracking-tight leading-tight">
                        {collar.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-orange-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: KERAH PREMIUM */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-lg">
                  KERAH <span className="text-orange-400">PREMIUM</span>
                </span>
                <span className="text-xs text-slate-400 font-semibold">Pilihan model kerah premium</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {JERSEY_COLLAR_PREMIUM.map((collar) => {
                  const isSelected = jerseyCollar === collar.name;
                  return (
                    <button
                      key={collar.id}
                      type="button"
                      onClick={() => {
                        setJerseyCollar(collar.name);
                        setShowCollarModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200 font-extrabold shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black tracking-tight leading-tight">
                        {collar.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-orange-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Klik salah satu opsi untuk langsung menerapkan ke formulir nota.
              </span>
              <button
                type="button"
                onClick={() => setShowCollarModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer border-none"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Modal Katalog Jenis Kain - Athree Studio Jayapura */}
      {showFabricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-indigo-100 dark:border-slate-800 p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white tracking-wide uppercase">
                    Katalog Jenis Kain Jersey
                  </h3>
                  <p className="text-xs font-bold text-indigo-600 tracking-wider">
                    ATHREE STUDIO JAYAPURA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFabricModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: KAIN STANDAR */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-lg">
                  KAIN <span className="text-indigo-400">STANDAR</span>
                </span>
                <span className="text-xs text-slate-400 font-semibold">Pilihan bahan kain tekstur standar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {JERSEY_FABRIC_STANDARD.map((fabric) => {
                  const isSelected = jerseyFabric === fabric.name;
                  return (
                    <button
                      key={fabric.id}
                      type="button"
                      onClick={() => {
                        setJerseyFabric(fabric.name);
                        setShowFabricModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-extrabold shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black tracking-tight leading-tight">
                        {fabric.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: KAIN EMBOSH */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-lg">
                  KAIN <span className="text-indigo-400">EMBOSH</span>
                </span>
                <span className="text-xs text-slate-400 font-semibold">Pilihan motif embosh bertekstur</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {JERSEY_FABRIC_EMBOSH.map((fabric) => {
                  const isSelected = jerseyFabric === fabric.name;
                  return (
                    <button
                      key={fabric.id}
                      type="button"
                      onClick={() => {
                        setJerseyFabric(fabric.name);
                        setShowFabricModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-extrabold shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black tracking-tight leading-tight">
                        {fabric.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Klik salah satu jenis kain untuk langsung memilih ke formulir nota.
              </span>
              <button
                type="button"
                onClick={() => setShowFabricModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer border-none"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
