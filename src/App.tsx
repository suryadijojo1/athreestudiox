/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Invoice, StockMovement, AuditLog, PaymentTransaction, CashierSession, ShopSettings } from './types';
import { motion } from 'motion/react';
import { INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_MOVEMENTS, INITIAL_AUDIT_LOGS } from './initialData';
import { doc, getDocFromServer } from 'firebase/firestore';
import { 
  loadCollectionFromFirestore, 
  saveDocumentToFirestore, 
  deleteDocumentFromFirestore, 
  saveCollectionInBatches, 
  saveActiveSessionToFirestore, 
  loadActiveSessionFromFirestore,
  loadCredentialsFromFirestore,
  saveCredentialsToFirestore,
  loadSalesAgentsFromFirestore,
  saveSalesAgentsToFirestore,
  saveShopSettingsToFirestore,
  loadShopSettingsFromFirestore,
  SystemCredentials,
  db
} from './lib/firebase';

// Component imports
import Dashboard from './components/Dashboard';
import NotaForm from './components/NotaForm';
import NotaList from './components/NotaList';
import NotaDetailModal from './components/NotaDetailModal';
import StokPanel from './components/StokPanel';
import LaporanStok from './components/LaporanStok';
import LoginForm from './components/LoginForm';
import HistoriAktivitas from './components/HistoriAktivitas';
import PengaturanToko from './components/PengaturanToko';
import KasirSesiPanel from './components/KasirSesiPanel';
import BukuMutasi from './components/BukuMutasi';

// Icon imports
import { 
  BarChart3, 
  Receipt, 
  ShoppingCart, 
  Boxes, 
  LayoutDashboard, 
  BookOpen, 
  Info,
  RotateCcw,
  Sparkles,
  Github,
  Users,
  Crown,
  Edit,
  Lock,
  History,
  ShieldCheck,
  CheckCircle,
  Database,
  Settings,
  Sun,
  Moon,
  CreditCard,
  Wrench,
  Mail,
  Key,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // --- CORE STATE MANAGERS ---
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Firebase Status Tracking
  const [firebaseStatus, setFirebaseStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ERROR' | 'OFFLINE'>('CONNECTING');
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [isDatabaseLoaded, setIsDatabaseLoaded] = useState<boolean>(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('athree_logged_in') === 'true';
  });

  // User Role State: KASIR, OWNER, or PRODUKSI (Defaults to KASIR)
  const [userRole, setUserRole] = useState<'KASIR' | 'OWNER' | 'PRODUKSI'>(() => {
    const saved = localStorage.getItem('athree_user_role');
    return (saved as any) || 'KASIR';
  });

  // Invoice currently being revised / edited
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const saveAllDataToCloud = async (
    currentProds = products,
    currentInvs = invoices,
    currentMoves = movements,
    currentLogs = auditLogs,
    currentPayments = paymentTransactions,
    currentHistory = sessionsHistory,
    currentSession = activeSession
  ): Promise<boolean> => {
    setIsFirebaseSyncing(true);
    try {
      await Promise.all([
        saveCollectionInBatches('products', currentProds),
        saveCollectionInBatches('invoices', currentInvs),
        saveCollectionInBatches('movements', currentMoves),
        saveCollectionInBatches('audit_logs', currentLogs),
        saveCollectionInBatches('payment_transactions', currentPayments),
        saveCollectionInBatches('sessions_history', currentHistory),
        saveActiveSessionToFirestore(currentSession)
      ]);
      setFirebaseStatus('CONNECTED');
      return true;
    } catch (e) {
      console.error("Gagal melakukan backup instan ke Firestore:", e);
      return false;
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleLoginSuccess = (role: 'KASIR' | 'OWNER' | 'PRODUKSI') => {
    setUserRole(role);
    setIsLoggedIn(true);
    localStorage.setItem('athree_user_role', role);
    localStorage.setItem('athree_logged_in', 'true');
    if (role === 'PRODUKSI') {
      setActiveTab('daftar-nota');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Explicitly guarantee all in-memory transaction states are written to cloud
    await saveAllDataToCloud(
      products,
      invoices,
      movements,
      auditLogs,
      paymentTransactions,
      sessionsHistory,
      activeSession
    );
    setIsLoggedIn(false);
    localStorage.removeItem('athree_logged_in');
    setIsLoggingOut(false);
  };

  // Navigation tab route state
  const [activeTab, setActiveTab ] = useState<string>('dashboard');

  // Dynamic role passwords (Owner can update these, persisted in Firestore/localStorage)
  const [kasirPassword, setKasirPassword] = useState<string>(() => {
    return localStorage.getItem('nota_stok_kasir_password') || 'admin';
  });
  const [ownerPassword, setOwnerPassword] = useState<string>(() => {
    return localStorage.getItem('nota_stok_owner_password') || 'Owner';
  });
  const [produksiPassword, setProduksiPassword] = useState<string>(() => {
    return localStorage.getItem('nota_stok_produksi_password') || 'admin';
  });

  // Cash accounting states (daily cash desk sessions)
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<CashierSession[]>([]);

  // Theme State Selection: 'light' or 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('athree_theme') as 'light' | 'dark') || 'light';
  });

  // Dynamically apply/remove dark class from HTML document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('athree_theme', theme);
  }, [theme]);

  // Last sync time with localStorage
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('nota_stok_last_sync_time') || new Date().toISOString();
  });
  
  // Selected Invoice reference for full carbon-sheet modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [quickPrintInvoice, setQuickPrintInvoice] = useState<Invoice | null>(null);

  // Backup Toast State
  const [backupToast, setBackupToast] = useState<{
    show: boolean;
    type: 'STARTUP' | 'DAILY' | 'MANUAL';
    message: string;
    subMessage: string;
    timestamp: string;
    productsCount: number;
    invoicesCount: number;
    movementsCount: number;
  } | null>(null);

  // --- OTP STATE MANAGERS & BACKEND HANDLERS ---
  const [isResetOtpModalOpen, setIsResetOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSendingStatus, setOtpSendingStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [otpVerificationStatus, setOtpVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [testEtherealUrl, setTestEtherealUrl] = useState<string | null>(null);

  const sendOtpEmail = async () => {
    setOtpSendingStatus('sending');
    setOtpErrorMessage('');
    setOtpVerificationStatus('idle');
    setOtpCode('');
    setTestEtherealUrl(null);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpSendingStatus('sent');
        if (data.testPreviewUrl) {
          setTestEtherealUrl(data.testPreviewUrl);
        }
      } else {
        setOtpSendingStatus('error');
        setOtpErrorMessage(data.message || 'Gagal mengirim OTP harian.');
      }
    } catch (error: any) {
      console.error('Fetch OTP request error:', error);
      setOtpSendingStatus('error');
      setOtpErrorMessage('Koneksi ke server API terputus.');
    }
  };

  const verifyOtpCodeAndReset = async (codeStr: string) => {
    setOtpVerificationStatus('verifying');
    setOtpErrorMessage('');
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeStr.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpVerificationStatus('verified');
        
        // Success! Perform actual system reset using syncToLocalStorage to update state and firestore
        const resetLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: userRole,
          actionType: 'RESET_SYSTEM',
          module: 'SISTEM',
          description: 'Melakukan reset total database sistem kembali ke data simulasi default (Garuda FC) setelah sukses verifikasi OTP email athreestudiojayapura@gmail.com.',
          referenceNum: 'Reset Sistem'
        };
        const nextLogs = [resetLog, ...INITIAL_AUDIT_LOGS];
        
        syncToLocalStorage(INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_MOVEMENTS, nextLogs);
        
        setActiveTab('dashboard');
        setSelectedInvoice(null);
        
        // Close modal after successful notification
        setTimeout(() => {
          setIsResetOtpModalOpen(false);
          setOtpVerificationStatus('idle');
        }, 1200);
      } else {
        setOtpVerificationStatus('error');
        setOtpErrorMessage(data.message || 'Kode OTP salah.');
      }
    } catch (error: any) {
      console.error('Fetch Verification error:', error);
      setOtpVerificationStatus('error');
      setOtpErrorMessage('Koneksi terputus saat verifikasi.');
    }
  };

  // Trigger Local Storage Backup and Notification
  const triggerAutoBackup = (
    currentProds: Product[],
    currentInvs: Invoice[],
    currentMoves: StockMovement[],
    currentLogs: AuditLog[],
    backupType: 'STARTUP' | 'DAILY' | 'MANUAL' = 'STARTUP'
  ) => {
    try {
      const backupData = {
        backupVersion: "1.0-auto",
        backedUpAt: new Date().toISOString(),
        type: backupType,
        data: {
          products: currentProds,
          invoices: currentInvs,
          movements: currentMoves,
          auditLogs: currentLogs
        }
      };

      // Save full latest backup payload
      localStorage.setItem('nota_stok_last_backup_data', JSON.stringify(backupData));
      
      // Load and update backup log
      const storedLog = localStorage.getItem('nota_stok_auto_backups_log');
      let backupLog = storedLog ? JSON.parse(storedLog) : [];
      
      const newLogEntry = {
        id: `backup-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: backupType,
        productsCount: currentProds.length,
        invoicesCount: currentInvs.length,
        movementsCount: currentMoves.length,
        auditLogsCount: currentLogs.length,
        status: 'SUCCESS'
      };

      backupLog = [newLogEntry, ...backupLog].slice(0, 10); // Keep last 10 backups metadata
      localStorage.setItem('nota_stok_auto_backups_log', JSON.stringify(backupLog));
      localStorage.setItem('nota_stok_last_backup_time', new Date().toISOString());

      // Show toast notification
      setBackupToast({
        show: true,
        type: backupType,
        message: 'Data Tersinkronisasi',
        subMessage: `Sistem berhasil mencadangkan ${currentProds.length} produk, ${currentInvs.length} nota, dan ${currentLogs.length} audit log ke LocalStorage sebagai cadangan aman.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        productsCount: currentProds.length,
        invoicesCount: currentInvs.length,
        movementsCount: currentMoves.length
      });

      // Automatically clear toast after 5 seconds
      setTimeout(() => {
        setBackupToast(prev => prev ? { ...prev, show: false } : null);
      }, 5000);

    } catch (error) {
      console.error("Gagal menjalankan pencadangan otomatis:", error);
    }
  };

  const handleManualBackup = () => {
    triggerAutoBackup(products, invoices, movements, auditLogs, 'MANUAL');
  };

  // --- INITIALIZATION (Firebase Load / Local Storage Fallback) ---
  useEffect(() => {
    const loadDatabase = async () => {
      setFirebaseStatus('CONNECTING');
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setFirebaseStatus('CONNECTED');
      } catch (e: any) {
        console.warn("Firebase offline or error validating connection:", e);
        if (e?.message?.includes('client is offline')) {
          setFirebaseStatus('OFFLINE');
        } else {
          setFirebaseStatus('ERROR');
        }
      }

      try {
        const dbProducts = await loadCollectionFromFirestore<Product>('products');
        const dbInvoices = await loadCollectionFromFirestore<Invoice>('invoices');
        const dbMovements = await loadCollectionFromFirestore<StockMovement>('movements');
        const dbAuditLogs = await loadCollectionFromFirestore<AuditLog>('audit_logs');
        const dbPayments = await loadCollectionFromFirestore<PaymentTransaction>('payment_transactions');
        const dbHistory = await loadCollectionFromFirestore<CashierSession>('sessions_history');
        const dbActiveSession = await loadActiveSessionFromFirestore();
        const dbCredentials = await loadCredentialsFromFirestore();
        const dbSalesAgents = await loadSalesAgentsFromFirestore();
        const dbShopSettings = await loadShopSettingsFromFirestore();

        if (dbCredentials) {
          if (dbCredentials.kasirPassword) {
            setKasirPassword(dbCredentials.kasirPassword);
            localStorage.setItem('nota_stok_kasir_password', dbCredentials.kasirPassword);
          }
          if (dbCredentials.ownerPassword) {
            setOwnerPassword(dbCredentials.ownerPassword);
            localStorage.setItem('nota_stok_owner_password', dbCredentials.ownerPassword);
          }
          if (dbCredentials.produksiPassword) {
            setProduksiPassword(dbCredentials.produksiPassword);
            localStorage.setItem('nota_stok_produksi_password', dbCredentials.produksiPassword);
          }
        }

        if (dbProducts.length > 0 || dbInvoices.length > 0) {
          console.log("Memuat data dari Cloud Firebase...");
          setProducts(dbProducts);
          setInvoices(dbInvoices);
          setMovements(dbMovements);
          setAuditLogs(dbAuditLogs);
          setPaymentTransactions(dbPayments);
          setSessionsHistory(dbHistory);
          setActiveSession(dbActiveSession);

          localStorage.setItem('nota_stok_products', JSON.stringify(dbProducts));
          localStorage.setItem('nota_stok_invoices', JSON.stringify(dbInvoices));
          localStorage.setItem('nota_stok_movements', JSON.stringify(dbMovements));
          localStorage.setItem('nota_stok_audit_logs', JSON.stringify(dbAuditLogs));
          localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(dbPayments));
          localStorage.setItem('nota_stok_sessions_history', JSON.stringify(dbHistory));
          if (dbActiveSession) {
            localStorage.setItem('nota_stok_active_session', JSON.stringify(dbActiveSession));
          } else {
            localStorage.removeItem('nota_stok_active_session');
          }

          if (dbSalesAgents) {
            localStorage.setItem('athree_sales_agents', JSON.stringify(dbSalesAgents));
            window.dispatchEvent(new Event('athree-sales-agents-changed'));
          }

          if (dbShopSettings) {
            localStorage.setItem('athree-shop-logo-type', dbShopSettings.logoType);
            localStorage.setItem('athree-shop-logo-preset', dbShopSettings.presetKey);
            if (dbShopSettings.customUrl) {
              localStorage.setItem('athree_custom_logo_data', dbShopSettings.customUrl);
            } else {
              localStorage.removeItem('athree_custom_logo_data');
            }
            localStorage.setItem('athree-shop-name', dbShopSettings.shopName);
            localStorage.setItem('athree-shop-slogan', dbShopSettings.shopSlogan);
            window.dispatchEvent(new Event('athree-logo-changed'));
          }

          setFirebaseStatus('CONNECTED');
        } else {
          console.log("Cloud Firebase kosong. Melakukan inisialisasi awal ke cloud...");
          setIsFirebaseSyncing(true);

          const storedProducts = localStorage.getItem('nota_stok_products');
          const storedInvoices = localStorage.getItem('nota_stok_invoices');
          const storedMovements = localStorage.getItem('nota_stok_movements');
          const storedAuditLogs = localStorage.getItem('nota_stok_audit_logs');

          let seedProds = storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS;
          let seedInvs = storedInvoices ? JSON.parse(storedInvoices) : INITIAL_INVOICES;
          let seedMoves = storedMovements ? JSON.parse(storedMovements) : INITIAL_MOVEMENTS;
          let seedLogs = storedAuditLogs ? JSON.parse(storedAuditLogs) : INITIAL_AUDIT_LOGS;

          setProducts(seedProds);
          setInvoices(seedInvs);
          setMovements(seedMoves);
          setAuditLogs(seedLogs);

          localStorage.setItem('nota_stok_products', JSON.stringify(seedProds));
          localStorage.setItem('nota_stok_invoices', JSON.stringify(seedInvs));
          localStorage.setItem('nota_stok_movements', JSON.stringify(seedMoves));
          localStorage.setItem('nota_stok_audit_logs', JSON.stringify(seedLogs));

          await saveCollectionInBatches('products', seedProds);
          await saveCollectionInBatches('invoices', seedInvs);
          await saveCollectionInBatches('movements', seedMoves);
          await saveCollectionInBatches('audit_logs', seedLogs);

          // Seed sales agents
          const storedSalesAgents = localStorage.getItem('athree_sales_agents');
          let seedSalesAgents = storedSalesAgents ? JSON.parse(storedSalesAgents) : [
            { code: 'SL-01', name: 'Dewi Lestari' },
            { code: 'SL-02', name: 'Budi Hermawan' },
            { code: 'SL-03', name: 'Stephanus' },
            { code: 'SL-04', name: 'Martha Papua' }
          ];
          localStorage.setItem('athree_sales_agents', JSON.stringify(seedSalesAgents));
          await saveSalesAgentsToFirestore(seedSalesAgents);
          window.dispatchEvent(new Event('athree-sales-agents-changed'));

          // Seed shop settings
          const storedLogoType = localStorage.getItem('athree-shop-logo-type') || 'preset';
          const storedPresetKey = localStorage.getItem('athree-shop-logo-preset') || 'shield';
          const storedCustomUrl = localStorage.getItem('athree_custom_logo_data') || null;
          const storedShopName = localStorage.getItem('athree-shop-name') || 'ATHREE STUDIO JAYAPURA';
          const storedShopSlogan = localStorage.getItem('athree-shop-slogan') || 'Studio Printing, Custom Apparel, Sablon Jersey Premium & Digital Printing Terpercaya.';

          const seedShopSettings: ShopSettings = {
            logoType: storedLogoType as any,
            presetKey: storedPresetKey,
            customUrl: storedCustomUrl,
            shopName: storedShopName,
            shopSlogan: storedShopSlogan
          };
          
          localStorage.setItem('athree-shop-logo-type', storedLogoType);
          localStorage.setItem('athree-shop-logo-preset', storedPresetKey);
          if (storedCustomUrl) {
            localStorage.setItem('athree_custom_logo_data', storedCustomUrl);
          } else {
            localStorage.removeItem('athree_custom_logo_data');
          }
          localStorage.setItem('athree-shop-name', storedShopName);
          localStorage.setItem('athree-shop-slogan', storedShopSlogan);

          await saveShopSettingsToFirestore(seedShopSettings);
          window.dispatchEvent(new Event('athree-logo-changed'));

          const storedPayments = localStorage.getItem('nota_stok_payment_transactions');
          let seedPayments: PaymentTransaction[] = [];
          if (storedPayments) {
            seedPayments = JSON.parse(storedPayments);
          } else {
            seedInvs.forEach((inv, index) => {
              if (inv.downPayment > 0) {
                seedPayments.push({
                  id: `pay-${inv.id}-dp`,
                  invoiceId: inv.id,
                  invoiceNum: inv.invoiceNum,
                  customerName: inv.customerName,
                  amount: inv.downPayment,
                  method: index % 2 === 0 ? 'CASH' : 'TRANSFER',
                  type: 'DP',
                  timestamp: `${inv.date}T09:15:00.000Z`,
                  cashier: 'OWNER'
                });
              }
              if (inv.settlement > 0) {
                seedPayments.push({
                  id: `pay-${inv.id}-set`,
                  invoiceId: inv.id,
                  invoiceNum: inv.invoiceNum,
                  customerName: inv.customerName,
                  amount: inv.settlement,
                  method: index % 2 !== 0 ? 'CASH' : 'TRANSFER',
                  type: 'PELUNASAN',
                  timestamp: `${inv.date}T15:30:00.000Z`,
                  cashier: 'OWNER'
                });
              }
            });
          }
          setPaymentTransactions(seedPayments);
          localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(seedPayments));
          await saveCollectionInBatches('payment_transactions', seedPayments);

          const storedHistory = localStorage.getItem('nota_stok_sessions_history');
          let seedHistory: CashierSession[] = [];
          if (storedHistory) {
            seedHistory = JSON.parse(storedHistory);
          } else {
            seedHistory = [
              {
                id: 'sess-1',
                openedAt: '2026-06-15T08:00:00.000Z',
                openedBy: 'OWNER',
                openingBalance: 500000,
                closedAt: '2026-06-15T18:00:00.000Z',
                closedBy: 'OWNER',
                expectedCash: 500005,
                actualCash: 500005,
                notes: 'Sesi hari pertama ditutup aman tanpa selisih.',
                status: 'CLOSED'
              }
            ];
          }
          setSessionsHistory(seedHistory);
          localStorage.setItem('nota_stok_sessions_history', JSON.stringify(seedHistory));
          await saveCollectionInBatches('sessions_history', seedHistory);

          const storedActiveSession = localStorage.getItem('nota_stok_active_session');
          let seedActiveSession: CashierSession | null = null;
          if (storedActiveSession) {
            seedActiveSession = JSON.parse(storedActiveSession);
          }
          setActiveSession(seedActiveSession);
          await saveActiveSessionToFirestore(seedActiveSession);

          setIsFirebaseSyncing(false);
          setFirebaseStatus('CONNECTED');
        }
        setIsDatabaseLoaded(true);
      } catch (err) {
        console.error("Gagal sinkronisasi data awal dengan Firebase Firestore:", err);
        const storedProducts = localStorage.getItem('nota_stok_products');
        const storedInvoices = localStorage.getItem('nota_stok_invoices');
        const storedMovements = localStorage.getItem('nota_stok_movements');
        const storedAuditLogs = localStorage.getItem('nota_stok_audit_logs');

        setProducts(storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS);
        setInvoices(storedInvoices ? JSON.parse(storedInvoices) : INITIAL_INVOICES);
        setMovements(storedMovements ? JSON.parse(storedMovements) : INITIAL_MOVEMENTS);
        setAuditLogs(storedAuditLogs ? JSON.parse(storedAuditLogs) : INITIAL_AUDIT_LOGS);

        const storedPayments = localStorage.getItem('nota_stok_payment_transactions');
        if (storedPayments) setPaymentTransactions(JSON.parse(storedPayments));

        const storedHistory = localStorage.getItem('nota_stok_sessions_history');
        if (storedHistory) setSessionsHistory(JSON.parse(storedHistory));

        const storedActiveSession = localStorage.getItem('nota_stok_active_session');
        if (storedActiveSession) setActiveSession(JSON.parse(storedActiveSession));

        setIsFirebaseSyncing(false);
        setIsDatabaseLoaded(true);
      }
    };

    loadDatabase();
  }, []);

  useEffect(() => {
    const handleInvoicesSync = () => {
      try {
        const storedInvoices = localStorage.getItem('nota_stok_invoices');
        if (storedInvoices) {
          const loadedInvoices = JSON.parse(storedInvoices);
          setInvoices(loadedInvoices);
          if (firebaseStatus === 'CONNECTED') {
            saveCollectionInBatches('invoices', loadedInvoices).catch((e) => {
              console.error("Gagal sinkronisasi invoices ke firestore:", e);
            });
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi invoices dari event:", err);
      }
    };
    window.addEventListener('athree-invoices-changed', handleInvoicesSync);
    return () => {
      window.removeEventListener('athree-invoices-changed', handleInvoicesSync);
    };
  }, [firebaseStatus]);

  useEffect(() => {
    const handleSyncSalesToCloud = async () => {
      try {
        const storedSalesStr = localStorage.getItem('athree_sales_agents');
        if (storedSalesStr && firebaseStatus === 'CONNECTED') {
          const agents = JSON.parse(storedSalesStr);
          await saveSalesAgentsToFirestore(agents);
        }
      } catch (e) {
        console.error("Gagal sinkronisasi sales agents ke firestore:", e);
      }
    };
    window.addEventListener('athree-sales-agents-changed', handleSyncSalesToCloud);
    return () => {
      window.removeEventListener('athree-sales-agents-changed', handleSyncSalesToCloud);
    };
  }, [firebaseStatus]);

  useEffect(() => {
    const handleSyncLogoToCloud = async () => {
      try {
        if (firebaseStatus === 'CONNECTED') {
          const type = (localStorage.getItem('athree-shop-logo-type') as 'none' | 'preset' | 'custom') || 'preset';
          const pKey = localStorage.getItem('athree-shop-logo-preset') || 'shield';
          const cUrl = localStorage.getItem('athree_custom_logo_data');
          const sName = localStorage.getItem('athree-shop-name') || 'ATHREE STUDIO JAYAPURA';
          const sSlogan = localStorage.getItem('athree-shop-slogan') || 'Studio Printing, Custom Apparel, Sablon Jersey Premium & Digital Printing Terpercaya.';

          const settings: ShopSettings = {
            logoType: type,
            presetKey: pKey,
            customUrl: cUrl,
            shopName: sName,
            shopSlogan: sSlogan
          };
          await saveShopSettingsToFirestore(settings);
          console.log("Sinkronisasi logo dan id toko ke cloud sukses!");
        }
      } catch (e) {
        console.error("Gagal sinkronisasi shop logo settings ke firestore:", e);
      }
    };
    window.addEventListener('athree-logo-changed', handleSyncLogoToCloud);
    return () => {
      window.removeEventListener('athree-logo-changed', handleSyncLogoToCloud);
    };
  }, [firebaseStatus]);

  // Sync state changes with physical browser storage on mutation + CLOUD FIRESTORE SYNC
  const syncToLocalStorage = (
    newProds: Product[], 
    newInvs: Invoice[], 
    newMoves: StockMovement[],
    newLogs?: AuditLog[]
  ) => {
    setProducts(newProds);
    setInvoices(newInvs);
    setMovements(newMoves);
    if (newLogs) {
      setAuditLogs(newLogs);
      localStorage.setItem('nota_stok_audit_logs', JSON.stringify(newLogs));
    }

    localStorage.setItem('nota_stok_products', JSON.stringify(newProds));
    localStorage.setItem('nota_stok_invoices', JSON.stringify(newInvs));
    localStorage.setItem('nota_stok_movements', JSON.stringify(newMoves));

    const nowStr = new Date().toISOString();
    setLastSyncTime(nowStr);
    localStorage.setItem('nota_stok_last_sync_time', nowStr);

    if (selectedInvoice) {
      const refreshed = newInvs.find(inv => inv.id === selectedInvoice.id);
      if (refreshed) setSelectedInvoice(refreshed);
    }

    // Trigger Cloud Firestore Sync in background
    setIsFirebaseSyncing(true);
    const syncPromises = [
      saveCollectionInBatches('products', newProds),
      saveCollectionInBatches('invoices', newInvs),
      saveCollectionInBatches('movements', newMoves)
    ];
    if (newLogs) {
      syncPromises.push(saveCollectionInBatches('audit_logs', newLogs));
    }
    
    Promise.all(syncPromises)
      .then(() => {
        setFirebaseStatus('CONNECTED');
      })
      .catch((err) => {
        console.error("Gagal melakukan background sync ke Firestore:", err);
      })
      .finally(() => {
        setIsFirebaseSyncing(false);
      });
  };

  // --- REAL-TIME FIRESTORE SYNCHRONIZATION FOR AUXILIARY STATE ---
  useEffect(() => {
    if (!isDatabaseLoaded || firebaseStatus === 'CONNECTING') return;

    const syncAuxiliaryData = async () => {
      setIsFirebaseSyncing(true);
      try {
        await saveCollectionInBatches('payment_transactions', paymentTransactions);
        await saveCollectionInBatches('sessions_history', sessionsHistory);
        await saveActiveSessionToFirestore(activeSession);
        setFirebaseStatus('CONNECTED');
      } catch (e) {
        console.error("Gagal sinkronisasi data sekunder ke Firestore:", e);
      } finally {
        setIsFirebaseSyncing(false);
      }
    };

    const timer = setTimeout(() => {
      syncAuxiliaryData();
    }, 1000); // 1s debounce to avoid excessive writes during rapid successive changes

    return () => clearTimeout(timer);
  }, [paymentTransactions, sessionsHistory, activeSession, firebaseStatus, isDatabaseLoaded]);

  // --- HANDLERS / WORKFLOWS ---

  // Add new receipt + automatically deduct products out of inventory
  const handleSaveInvoice = (newInvoice: Invoice, invoiceMovements: StockMovement[]) => {
    let nextInvoices = [...invoices];
    let nextMovements = [...movements];
    let nextProducts = [...products];
    let nextLogs = [...auditLogs];

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

      // Add audit log
      const logMsg = `Merevisi rincian Nota ${invoiceToEdit.invoiceNum} untuk pelanggan ${newInvoice.customerName} (Total Tagihan: Rp ${newInvoice.totalAmount.toLocaleString('id-ID')}).`;
      const revisionLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: userRole,
        actionType: 'UPDATE_INVOICE',
        module: 'NOTA',
        description: logMsg,
        referenceNum: invoiceToEdit.invoiceNum
      };
      nextLogs = [revisionLog, ...nextLogs];

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

      // Add audit log
      const logMsg = `Membuat Nota Baru ${savedInvoice.invoiceNum} untuk pelanggan ${savedInvoice.customerName} senilai Rp ${savedInvoice.totalAmount.toLocaleString('id-ID')} (status ${savedInvoice.status}).`;
      const creationLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: userRole,
        actionType: 'CREATE_INVOICE',
        module: 'NOTA',
        description: logMsg,
        referenceNum: savedInvoice.invoiceNum
      };
      nextLogs = [creationLog, ...nextLogs];

      // Add payment transaction record on DP if any
      if (savedInvoice.downPayment > 0) {
        const newTx: PaymentTransaction = {
          id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          invoiceId: savedInvoice.id,
          invoiceNum: savedInvoice.invoiceNum,
          customerName: savedInvoice.customerName,
          amount: savedInvoice.downPayment,
          method: savedInvoice.paymentMethodDP || 'CASH',
          type: 'DP',
          timestamp: new Date().toISOString(),
          cashier: userRole
        };
        const updatedTxs = [newTx, ...paymentTransactions];
        setPaymentTransactions(updatedTxs);
        localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(updatedTxs));
      }
    }

    syncToLocalStorage(nextProducts, nextInvoices, nextMovements, nextLogs);
    setActiveTab('daftar-nota'); // Redirect seamlessly to invoice report
  };

  // Record intermediate Down Payments / Partial settlement payments
  const handlePaySettlement = (invoiceId: string, amountPaid: number, paymentMethod: 'CASH' | 'TRANSFER' = 'CASH') => {
    let invoiceNum = '';
    let customerName = '';
    const nextInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        invoiceNum = inv.invoiceNum;
        customerName = inv.customerName;
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
          customStatusLabel: nextLabel,
          paymentMethodSettlement: paymentMethod
        };
      }
      return inv;
    });

    // Create payment transactions record
    const newTx: PaymentTransaction = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceId,
      invoiceNum,
      customerName,
      amount: amountPaid,
      method: paymentMethod,
      type: 'PELUNASAN',
      timestamp: new Date().toISOString(),
      cashier: userRole
    };
    const updatedTxs = [newTx, ...paymentTransactions];
    setPaymentTransactions(updatedTxs);
    localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(updatedTxs));

    // Add audit log
    const logMsg = `Menerima cicilan/pelunasan sebesar Rp ${amountPaid.toLocaleString('id-ID')} (${paymentMethod}) untuk Nota ${invoiceNum} (${customerName}).`;
    const settlementLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'PAYMENT_SETTLEMENT',
      module: 'NOTA',
      description: logMsg,
      referenceNum: invoiceNum
    };
    const nextLogs = [settlementLog, ...auditLogs];

    syncToLocalStorage(products, nextInvoices, movements, nextLogs);
  };

  // Update production status of an invoice
  const handleUpdateProductionStatus = (invoiceId: string, status: 'ANTREAN' | 'DESAIN' | 'PROSES' | 'SELESAI' | 'SIAP_DIAMBIL') => {
    let invoiceNum = '';
    const nextInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        invoiceNum = inv.invoiceNum;
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

    // Add audit log
    const logMsg = `Mengubah status produksi Nota ${invoiceNum} menjadi [${status}].`;
    const statusLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'UPDATE_INVOICE',
      module: 'NOTA',
      description: logMsg,
      referenceNum: invoiceNum
    };
    const nextLogs = [statusLog, ...auditLogs];

    syncToLocalStorage(products, nextInvoices, movements, nextLogs);
  };

  const handleOpenSession = async (openingBalance: number, cashier: 'OWNER' | 'KASIR') => {
    const newSession: CashierSession = {
      id: `sess-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: cashier,
      openingBalance: openingBalance,
      expectedCash: openingBalance,
      status: 'OPEN'
    };
    setActiveSession(newSession);
    localStorage.setItem('nota_stok_active_session', JSON.stringify(newSession));

    // Audit Log for opening kasir
    const openLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: cashier,
      actionType: 'RESET_SYSTEM',
      module: 'SISTEM',
      description: `Membuka sesi laci kasir baru dengan modal awal Rp ${openingBalance.toLocaleString('id-ID')}.`,
      referenceNum: 'SESSION'
    };
    const nextLogs = [openLog, ...auditLogs];
    setAuditLogs(nextLogs);
    localStorage.setItem('nota_stok_audit_logs', JSON.stringify(nextLogs));

    // Instantly save session data to Firestore to prevent loss on fast navigation/refresh
    try {
      setIsFirebaseSyncing(true);
      await Promise.all([
        saveActiveSessionToFirestore(newSession),
        saveCollectionInBatches('audit_logs', nextLogs)
      ]);
      setFirebaseStatus('CONNECTED');
    } catch (e) {
      console.error("Gagal sinkronisasi buka sesi ke Firestore:", e);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleCloseSession = async (actualCash: number, expectedCashValue: number, notes: string) => {
    if (!activeSession) return;
    const closedSession: CashierSession = {
      ...activeSession,
      closedAt: new Date().toISOString(),
      closedBy: userRole,
      expectedCash: expectedCashValue,
      actualCash: actualCash,
      notes: notes,
      status: 'CLOSED'
    };

    const nextHistory = [closedSession, ...sessionsHistory];
    setSessionsHistory(nextHistory);
    localStorage.setItem('nota_stok_sessions_history', JSON.stringify(nextHistory));

    setActiveSession(null);
    localStorage.removeItem('nota_stok_active_session');

    // Audit Log for closing kasir
    const selisih = actualCash - expectedCashValue;
    const selisihStr = selisih === 0 ? 'COCOK' : selisih > 0 ? `LEBIH (Rp ${selisih.toLocaleString('id-ID')})` : `KURANG (Rp ${Math.abs(selisih).toLocaleString('id-ID')})`;
    const closeLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'RESET_SYSTEM',
      module: 'SISTEM',
      description: `Menutup sesi laci kasir harian. Saldo komputer: Rp ${expectedCashValue.toLocaleString('id-ID')}. Saldo fisik: Rp ${actualCash.toLocaleString('id-ID')}. Selisih laci: ${selisihStr}. Catatan: ${notes || '-'}`,
      referenceNum: 'SESSION'
    };
    const nextLogs = [closeLog, ...auditLogs];
    setAuditLogs(nextLogs);
    localStorage.setItem('nota_stok_audit_logs', JSON.stringify(nextLogs));

    // Instantly save entire system closure state to Firestore to survive reload/logout
    try {
      setIsFirebaseSyncing(true);
      await Promise.all([
        saveActiveSessionToFirestore(null),
        saveCollectionInBatches('sessions_history', nextHistory),
        saveCollectionInBatches('audit_logs', nextLogs)
      ]);
      setFirebaseStatus('CONNECTED');
    } catch (e) {
      console.error("Gagal sinkronisasi tutup sesi laci ke Firestore:", e);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleAddPaymentTransaction = async (tx: PaymentTransaction) => {
    const updated = [tx, ...paymentTransactions];
    setPaymentTransactions(updated);
    localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(updated));

    // Audit Log for manual cashier transaction
    const directLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: tx.timestamp,
      user: tx.cashier,
      actionType: tx.type === 'PENGELUARAN' ? 'DELETE_INVOICE' : 'PAYMENT_SETTLEMENT',
      module: 'SISTEM',
      description: `Mencatat transaksi ${tx.type === 'PENGELUARAN' ? 'KAS KELUAR (CASH OUT)' : 'KAS MASUK (CASH IN)'} (${tx.method}) senilai Rp ${tx.amount.toLocaleString('id-ID')}. Catatan/Sumber: ${tx.notes || '-'}`,
      referenceNum: 'SESSION'
    };
    const nextLogs = [directLog, ...auditLogs];
    setAuditLogs(nextLogs);
    localStorage.setItem('nota_stok_audit_logs', JSON.stringify(nextLogs));

    try {
      await saveDocumentToFirestore('payment_transactions', tx);
      await saveDocumentToFirestore('audit_logs', directLog);
    } catch (err) {
      console.error("Gagal sinkronisasi transaksi baru ke Cloud Firestore:", err);
    }
  };

  const handleUpdatePaymentTransaction = async (updatedTx: PaymentTransaction) => {
    const updated = paymentTransactions.map(tx => tx.id === updatedTx.id ? updatedTx : tx);
    setPaymentTransactions(updated);
    localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(updated));

    // Audit Log for modification of cashier transaction
    const editLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'PAYMENT_SETTLEMENT',
      module: 'SISTEM',
      description: `Mengubah transaksi kas harian (ID: ${updatedTx.id}) senilai Rp ${updatedTx.amount.toLocaleString('id-ID')}. Catatan baru: ${updatedTx.notes || '-'}`,
      referenceNum: updatedTx.invoiceNum || 'MUTASI'
    };
    const nextLogs = [editLog, ...auditLogs];
    setAuditLogs(nextLogs);
    localStorage.setItem('nota_stok_audit_logs', JSON.stringify(nextLogs));

    try {
      await saveDocumentToFirestore('payment_transactions', updatedTx);
      await saveDocumentToFirestore('audit_logs', editLog);
    } catch (err) {
      console.error("Gagal sinkronisasi update transaksi ke Cloud Firestore:", err);
    }
  };

  const handleDeletePaymentTransaction = async (txId: string) => {
    const txToDelete = paymentTransactions.find(tx => tx.id === txId);
    if (!txToDelete) return;

    const updated = paymentTransactions.filter(tx => tx.id !== txId);
    setPaymentTransactions(updated);
    localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(updated));

    // Add audit log for deletion
    const deleteLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'DELETE_INVOICE',
      module: 'SISTEM',
      description: `Menghapus transaksi kas harian (ID: ${txToDelete.id}) senilai Rp ${txToDelete.amount.toLocaleString('id-ID')}. Keterangan: ${txToDelete.notes || '-'}`,
      referenceNum: txToDelete.invoiceNum || 'MUTASI'
    };
    const nextLogs = [deleteLog, ...auditLogs];
    setAuditLogs(nextLogs);
    localStorage.setItem('nota_stok_audit_logs', JSON.stringify(nextLogs));

    try {
      await deleteDocumentFromFirestore('payment_transactions', txId);
      await saveDocumentToFirestore('audit_logs', deleteLog);
    } catch (err) {
      console.error("Gagal menghapus transaksi dari Cloud Firestore:", err);
    }
  };

  // Add brand new stock master item
  const handleAddProduct = (newProduct: Product, optionalInitialMovement?: StockMovement) => {
    const nextProducts = [...products, newProduct];
    const nextMovements = optionalInitialMovement 
      ? [optionalInitialMovement, ...movements] 
      : movements;

    // Add audit log
    const logMsg = `Mendaftarkan barang baru: ${newProduct.name} (SKU: ${newProduct.sku}) dengan stok awal ${newProduct.stock} ${newProduct.unit}.`;
    const productLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'ADD_PRODUCT',
      module: 'STOK',
      description: logMsg,
      referenceNum: newProduct.sku
    };
    const nextLogs = [productLog, ...auditLogs];

    syncToLocalStorage(nextProducts, invoices, nextMovements, nextLogs);
  };

  // Bulk import products from CSV with safe deduplication and automatic transactional stock movement lodging
  const handleBulkImport = (importedProducts: Product[], importedMovements: StockMovement[]) => {
    const nextProducts = [...products];
    const newMovementsToPrepend: StockMovement[] = [...importedMovements];

    let newCount = 0;
    let updateCount = 0;

    importedProducts.forEach(newProd => {
      const idx = nextProducts.findIndex(p => p.sku === newProd.sku);
      if (idx !== -1) {
        updateCount++;
        const existing = nextProducts[idx];
        const nextStock = existing.stock + newProd.stock;

        if (newProd.stock > 0) {
          newMovementsToPrepend.push({
            id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            productId: existing.id,
            productName: existing.name,
            sku: existing.sku,
            type: 'IN',
            qty: newProd.stock,
            prevStock: existing.stock,
            currStock: nextStock,
            date: new Date().toISOString(),
            reference: 'Impor CSV (Update)'
          });
        }

        nextProducts[idx] = {
          ...existing,
          name: newProd.name || existing.name,
          category: newProd.category || existing.category,
          sellPrice: newProd.sellPrice > 0 ? newProd.sellPrice : existing.sellPrice,
          buyPrice: newProd.buyPrice > 0 ? newProd.buyPrice : existing.buyPrice,
          stock: nextStock,
          minStock: newProd.minStock >= 0 ? newProd.minStock : existing.minStock,
          unit: newProd.unit || existing.unit
        };
      } else {
        newCount++;
        const newId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const productToAdd: Product = {
          ...newProd,
          id: newId
        };
        nextProducts.push(productToAdd);

        if (productToAdd.stock > 0) {
          newMovementsToPrepend.push({
            id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            productId: newId,
            productName: productToAdd.name,
            sku: productToAdd.sku,
            type: 'INITIAL',
            qty: productToAdd.stock,
            prevStock: 0,
            currStock: productToAdd.stock,
            date: new Date().toISOString(),
            reference: 'Impor CSV'
          });
        }
      }
    });

    const nextMovements = [...newMovementsToPrepend, ...movements];

    // Add audit log
    const logMsg = `Mengimpor massal berkas CSV: Berhasil mendaftarkan ${newCount} produk baru dan memperbarui ${updateCount} produk eksis.`;
    const importLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'BULK_IMPORT',
      module: 'STOK',
      description: logMsg,
      referenceNum: 'Impor CSV'
    };
    const nextLogs = [importLog, ...auditLogs];

    syncToLocalStorage(nextProducts, invoices, nextMovements, nextLogs);
  };

  // Update existing product attributes
  const handleUpdateProduct = (updatedProduct: Product) => {
    const nextProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);

    // Add audit log
    const logMsg = `Memperbarui rincian barang: ${updatedProduct.name} (SKU: ${updatedProduct.sku}) - Harga Jual: Rp ${updatedProduct.sellPrice.toLocaleString('id-ID')}.`;
    const updateLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'UPDATE_PRODUCT',
      module: 'STOK',
      description: logMsg,
      referenceNum: updatedProduct.sku
    };
    const nextLogs = [updateLog, ...auditLogs];

    syncToLocalStorage(nextProducts, invoices, movements, nextLogs);
  };

  // Delete product master item
  const handleDeleteProduct = (productId: string) => {
    const targetProduct = products.find(p => p.id === productId);
    const prodName = targetProduct ? targetProduct.name : 'Produk Tidak Dikenal';
    const sku = targetProduct ? targetProduct.sku : '';
    const nextProducts = products.filter(p => p.id !== productId);

    // Add audit log
    const logMsg = `Menghapus produk dari database: ${prodName} (SKU: ${sku}).`;
    const deleteLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'DELETE_PRODUCT',
      module: 'STOK',
      description: logMsg,
      referenceNum: sku
    };
    const nextLogs = [deleteLog, ...auditLogs];

    syncToLocalStorage(nextProducts, invoices, movements, nextLogs);
  };

  // Delete invoice (Nota) for OWNER role
  const handleDeleteInvoice = async (invoiceId: string) => {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice) return;

    const nextInvoices = invoices.filter(inv => inv.id !== invoiceId);
    const paymentsToDelete = paymentTransactions.filter(p => p.invoiceId === invoiceId);
    const nextPayments = paymentTransactions.filter(p => p.invoiceId !== invoiceId);

    // Update payment state and local storage immediately
    setPaymentTransactions(nextPayments);
    localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(nextPayments));

    // Clear selected invoice if matched
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(null);
    }

    // Add audit log
    const invoiceNum = targetInvoice.invoiceNum;
    const logMsg = `Menghapus nota invoice dari database: No. Nota ${invoiceNum} (Pemesan: ${targetInvoice.customerName}) senilai Rp ${targetInvoice.totalAmount.toLocaleString('id-ID')}.`;
    const deleteLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'DELETE_INVOICE',
      module: 'SISTEM',
      description: logMsg,
      referenceNum: invoiceNum
    };
    const nextLogs = [deleteLog, ...auditLogs];

    // Delete physically from cloud DB
    try {
      await deleteDocumentFromFirestore('invoices', invoiceId);
      for (const p of paymentsToDelete) {
        await deleteDocumentFromFirestore('payment_transactions', p.id);
      }
    } catch (err) {
      console.error("Gagal menghapus dokumen dari cloud:", err);
    }

    syncToLocalStorage(products, nextInvoices, movements, nextLogs);
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

        // Add audit log
        const logMsg = `Melakukan restock barang: ${p.name} (SKU: ${p.sku}) sebanyak +${qtyAdded} ${p.unit}. Referensi: ${reference}.`;
        const restockLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: userRole,
          actionType: 'RESTOCK_PRODUCT',
          module: 'STOK',
          description: logMsg,
          referenceNum: p.sku
        };
        const nextLogs = [restockLog, ...auditLogs];

        // Add to logs directly
        setMovements(prev => [newMovement, ...prev]);
        setTimeout(() => {
          syncToLocalStorage(
            products.map(p2 => p2.id === productId ? { ...p2, stock: newStock } : p2),
            invoices,
            [newMovement, ...movements],
            nextLogs
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

  // Handle physical stock adjustment (Stok Opname)
  const handleStockOpname = (productId: string, actualStock: number, reference: string) => {
    const nextProducts = products.map(p => {
      if (p.id === productId) {
        const oldStock = p.stock;
        const diff = actualStock - oldStock;
        if (diff === 0) return p;

        const newMovement: StockMovement = {
          id: `move-${Date.now()}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          type: 'ADJUST',
          qty: diff,
          prevStock: oldStock,
          currStock: actualStock,
          date: new Date().toISOString(),
          reference: `Stok Opname: ${reference}`
        };

        const logMsg = `Stok Opname untuk ${p.name} (SKU: ${p.sku}): Menyesuaikan dari sistem (${oldStock}) menjadi fisik (${actualStock}). Selisih: ${diff > 0 ? '+' : ''}${diff}. Alasan: ${reference}.`;
        const opnameLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: userRole,
          actionType: 'UPDATE_PRODUCT',
          module: 'STOK',
          description: logMsg,
          referenceNum: p.sku
        };
        const nextLogs = [opnameLog, ...auditLogs];

        setMovements(prev => [newMovement, ...prev]);
        setTimeout(() => {
          syncToLocalStorage(
            products.map(p2 => p2.id === productId ? { ...p2, stock: actualStock } : p2),
            invoices,
            [newMovement, ...movements],
            nextLogs
          );
        }, 10);

        return {
          ...p,
          stock: actualStock
        };
      }
      return p;
    });
  };

  // Handle security credentials update
  const handleUpdatePasswords = async (newKasirPass: string, newOwnerPass: string, newProduksiPass: string) => {
    try {
      setKasirPassword(newKasirPass);
      setOwnerPassword(newOwnerPass);
      setProduksiPassword(newProduksiPass);
      
      localStorage.setItem('nota_stok_kasir_password', newKasirPass);
      localStorage.setItem('nota_stok_owner_password', newOwnerPass);
      localStorage.setItem('nota_stok_produksi_password', newProduksiPass);

      // Save to Firebase
      await saveCredentialsToFirestore({
        id: 'credentials',
        kasirPassword: newKasirPass,
        ownerPassword: newOwnerPass,
        produksiPassword: newProduksiPass
      });

      // Add audit log for security action
      const logEntry: AuditLog = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'OWNER',
        actionType: 'UPDATE_PASSWORDS',
        module: 'SISTEM',
        description: `Owner mengubah dan memutakhirkan kata sandi keamanan login (Akses Kasir, Owner & Produksi).`,
        referenceNum: 'Mutasi Sandi'
      };
      
      setAuditLogs(prev => {
        const nextLogs = [logEntry, ...prev];
        localStorage.setItem('nota_stok_audit_logs', JSON.stringify(nextLogs));
        saveDocumentToFirestore('audit_logs', logEntry);
        return nextLogs;
      });
    } catch (err) {
      console.error("Gagal memperbarui kata sandi:", err);
      throw err;
    }
  };

  // Hard Reset to presets with SMTP OTP authentication to Owner email athreestudiojayapura@gmail.com
  const handleResetToPresets = () => {
    if (confirm('Sistem mendeteksi tindakan reset total. Demi keamanan data, Anda wajib memasukkan 6-digit kode keamanan OTP yang dikirimkan ke email Owner Utama (athreestudiojayapura@gmail.com). Apakah Anda ingin melanjutkan?')) {
      setIsResetOtpModalOpen(true);
      sendOtpEmail();
    }
  };

  // Individual Reset: Stok Barang
  const handleResetStokBarang = async (mode: 'EMPTY' | 'PRESET' = 'EMPTY') => {
    const nextProducts = mode === 'EMPTY' ? [] : INITIAL_PRODUCTS;
    const nextMovements: StockMovement[] = [];

    // Log the event
    const logEntry: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'RESET_SYSTEM',
      module: 'STOK',
      description: mode === 'EMPTY' 
        ? 'Melakukan reset / pengosongan data seluruh Stok Barang / Produk.'
        : 'Melakukan reset / pemulihan seluruh data Stok Barang / Produk ke template simulasi.',
      referenceNum: 'Reset Stok'
    };
    
    const nextLogs = [logEntry, ...auditLogs];
    syncToLocalStorage(nextProducts, invoices, nextMovements, nextLogs);
  };

  // Individual Reset: Daftar Nota Pembayaran
  const handleResetDaftarNota = async (mode: 'EMPTY' | 'PRESET' = 'EMPTY') => {
    const nextInvoices = mode === 'EMPTY' ? [] : INITIAL_INVOICES;
    const nextMovements = mode === 'EMPTY' ? [] : INITIAL_MOVEMENTS;
    
    // Seed payment transactions accordingly
    let seedPayments: PaymentTransaction[] = [];
    if (mode === 'PRESET') {
      INITIAL_INVOICES.forEach((inv, index) => {
        if (inv.downPayment > 0) {
          seedPayments.push({
            id: `pay-${inv.id}-dp`,
            invoiceId: inv.id,
            invoiceNum: inv.invoiceNum,
            customerName: inv.customerName,
            amount: inv.downPayment,
            method: index % 2 === 0 ? 'CASH' : 'TRANSFER',
            type: 'DP',
            timestamp: `${inv.date}T09:15:00.000Z`,
            cashier: 'OWNER'
          });
        }
        if (inv.settlement > 0) {
          seedPayments.push({
            id: `pay-${inv.id}-set`,
            invoiceId: inv.id,
            invoiceNum: inv.invoiceNum,
            customerName: inv.customerName,
            amount: inv.settlement,
            method: index % 2 !== 0 ? 'CASH' : 'TRANSFER',
            type: 'PELUNASAN',
            timestamp: `${inv.date}T15:30:00.000Z`,
            cashier: 'OWNER'
          });
        }
      });
    }

    setPaymentTransactions(seedPayments);
    localStorage.setItem('nota_stok_payment_transactions', JSON.stringify(seedPayments));

    // Log the event
    const logEntry: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      actionType: 'RESET_SYSTEM',
      module: 'NOTA',
      description: mode === 'EMPTY'
        ? 'Melakukan reset / pengosongan seluruh data daftar Nota Pembayaran.'
        : 'Melakukan reset / pemulihan data daftar Nota Pembayaran ke template simulasi.',
      referenceNum: 'Reset Nota'
    };

    const nextLogs = [logEntry, ...auditLogs];
    syncToLocalStorage(products, nextInvoices, nextMovements, nextLogs);

    // Also sync payment transactions in background
    setIsFirebaseSyncing(true);
    try {
      await saveCollectionInBatches('payment_transactions', seedPayments);
    } catch (e) {
      console.error("Gagal sync payment_transactions ke Firestore:", e);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // Invoice Number generator based on list size (e.g. #003)
  const computeNextInvoiceNum = () => {
    // Collect count from list, pad appropriately
    const count = invoices.length + 1;
    return `#${String(count).padStart(3, '0')}`;
  };

  if (!isLoggedIn) {
    return (
      <LoginForm 
        onLoginSuccess={handleLoginSuccess} 
        kasirPassword={kasirPassword} 
        ownerPassword={ownerPassword} 
        produksiPassword={produksiPassword}
      />
    );
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
                  <div className="flex items-center gap-1.5 mt-0.5" id="firestore-sync-badge">
                    <span className={`w-2 h-2 rounded-full ${
                      firebaseStatus === 'CONNECTED' 
                        ? 'bg-emerald-500' 
                        : firebaseStatus === 'CONNECTING' 
                          ? 'bg-amber-400 animate-pulse' 
                          : 'bg-rose-500'
                    }`} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                      {firebaseStatus === 'CONNECTED' ? 'Cloud: Online' : firebaseStatus === 'CONNECTING' ? 'Cloud: Connecting' : 'Cloud: Offline'}
                      {isFirebaseSyncing && <span className="animate-spin text-indigo-500 shrink-0">⌛</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Toggle (Light / Dark Modo) */}
              <button
                type="button"
                id="btn-theme-toggle"
                onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-250/90 text-slate-600 transition duration-150 cursor-pointer shadow-3xs flex items-center justify-center dark:bg-slate-900 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-slate-750"
                title={theme === 'light' ? 'Nyalakan Mode Gelap' : 'Nyalakan Mode Terang'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 shrink-0" />
                ) : (
                  <Sun className="w-4 h-4 shrink-0 text-amber-400" />
                )}
              </button>
            </div>

            {/* Interactive User Switcher Card */}
            <div className="px-4 py-3.5 mx-4 my-3 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl" id="role-selector-widget">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Sesi Aktif
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  userRole === 'OWNER' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : userRole === 'PRODUKSI'
                      ? 'bg-blue-105 text-indigo-805 border border-indigo-200'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {userRole}
                </span>
              </div>
              
              <div className="mt-3 flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-50 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  userRole === 'OWNER' 
                    ? 'bg-indigo-650 text-white' 
                    : userRole === 'PRODUKSI'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-amber-400 text-slate-900'
                }`}>
                  {userRole === 'OWNER' ? <Crown className="w-4 h-4" /> : userRole === 'PRODUKSI' ? <Wrench className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 uppercase truncate">
                    {userRole === 'OWNER' ? 'Owner Utama' : userRole === 'PRODUKSI' ? 'Staf Produksi' : 'Admin Kasir'}
                  </p>
                  <p className="text-[9px] text-slate-450 tracking-tight leading-none uppercase font-black mt-0.5">
                    ID: {userRole === 'OWNER' ? 'Owner' : userRole === 'PRODUKSI' ? 'produksi' : 'admin'}
                  </p>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 mt-2 text-center font-medium leading-normal">
                {userRole === 'KASIR' 
                  ? '🔒 Kasir: Buat & revisi nota, update produksi.' 
                  : userRole === 'PRODUKSI'
                    ? '⚙️ Produksi: Hanya pantau & update status produksi.'
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
              {userRole !== 'PRODUKSI' && (
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
              )}

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

              {/* Buku Mutasi Hari Ini */}
              {userRole !== 'PRODUKSI' && (
                <button
                  id="tab-buku-mutasi"
                  onClick={() => setActiveTab('buku-mutasi')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                    activeTab === 'buku-mutasi'
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Buku Mutasi Hari Ini
                </button>
              )}

              {/* Rekap Kasir & Closingan */}
              {userRole !== 'PRODUKSI' && (
                <button
                  id="tab-cash-drawer"
                  onClick={() => setActiveTab('kasir-closingan')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                    activeTab === 'kasir-closingan'
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                  }`}
                >
                  <div className="relative">
                    <CreditCard className="w-4 h-4" />
                    {activeSession && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-555 rounded-full animate-pulse" />
                    )}
                  </div>
                  Kasir & Closing Kas
                </button>
              )}

              {/* Master Persediaan Stok */}
              {userRole !== 'PRODUKSI' && (
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
              )}

              {/* Laporan Mutasi Stok Otomatis */}
              {userRole !== 'PRODUKSI' && (
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
              )}

              {/* Histori Aktivitas Audit Log */}
              {userRole !== 'PRODUKSI' && (
                <button
                  id="tab-audit-logs"
                  onClick={() => setActiveTab('histori-aktivitas')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-205 ${
                    activeTab === 'histori-aktivitas'
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Histori Aktivitas
                </button>
              )}

              {/* Pengaturan Logo Toko */}
              {userRole !== 'PRODUKSI' && (
                <button
                  id="tab-logo-settings"
                  onClick={() => setActiveTab('pengaturan-toko')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                    activeTab === 'pengaturan-toko'
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-indigo-50/60'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Pengaturan Logo Toko
                </button>
              )}

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
        <main 
          className={`flex-1 p-4 md:p-8 overflow-y-auto ${
            (selectedInvoice || quickPrintInvoice) ? 'print:hidden' : 'print:p-0'
          }`} 
          id="app-workspace-main"
        >
          
          {/* Dynamic tabs render switch routing */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              products={products}
              invoices={invoices}
              auditLogs={auditLogs}
              setActiveTab={setActiveTab}
              userRole={userRole}
              onTriggerManualBackup={handleManualBackup}
              lastSyncTime={lastSyncTime}
              activeSession={activeSession}
              paymentTransactions={paymentTransactions}
              onAddCustomTransaction={handleAddPaymentTransaction}
              onUpdateCustomTransaction={handleUpdatePaymentTransaction}
              onDeleteCustomTransaction={handleDeletePaymentTransaction}
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
              onQuickPrint={(inv) => setQuickPrintInvoice(inv)}
              onDeleteInvoice={handleDeleteInvoice}
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
              onStockOpname={handleStockOpname}
              onBulkImport={handleBulkImport}
              userRole={userRole}
            />
          )}

          {activeTab === 'laporan-stok' && (
            <LaporanStok 
              movements={movements}
            />
          )}

          {activeTab === 'histori-aktivitas' && (
            <HistoriAktivitas
              auditLogs={auditLogs}
              onClearLogs={() => {
                setAuditLogs([]);
                localStorage.setItem('nota_stok_audit_logs', JSON.stringify([]));
              }}
              userRole={userRole}
            />
          )}

          {activeTab === 'kasir-closingan' && (
            <KasirSesiPanel
              paymentTransactions={paymentTransactions}
              activeSession={activeSession}
              sessionsHistory={sessionsHistory}
              onOpenSession={handleOpenSession}
              onCloseSession={handleCloseSession}
              onAddCustomTransaction={handleAddPaymentTransaction}
              userRole={userRole}
            />
          )}

          {activeTab === 'buku-mutasi' && (
            <BukuMutasi
              paymentTransactions={paymentTransactions}
              onAddCustomTransaction={handleAddPaymentTransaction}
              onDeleteCustomTransaction={handleDeletePaymentTransaction}
              userRole={userRole}
            />
          )}

          {activeTab === 'pengaturan-toko' && (
            <PengaturanToko
              userRole={userRole}
              setActiveTab={setActiveTab}
              theme={theme}
              setTheme={setTheme}
              kasirPassword={kasirPassword}
              ownerPassword={ownerPassword}
              produksiPassword={produksiPassword}
              onUpdatePasswords={handleUpdatePasswords}
              onResetStokBarang={handleResetStokBarang}
              onResetDaftarNota={handleResetDaftarNota}
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

      {/* Transient overlay specifically for Instant Quick-Printing without opening full modal on-screen */}
      {quickPrintInvoice && (
        <NotaDetailModal 
          invoice={quickPrintInvoice}
          onClose={() => setQuickPrintInvoice(null)}
          onPaySettlement={handlePaySettlement}
          onUpdateProductionStatus={handleUpdateProductionStatus}
          isQuickPrint={true}
        />
      )}

      {/* Floating Auto-Backup Notification Toast Banner */}
      {backupToast && backupToast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 max-w-md bg-white border-2 border-indigo-100 rounded-2xl shadow-2xl p-5 border-l-4 border-l-emerald-500 flex items-start gap-4 print:hidden"
          id="backup-sync-toast"
        >
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-2.5 shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                {backupToast.message}
                <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md ${
                  backupToast.type === 'DAILY' 
                    ? 'bg-purple-100 text-purple-700' 
                    : backupToast.type === 'MANUAL'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {backupToast.type === 'DAILY' ? 'HARIAN' : backupToast.type === 'MANUAL' ? 'MANUAL' : 'STARTUP'}
                </span>
              </h4>
              <button 
                onClick={() => setBackupToast(prev => prev ? { ...prev, show: false } : null)}
                className="text-slate-400 hover:text-slate-650 text-xs font-bold leading-none p-1.5 bg-slate-50 hover:bg-slate-100 rounded-md transition outline-none border-none cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {backupToast.subMessage}
            </p>
            <div className="flex items-center gap-3 pt-2 text-[10px] font-mono text-slate-400 font-bold border-t border-indigo-50 mt-1.5">
              <span>⏰ {backupToast.timestamp}</span>
              <span>•</span>
              <span className="text-indigo-600">🛡️ Auto-Protect Aktif</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* EXPLICIT LOGOUT SYSTEM STORAGE SYNCHRONIZATION OVERLAY */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-indigo-100 dark:border-slate-800 space-y-6 text-center select-none"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-slate-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Database className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-950 dark:text-slate-50 uppercase tracking-tight font-sans">Menyimpan Transaksi...</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">
                Mohon tidak menutup browser. Sistem sedang menyinkronkan seluruh mutasi stok dan transaksi kas laci Anda ke Cloud Firestore secara permanen.
              </p>
            </div>

            <div className="py-2.5 px-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-indigo-700 dark:text-indigo-400">
              <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-ping" />
              <span>SINKRONISASI FIRESTORE LOGOUT</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* SECURITY OTP AUTH OVERLAY MODAL FOR SYSTEM RESET */}
      {isResetOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-indigo-50 dark:border-slate-800 space-y-6 text-center select-none"
          >
            {/* Shield with lock banner */}
            <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Key className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Otentikasi OTP Diperlukan</h3>
              <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed text-slate-500">
                Untuk menyetel ulang seluruh basis data sistem (hard reset), masukkan 6-digit kode keamanan yang telah dikirimkan ke email Owner Utama: 
                <span className="block text-indigo-600 font-extrabold mt-1 text-sm bg-indigo-50/50 py-1 rounded-lg">athreestudiojayapura@gmail.com</span>
              </p>
            </div>

            {/* Email send states / progress */}
            {otpSendingStatus === 'sending' && (
              <div className="py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                <span>Mengirimkan kode keamanan harian...</span>
              </div>
            )}

            {otpSendingStatus === 'sent' && (
              <div className="py-1 px-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Kode keamanan berhasil terkirim ke email pemilik!</span>
              </div>
            )}

            {otpSendingStatus === 'error' && (
              <div className="py-3 px-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-left text-xs font-bold text-rose-800 dark:text-rose-400 space-y-1">
                <div className="flex items-center gap-1.5 uppercase font-black">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Gagal Mengirim OTP
                </div>
                <p className="font-semibold text-rose-700">{otpErrorMessage}</p>
              </div>
            )}

            {/* Developer interactive preview helper link */}
            {testEtherealUrl && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-2">
                <p className="font-bold">🧪 [PREVIEW LOGS / SIMULASI MAIL INBOX]</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Karena berjalan dalam mode sandbox, Anda dapat mengintip dan menyalin OTP dari kotak surat virtual dengan mengeklik tombol di bawah ini:
                </p>
                <a
                  href={testEtherealUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[11px] no-underline border-none"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Buka Inbox Simulasi & Salin OTP ↗
                </a>
              </div>
            )}

            {/* OTP Inputs form element */}
            <form onSubmit={(e) => { e.preventDefault(); verifyOtpCodeAndReset(otpCode); }} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">6 Digit Kode OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Contoh: 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center bg-slate-50 dark:bg-slate-800 border-2 border-indigo-50/50 dark:border-slate-805 rounded-2xl py-3.5 px-4 text-2xl font-black tracking-widest text-slate-900 dark:text-slate-50 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              {otpVerificationStatus === 'error' && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-805 dark:text-rose-450 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{otpErrorMessage}</span>
                </div>
              )}

              {otpVerificationStatus === 'verified' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-808 dark:text-emerald-350 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 animate-bounce" />
                  <span>Autentikasi Sukses! Melakukan pembersihan data...</span>
                </div>
              )}

              {/* Functional CTA buttons */}
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOtpModalOpen(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-xs rounded-2xl transition cursor-pointer border-none"
                >
                  Batalkan Reset
                </button>
                <button
                  type="submit"
                  disabled={otpVerificationStatus === 'verifying' || otpVerificationStatus === 'verified' || otpCode.length !== 6}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer border-none flex items-center justify-center gap-1 shadow-md shadow-rose-600/10"
                >
                  {otpVerificationStatus === 'verifying' ? 'Memverifikasi...' : 'Verifikasi & Reset'}
                </button>
              </div>

              {/* Resend OTP button link */}
              <div className="text-[11px] font-bold text-slate-400">
                Tidak mendapatkan kode?{' '}
                <button
                  type="button"
                  disabled={otpSendingStatus === 'sending'}
                  onClick={sendOtpEmail}
                  className="text-indigo-600 hover:text-indigo-750 bg-transparent py-0 px-1 border-none cursor-pointer font-extrabold uppercase disabled:opacity-50"
                >
                  Kirim Ulang OTP
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Subtle bottom human branding margin (Hides during printing) */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-indigo-100 bg-white print:hidden" id="app-footer-bar">
        <span>© 2026 Athree Studio Workshop App. Dibuat dengan presisi tinggi dan pencatatan kas berlapis.</span>
      </footer>

    </div>
  );
}
