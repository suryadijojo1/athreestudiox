/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Invoice, StockMovement } from './types';
import { INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_MOVEMENTS } from './initialData';

// Component imports
import Dashboard from './components/Dashboard';
import NotaForm from './components/NotaForm';
import NotaList from './components/NotaList';
import NotaDetailModal from './components/NotaDetailModal';
import StokPanel from './components/StokPanel';
import LaporanStok from './components/LaporanStok';
import LoginForm from './components/LoginForm';

// Icon imports
import { 
  BarChart3, 
  Receipt, 
  ShoppingCart, 
  Boxes, 
  LayoutDashboard, 
  Info,
  RotateCcw,
  Sparkles,
  Github,
  Users,
  Crown,
  Edit,
  Lock
} from 'lucide-react';

export default function App() {
  // --- CORE STATE MANAGERS ---
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('athree_logged_in') === 'true';
  });

  // User Role State: KASIR or OWNER (Defaults to OWNER)
  const [userRole, setUserRole] = useState<'KASIR' | 'OWNER'>(() => {
    const saved = localStorage.getItem('athree_user_role');
    return (saved as any) || 'KASIR';
  });

  // Invoice currently being revised / edited
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const handleLoginSuccess = (role: 'KASIR' | 'OWNER') => {
    setUserRole(role);
    setIsLoggedIn(true);
    localStorage.setItem('athree_user_role', role);
    localStorage.setItem('athree_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('athree_logged_in');
  };

  // Navigation tab route state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Selected Invoice reference for full carbon-sheet modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // --- INITIALIZATION (LocalStorage loading) ---
  useEffect(() => {
    const storedProducts = localStorage.getItem('nota_stok_products');
    const storedInvoices = localStorage.getItem('nota_stok_invoices');
    const storedMovements = localStorage.getItem('nota_stok_movements');

    if (storedProducts && storedInvoices && storedMovements) {
      setProducts(JSON.parse(storedProducts));
      setInvoices(JSON.parse(storedInvoices));
      setMovements(JSON.parse(storedMovements));
    } else {
      // First time loading, seed with premium mock presets
      setProducts(INITIAL_PRODUCTS);
      setInvoices(INITIAL_INVOICES);
      setMovements(INITIAL_MOVEMENTS);
      
      localStorage.setItem('nota_stok_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('nota_stok_invoices', JSON.stringify(INITIAL_INVOICES));
      localStorage.setItem('nota_stok_movements', JSON.stringify(INITIAL_MOVEMENTS));
    }
  }, []);

  // Sync state changes with physical browser storage on mutation
  const syncToLocalStorage = (newProds: Product[], newInvs: Invoice[], newMoves: StockMovement[]) => {
    setProducts(newProds);
    setInvoices(newInvs);
    setMovements(newMoves);

    localStorage.setItem('nota_stok_products', JSON.stringify(newProds));
    localStorage.setItem('nota_stok_invoices', JSON.stringify(newInvs));
    localStorage.setItem('nota_stok_movements', JSON.stringify(newMoves));

    // If an invoice is currently opened, refresh its properties
    if (selectedInvoice) {
      const refreshed = newInvs.find(inv => inv.id === selectedInvoice.id);
      if (refreshed) setSelectedInvoice(refreshed);
    }
  };

  // --- HANDLERS / WORKFLOWS ---

  // Add new receipt + automatically deduct products out of inventory
  const handleSaveInvoice = (newInvoice: Invoice, invoiceMovements: StockMovement[]) => {
    let nextInvoices = [...invoices];
    let nextMovements = [...movements];
    let nextProducts = [...products];

    if (invoiceToEdit) {
      // Revert previous invoice items' stock effect
      nextProducts = nextProducts.map(prod => {
        const oldItem = invoiceToEdit.items.find(item => item.productId === prod.id);
        if (oldItem) {
          return {
            ...prod,
            stock: prod.stock + oldItem.qty
          };
        }
        return prod;
      });

      // Deduct stock levels of products in the new version
      nextProducts = nextProducts.map(prod => {
        const newItem = newInvoice.items.find(item => item.productId === prod.id);
        if (newItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - newItem.qty)
          };
        }
        return prod;
      });

      // Replace old invoice with updated one
      // Maintain previous settlement if any
      const updatedInvoice: Invoice = {
        ...newInvoice,
        id: invoiceToEdit.id,
        invoiceNum: invoiceToEdit.invoiceNum,
        settlement: invoiceToEdit.settlement,
        remainingDebt: Math.max(0, newInvoice.totalAmount - (newInvoice.downPayment + invoiceToEdit.settlement)),
      };

      // Re-evaluate correct status based on payment progress (settlement exists)
      const totalPaid = updatedInvoice.downPayment + updatedInvoice.settlement;
      if (updatedInvoice.remainingDebt === 0) {
        updatedInvoice.status = 'LUNAS';
        updatedInvoice.customStatusLabel = 'LUNAS';
      } else if (totalPaid > 0) {
        const pct = Math.round((totalPaid / updatedInvoice.totalAmount) * 100);
        updatedInvoice.status = 'DP';
        updatedInvoice.customStatusLabel = `DP ${pct}%`;
      } else {
        updatedInvoice.status = 'BELUM_BAYAR';
        updatedInvoice.customStatusLabel = 'BELUM BAYAR';
      }

      nextInvoices = nextInvoices.map(inv => inv.id === invoiceToEdit.id ? updatedInvoice : inv);

      // Clean old movement logs of the revised invoice & prepend new ones
      nextMovements = nextMovements.filter(m => m.reference !== `Nota ${invoiceToEdit.invoiceNum}`);
      // Generate movement records with revised prevStock/currStock levels
      const revisedMovements = invoiceMovements.map(m => {
        const correspondingProduct = nextProducts.find(p => p.id === m.productId);
        return {
          ...m,
          reference: `Nota ${invoiceToEdit.invoiceNum}`,
          prevStock: correspondingProduct ? correspondingProduct.stock + m.qty : m.prevStock,
          currStock: correspondingProduct ? correspondingProduct.stock : m.currStock,
        };
      });
      nextMovements = [...revisedMovements, ...nextMovements];

      setInvoiceToEdit(null);
    } else {
      // Create invoice flow
      const nextId = `inv-${Date.now()}`;
      const savedInvoice = {
        ...newInvoice,
        id: nextId,
      };
      
      nextInvoices = [savedInvoice, ...nextInvoices];
      nextMovements = [...invoiceMovements, ...nextMovements];

      // Deduct stock levels of products that were bought
      nextProducts = nextProducts.map(prod => {
        const itemDeducted = savedInvoice.items.find(item => item.productId === prod.id);
        if (itemDeducted) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - itemDeducted.qty)
          };
        }
        return prod;
      });
    }

    syncToLocalStorage(nextProducts, nextInvoices, nextMovements);
    setActiveTab('daftar-nota'); // Redirect seamlessly to invoice report
  };

  // Record intermediate Down Payments / Partial settlement payments
  const handlePaySettlement = (invoiceId: string, amountPaid: number) => {
    const nextInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        const nextSettlement = inv.settlement + amountPaid;
        const nextRemaining = Math.max(0, inv.totalAmount - (inv.downPayment + nextSettlement));
        let nextStatus = inv.status;
        let nextLabel = inv.customStatusLabel;

        if (nextRemaining === 0) {
          nextStatus = 'LUNAS';
          nextLabel = 'LUNAS';
        } else {
          // Keep active DP status but recalculate percentages
          const totalPaidSoFar = inv.downPayment + nextSettlement;
          const percentage = Math.round((totalPaidSoFar / inv.totalAmount) * 100);
          nextStatus = 'DP';
          nextLabel = `DP ${percentage}%`;
        }

        return {
          ...inv,
          settlement: nextSettlement,
          remainingDebt: nextRemaining,
          status: nextStatus,
          customStatusLabel: nextLabel
        };
      }
      return inv;
    });

    syncToLocalStorage(products, nextInvoices, movements);
  };

  // Update production status of an invoice
  const handleUpdateProductionStatus = (invoiceId: string, status: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL') => {
    const nextInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          productionStatus: status
        };
      }
      return inv;
    });

    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice({
        ...selectedInvoice,
        productionStatus: status
      });
    }

    syncToLocalStorage(products, nextInvoices, movements);
  };

  // Add brand new stock master item
  const handleAddProduct = (newProduct: Product, optionalInitialMovement?: StockMovement) => {
    const nextProducts = [...products, newProduct];
    const nextMovements = optionalInitialMovement 
      ? [optionalInitialMovement, ...movements] 
      : movements;

    syncToLocalStorage(nextProducts, invoices, nextMovements);
  };

  // Update existing product attributes
  const handleUpdateProduct = (updatedProduct: Product) => {
    const nextProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    syncToLocalStorage(nextProducts, invoices, movements);
  };

  // Delete product master item
  const handleDeleteProduct = (productId: string) => {
    const nextProducts = products.filter(p => p.id !== productId);
    syncToLocalStorage(nextProducts, invoices, movements);
  };

  // Reprovide supplier replenishment (+ Stok)
  const handleRestock = (productId: string, qtyAdded: number, reference: string) => {
    const nextProducts = products.map(p => {
      if (p.id === productId) {
        const oldStock = p.stock;
        const newStock = oldStock + qtyAdded;

        // Create log entry inside this handler block
        const newMovement: StockMovement = {
          id: `move-${Date.now()}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          type: 'IN',
          qty: qtyAdded,
          prevStock: oldStock,
          currStock: newStock,
          date: new Date().toISOString(),
          reference
        };

        // Add to logs directly
        setMovements(prev => [newMovement, ...prev]);
        setTimeout(() => {
          syncToLocalStorage(
            products.map(p2 => p2.id === productId ? { ...p2, stock: newStock } : p2),
            invoices,
            [newMovement, ...movements]
          );
        }, 10);

        return {
          ...p,
          stock: newStock
        };
      }
      return p;
    });
  };

  // Hard Reset to presets
  const handleResetToPresets = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang seluruh data? Tindakan ini akan mengembalikan data ke contoh default Garuda FC.')) {
      setProducts(INITIAL_PRODUCTS);
      setInvoices(INITIAL_INVOICES);
      setMovements(INITIAL_MOVEMENTS);
      
      localStorage.setItem('nota_stok_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('nota_stok_invoices', JSON.stringify(INITIAL_INVOICES));
      localStorage.setItem('nota_stok_movements', JSON.stringify(INITIAL_MOVEMENTS));
      
      setActiveTab('dashboard');
      setSelectedInvoice(null);
    }
  };

  // Invoice Number generator based on list size (e.g. #003)
  const computeNextInvoiceNum = () => {
    // Collect count from list, pad appropriately
    const count = invoices.length + 1;
    return `#${String(count).padStart(3, '0')}`;
  };

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-indigo-50/70 font-sans text-slate-700 flex flex-col justify-between" id="app-root-wrapper">
      
      {/* Container Layout with clean Navigation columns */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Navigation Sidebar App Branding (Hides during printing) */}
        <aside className="w-full lg:w-64 bg-white border-b lg:border-r border-indigo-100 shrink-0 select-none flex flex-col justify-between print:hidden shadow-sm" id="app-navigation-sidebar">
          <div>
            {/* Header Identity banner */}
            <div className="p-6 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-200">
                  A3
                </div>
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-slate-800 tracking-tight">
                    Athree Studio
                  </h1>
                  <span className="text-[10px] text-indigo-500 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                    Sistem Kasir v2.0
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive User Switcher Card */}
            <div className="px-4 py-3.5 mx-4 my-3 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl" id="role-selector-widget">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Sesi Aktif
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  userRole === 'OWNER' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {userRole}
                </span>
              </div>
              
              <div className="mt-3 flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-50 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  userRole === 'OWNER' ? 'bg-indigo-650 text-white' : 'bg-amber-400 text-slate-900'
                }`}>
                  {userRole === 'OWNER' ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 uppercase truncate">
                    {userRole === 'OWNER' ? 'Owner Utama' : 'Admin Kasir'}
                  </p>
                  <p className="text-[9px] text-slate-450 tracking-tight leading-none uppercase font-black mt-0.5">
                    ID: {userRole === 'OWNER' ? 'Owner' : 'admin'}
                  </p>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 mt-2 text-center font-medium leading-normal">
                {userRole === 'KASIR' 
                  ? '🔒 Kasir: Buat & revisi nota, update produksi.' 
                  : '👑 Owner: Hak akses penuh, semua item bisa direvisi.'}
              </p>

              <button
                type="button"
                id="btn-logout-sidebar"
                onClick={handleLogout}
                className="w-full mt-3 py-1.5 px-3 bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 rounded-xl text-[11px] font-black text-rose-605 transition duration-155 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <Lock className="w-3 h-3" />
                Keluar (Logout)
              </button>
            </div>

            {/* Sidebar Active Navigation tabs */}
            <nav className="p-4 space-y-1.5">
              
              {/* Dashboard */}
              <button
                id="tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Peninjauan Dashboard
              </button>

              {/* Tulis Nota Baru */}
              <button
                id="tab-new-invoice"
                onClick={() => {
                  setInvoiceToEdit(null);
                  setActiveTab('nota-baru');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeTab === 'nota-baru'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Tulis Nota Baru
              </button>

              {/* Daftar Invoices / Laporan Piutang */}
              <button
                id="tab-invoice-list"
                onClick={() => setActiveTab('daftar-nota')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeTab === 'daftar-nota'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Daftar Nota Pembayaran
              </button>

              {/* Master Persediaan Stok */}
              <button
                id="tab-stock-catalog"
                onClick={() => setActiveTab('stok-barang')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeTab === 'stok-barang'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                }`}
              >
                <Boxes className="w-4 h-4" />
                Urus Stok Barang
              </button>

              {/* Laporan Mutasi Stok Otomatis */}
              <button
                id="tab-ledger-logs"
                onClick={() => setActiveTab('laporan-stok')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeTab === 'laporan-stok'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Log Mutasi Stok
              </button>

            </nav>
          </div>

          {/* Quick Settings Action: Reset database & Playground controls */}
          <div className="p-4 border-t border-indigo-100 space-y-2 bg-indigo-50/10">
            <button
              id="sidebar-btn-seed-simulation"
              onClick={userRole === 'OWNER' ? handleResetToPresets : undefined}
              disabled={userRole !== 'OWNER'}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition duration-155 ${
                userRole === 'OWNER'
                  ? 'bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border-slate-200 hover:border-rose-100 text-slate-600 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Data Simulasi {userRole !== 'OWNER' && '🔒'}
            </button>
            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              Data tersimpan otomatis di browser
            </div>
          </div>
        </aside>

        {/* Outer Workspace Shell Panel */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0" id="app-workspace-main">
          
          {/* Dynamic tabs render switch routing */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              products={products}
              invoices={invoices}
              setActiveTab={setActiveTab}
              userRole={userRole}
            />
          )}

          {activeTab === 'nota-baru' && (
            <NotaForm 
              products={products}
              nextInvoiceNum={invoiceToEdit ? invoiceToEdit.invoiceNum : computeNextInvoiceNum()}
              onSave={handleSaveInvoice}
              invoiceToEdit={invoiceToEdit}
              onCancelEdit={() => {
                setInvoiceToEdit(null);
                setActiveTab('daftar-nota');
              }}
            />
          )}

          {activeTab === 'daftar-nota' && (
            <NotaList 
              invoices={invoices}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onPaySettlement={handlePaySettlement}
              onUpdateProductionStatus={handleUpdateProductionStatus}
              onEditInvoice={(inv) => {
                setInvoiceToEdit(inv);
                setActiveTab('nota-baru');
              }}
              userRole={userRole}
            />
          )}

          {activeTab === 'stok-barang' && (
            <StokPanel 
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onRestock={handleRestock}
              userRole={userRole}
            />
          )}

          {activeTab === 'laporan-stok' && (
            <LaporanStok 
              movements={movements}
            />
          )}

        </main>

      </div>

      {/* Persistent global overlay sheet for Receipt detail visualization */}
      {selectedInvoice && (
        <NotaDetailModal 
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPaySettlement={handlePaySettlement}
          onUpdateProductionStatus={handleUpdateProductionStatus}
        />
      )}

      {/* Subtle bottom human branding margin (Hides during printing) */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-indigo-100 bg-white print:hidden" id="app-footer-bar">
        <span>© 2026 Athree Studio Workshop App. Dibuat dengan presisi tinggi dan pencatatan kas berlapis.</span>
      </footer>

    </div>
  );
}
