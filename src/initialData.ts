/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Invoice, StockMovement, AuditLog } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'JRS-PRM-01',
    name: 'Jersey Premium Custom (Drifit)',
    category: 'Jersey',
    sellPrice: 150000,
    buyPrice: 90000,
    stock: 25, // Initial was 57, -20 sold in #001, -12 sold in #002 = 25 left
    minStock: 15,
    unit: 'pcs'
  },
  {
    id: 'prod-2',
    sku: 'CLN-STD-02',
    name: 'Celana Futsal Standar Polos',
    category: 'Celana',
    sellPrice: 50000,
    buyPrice: 30000,
    stock: 45,
    minStock: 10,
    unit: 'pcs'
  },
  {
    id: 'prod-3',
    sku: 'BLA-SZ5-03',
    name: 'Bola Sepak Specs Size 5',
    category: 'Peralatan',
    sellPrice: 250000,
    buyPrice: 165000,
    stock: 8,
    minStock: 5,
    unit: 'pcs'
  },
  {
    id: 'prod-4',
    sku: 'KSK-SPC-04',
    name: 'Kaos Kaki Specs Pro (Panjang)',
    category: 'Aksesoris',
    sellPrice: 25000,
    buyPrice: 14000,
    stock: 92,
    minStock: 20,
    unit: 'pasang'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNum: '#001',
    date: '2026-06-15',
    customerName: 'Garuda FC (Budi)',
    customerPhone: '081234567890',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Jersey Premium Custom (Drifit)',
        qty: 20,
        sellPrice: 150000,
        total: 3000000
      }
    ],
    totalQty: 20,
    totalAmount: 3000000,
    downPayment: 1500000,
    settlement: 0,
    remainingDebt: 1500000,
    status: 'DP',
    customStatusLabel: 'DP 50%',
    notes: 'Desain logo Garuda di dada kiri, nomor punggung putih.',
    productionStatus: 'PROSES',
    deadlineDate: '2026-06-25'
  },
  {
    id: 'inv-2',
    invoiceNum: '#002',
    date: '2026-06-16',
    customerName: 'Angkasa Tim (Andi)',
    customerPhone: '087865432100',
    items: [
      {
        id: 'item-2',
        productId: 'prod-1',
        productName: 'Jersey Premium Custom (Drifit)',
        qty: 12,
        sellPrice: 150000,
        total: 1800000
      }
    ],
    totalQty: 12,
    totalAmount: 1800000,
    downPayment: 1800000,
    settlement: 0,
    remainingDebt: 0,
    status: 'LUNAS',
    customStatusLabel: 'LUNAS',
    notes: 'Jersey warna biru navy, nameset kuning emas.',
    productionStatus: 'SIAP_DIAMBIL',
    deadlineDate: '2026-06-20'
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'move-1',
    productId: 'prod-1',
    productName: 'Jersey Premium Custom (Drifit)',
    sku: 'JRS-PRM-01',
    type: 'INITIAL',
    qty: 57,
    prevStock: 0,
    currStock: 57,
    date: '2026-06-10T08:00:00.000Z',
    reference: 'Stok Awal'
  },
  {
    id: 'move-2',
    productId: 'prod-2',
    productName: 'Celana Futsal Standar Polos',
    sku: 'CLN-STD-02',
    type: 'INITIAL',
    qty: 45,
    prevStock: 0,
    currStock: 45,
    date: '2026-06-10T08:05:00.000Z',
    reference: 'Stok Awal'
  },
  {
    id: 'move-3',
    productId: 'prod-3',
    productName: 'Bola Sepak Specs Size 5',
    sku: 'BLA-SZ5-03',
    type: 'INITIAL',
    qty: 8,
    prevStock: 0,
    currStock: 8,
    date: '2026-06-10T08:10:00.000Z',
    reference: 'Stok Awal'
  },
  {
    id: 'move-4',
    productId: 'prod-4',
    productName: 'Kaos Kaki Specs Pro (Panjang)',
    sku: 'KSK-SPC-04',
    type: 'INITIAL',
    qty: 92,
    prevStock: 0,
    currStock: 92,
    date: '2026-06-10T08:15:00.000Z',
    reference: 'Stok Awal'
  },
  {
    id: 'move-5',
    productId: 'prod-1',
    productName: 'Jersey Premium Custom (Drifit)',
    sku: 'JRS-PRM-01',
    type: 'OUT',
    qty: 20,
    prevStock: 57,
    currStock: 37,
    date: '2026-06-15T10:30:00.000Z',
    reference: 'Nota #001'
  },
  {
    id: 'move-6',
    productId: 'prod-1',
    productName: 'Jersey Premium Custom (Drifit)',
    sku: 'JRS-PRM-01',
    type: 'OUT',
    qty: 12,
    prevStock: 37,
    currStock: 25,
    date: '2026-06-16T14:15:00.000Z',
    reference: 'Nota #002'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-10T08:00:00.000Z',
    user: 'OWNER',
    actionType: 'ADD_PRODUCT',
    module: 'STOK',
    description: 'Buka sistem & inisialisasi master barang JRS-PRM-01, CLN-STD-02, BLA-SZ5-03, KSK-SPC-04.',
    referenceNum: 'Inisialisasi Database'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-15T10:30:00.000Z',
    user: 'KASIR',
    actionType: 'CREATE_INVOICE',
    module: 'NOTA',
    description: 'Membuat Nota Pembayaran Jersey Baru #001 untuk pelanggan Garuda FC (Budi) senilai Rp 3.000.000 (status DP 50%).',
    referenceNum: '#001'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-16T14:15:00.000Z',
    user: 'OWNER',
    actionType: 'CREATE_INVOICE',
    module: 'NOTA',
    description: 'Membuat Nota Pembayaran Jersey Baru #002 untuk pelanggan Angkasa Tim (Andi) senilai Rp 1.800.000 (status Lunas).',
    referenceNum: '#002'
  }
];

