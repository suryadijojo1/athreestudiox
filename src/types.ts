/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellPrice: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface InvoiceItem {
  id: string; // unique item line id
  productId: string;
  productName: string;
  qty: number;
  sellPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNum: string; // e.g., "#001"
  date: string; // YYYY-MM-DD
  customerName: string; // Nama Pemesan / Tim
  customerPhone?: string;
  items: InvoiceItem[];
  totalQty: number;
  totalAmount: number; // Total Tagihan
  downPayment: number; // DP (Masuk)
  settlement: number; // Pelunasan (Tambahan pembayaran)
  remainingDebt: number; // Sisa Piutang
  status: 'BELUM_BAYAR' | 'DP' | 'LUNAS';
  customStatusLabel?: string; // e.g., "DP 50%"
  notes?: string;
  productionStatus?: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL';
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'INITIAL';
  qty: number;
  prevStock: number;
  currStock: number;
  date: string; // ISO String or Local date string
  reference: string; // e.g., "Nota #001" or "Restock Manual"
}
