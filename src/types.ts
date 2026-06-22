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
  deadlineDate?: string; // YYYY-MM-DD
  paymentMethodDP?: 'CASH' | 'TRANSFER';
  paymentMethodSettlement?: 'CASH' | 'TRANSFER';
  salesCode?: string; // Kode Sales
}

export interface CashierSession {
  id: string;
  openedAt: string; // ISO String
  openedBy: 'OWNER' | 'KASIR';
  openingBalance: number; // Modal awal
  closedAt?: string; // ISO String
  closedBy?: 'OWNER' | 'KASIR';
  expectedCash: number; // calculated cash in drawer: openingBalance + cash_in
  actualCash?: number; // actual money counted
  notes?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface PaymentTransaction {
  id: string;
  invoiceId?: string;
  invoiceNum?: string;
  customerName?: string;
  amount: number;
  method: 'CASH' | 'TRANSFER';
  type: 'DP' | 'PELUNASAN' | 'PENGELUARAN';
  timestamp: string; // ISO string
  cashier: 'OWNER' | 'KASIR';
  notes?: string;
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

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  user: 'OWNER' | 'KASIR' | 'PRODUKSI';
  actionType: 'CREATE_INVOICE' | 'UPDATE_INVOICE' | 'DELETE_INVOICE' | 'PAYMENT_SETTLEMENT' | 'ADD_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT' | 'RESTOCK_PRODUCT' | 'BULK_IMPORT' | 'RESET_SYSTEM' | 'UPDATE_PASSWORDS';
  module: 'NOTA' | 'STOK' | 'SISTEM';
  description: string;
  referenceNum?: string; // e.g., invoice number or product name
}

export interface SalesAgent {
  code: string;
  name: string;
}


