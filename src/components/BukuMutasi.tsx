import React, { useState, useEffect, useMemo } from 'react';
import { PaymentTransaction, ShopSettings, CashierSession } from '../types';
import { 
  BookOpen, 
  Printer, 
  Plus, 
  Search, 
  Calendar, 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  SlidersHorizontal,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Edit,
  Lock,
  X,
  Check
} from 'lucide-react';

interface BukuMutasiProps {
  paymentTransactions: PaymentTransaction[];
  onAddCustomTransaction: (tx: PaymentTransaction) => void;
  onUpdateCustomTransaction?: (tx: PaymentTransaction) => void;
  onDeleteCustomTransaction?: (txId: string) => void;
  userRole: string;
  activeSession?: CashierSession | null;
  sessionsHistory?: CashierSession[];
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountOwner: string;
}

export default function BukuMutasi({
  paymentTransactions,
  onAddCustomTransaction,
  onUpdateCustomTransaction,
  onDeleteCustomTransaction,
  userRole,
  activeSession = null,
  sessionsHistory = []
}: BukuMutasiProps) {
  // Load registered bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('athree_bank_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: 'default-1', bankName: 'BCA', accountNumber: '0931366377', accountOwner: 'LUKMAN HAKIM' }
    ];
  });

  // Selected Bank Account
  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    return bankAccounts[0]?.id || 'custom';
  });

  // Custom metadata input fields
  const [customBankName, setCustomBankName] = useState('BCA');
  const [customAccountNumber, setCustomAccountNumber] = useState('0931366377');
  const [customAccountOwner, setCustomAccountOwner] = useState('LUKMAN HAKIM');

  // Filter settings
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedMethod, setSelectedMethod] = useState<'ALL' | 'TRANSFER' | 'CASH'>('TRANSFER');
  const [startingBalance, setStartingBalance] = useState<number>(() => {
    const saved = localStorage.getItem('athree_mutasi_starting_balance');
    return saved ? Number(saved) : 782890318;
  });

  // Editing transaction state for Owner
  const [editingTransaction, setEditingTransaction] = useState<PaymentTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCustomer, setEditCustomer] = useState('');
  const [editMethod, setEditMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [editType, setEditType] = useState<'DP' | 'PELUNASAN' | 'PENGELUARAN'>('PELUNASAN');
  const [editTimestamp, setEditTimestamp] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleStartEdit = (tx: PaymentTransaction) => {
    setEditingTransaction(tx);
    setEditAmount(tx.amount.toLocaleString('id-ID'));
    setEditNotes(tx.notes || '');
    setEditCustomer(tx.customerName || '');
    setEditMethod(tx.method);
    setEditType(tx.type);
    setEditTimestamp(tx.timestamp);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const parsedAmount = parseFloat(editAmount.replace(/[^0-9]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Harap masukkan nominal transaksi mutasi yang valid!");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedTx: PaymentTransaction = {
        ...editingTransaction,
        amount: parsedAmount,
        method: editMethod,
        type: editType,
        notes: editNotes.trim(),
        customerName: editCustomer.trim() ? editCustomer.trim() : undefined,
        timestamp: editTimestamp || new Date().toISOString()
      };

      if (onUpdateCustomTransaction) {
        await onUpdateCustomTransaction(updatedTx);
      }
      setEditingTransaction(null);
      showToast('Transaksi berhasil diperbarui.', 'success');
    } catch (err) {
      console.error("Gagal mengubah transaksi:", err);
      alert("Gagal menyimpan perubahan transaksi!");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Find session for start date to match cash drawer opening balance
  const sessionForStartDate = useMemo(() => {
    if (!startDate) return null;
    const todayStrValue = new Date().toISOString().split('T')[0];
    if (startDate === todayStrValue && activeSession) {
      return activeSession;
    }
    const matchedSession = (sessionsHistory || []).find(s => {
      try {
        const openedDateStr = s.openedAt.split('T')[0];
        return openedDateStr === startDate;
      } catch (e) {
        return false;
      }
    });
    return matchedSession || null;
  }, [activeSession, sessionsHistory, startDate]);

  // Determine starting balance based on method selection (CASH uses opening balance, TRANSFER uses user-configured balance)
  const effectiveStartingBalance = useMemo(() => {
    if (selectedMethod === 'CASH') {
      return sessionForStartDate ? sessionForStartDate.openingBalance : 0;
    }
    return startingBalance;
  }, [selectedMethod, sessionForStartDate, startingBalance]);

  // Saving settings inside local storage
  useEffect(() => {
    localStorage.setItem('athree_mutasi_starting_balance', startingBalance.toString());
  }, [startingBalance]);

  // Listener to keep bank accounts synchronized if they are modified in PengaturanToko
  useEffect(() => {
    const handleSyncAccounts = () => {
      const saved = localStorage.getItem('athree_bank_accounts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBankAccounts(parsed);
          if (parsed.length > 0 && !parsed.some((a: any) => a.id === selectedBankId)) {
            setSelectedBankId(parsed[0].id);
          }
        } catch (e) {
          // ignore
        }
      }
    };
    window.addEventListener('athree-rekening-changed', handleSyncAccounts);
    return () => {
      window.removeEventListener('athree-rekening-changed', handleSyncAccounts);
    };
  }, [selectedBankId]);

  // Retrieve current active account details
  const activeAccount = useMemo(() => {
    const found = bankAccounts.find(acc => acc.id === selectedBankId);
    if (found) {
      return found;
    }
    return {
      id: 'custom',
      bankName: customBankName.toUpperCase(),
      accountNumber: customAccountNumber,
      accountOwner: customAccountOwner.toUpperCase()
    };
  }, [bankAccounts, selectedBankId, customBankName, customAccountNumber, customAccountOwner]);

  // Form states for manual mutation entry
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'DP' | 'PELUNASAN' | 'PENGELUARAN'>('DP');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formMethod, setFormMethod] = useState<'TRANSFER' | 'CASH'>('TRANSFER');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formDate, setFormDate] = useState(todayStr);

  const [notification, setNotification] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotification({ show: true, msg, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Compile matching transactions and build realistic description strings
  const mutations = useMemo(() => {
    // Filter POS payment transactions
    const filteredTx = paymentTransactions.filter(tx => {
      // Date filter
      const txDate = tx.timestamp.split('T')[0];
      if (txDate < startDate || txDate > endDate) return false;

      // Method filter
      if (selectedMethod !== 'ALL' && tx.method !== selectedMethod) return false;

      return true;
    });

    // Sort by timestamp asc (oldest first) to accurately calculate balance progression
    const sortedTx = [...filteredTx].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Process each transaction to match the bank style layout
    let currentBal = effectiveStartingBalance;
    return sortedTx.map((tx, idx) => {
      const isDebit = tx.type === 'PENGELUARAN';
      const isTransfer = tx.method === 'TRANSFER';
      const amount = tx.amount;

      // Update rolling balance based on current method filter context
      const affectsBalance = selectedMethod === 'ALL' 
        ? true 
        : (selectedMethod === 'CASH' ? !isTransfer : isTransfer);

      if (affectsBalance) {
        if (isDebit) {
          currentBal -= amount;
        } else {
          currentBal += amount;
        }
      }

      // Generate realistic bank branch code (e.g., 0000 for transfers, 0379/other for manual deposits)
      const cab = tx.method === 'TRANSFER' ? '0000' : '0342';

      // Generate authentic Bank Description string matching the visual image
      let description = '';
      const dateObj = new Date(tx.timestamp);
      const ddMm = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const randWsid = tx.invoiceNum ? tx.invoiceNum.replace('#', '') : String(10000 + Math.floor(Math.random() * 90000));

      if (tx.type === 'PENGELUARAN') {
        description = tx.method === 'TRANSFER' 
          ? `TRSF E-BANKING DB\n${ddMm} WSID:${randWsid}\n${tx.notes || 'BIAYA OPERASIONAL'}`
          : `TARIK TUNAI / OUT\n${tx.notes || 'PENGELUARAN KASIR'}`;
      } else {
        const titleType = tx.type === 'DP' ? 'DP' : 'PELUNASAN';
        const client = (tx.customerName || 'UMUM').toUpperCase();
        
        if (tx.method === 'TRANSFER') {
          description = `TRSF E-BANKING CR\n${ddMm} WSID:${randWsid}\n${client} - ${titleType}`;
        } else {
          description = `SETORAN TUNAI\n${client}\n${tx.notes || titleType}`;
        }
      }

      return {
        ...tx,
        dateFormatted: ddMm,
        description,
        cab,
        isDebit,
        isTransfer,
        amountFormatted: amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        balanceFormatted: currentBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        rawBalance: currentBal
      };
    });
  }, [paymentTransactions, startDate, endDate, selectedMethod, effectiveStartingBalance]);

  // Handle form submission for manual mutation
  const handleSubmitManualMutation = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount.replace(/[^0-9]/g, ''));
    if (!formAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Masukkan jumlah uang yang valid!');
      return;
    }

    // Compose custom timestamp with active date + current hours/mins
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const isoTimestamp = `${formDate}T${timeStr}`;

    const newTx: PaymentTransaction = {
      id: `manual-tx-${Date.now()}`,
      amount: parsedAmount,
      method: formMethod,
      type: formType,
      timestamp: isoTimestamp,
      cashier: userRole === 'OWNER' ? 'OWNER' : 'KASIR',
      customerName: formType !== 'PENGELUARAN' ? (formCustomerName.trim() || 'UMUM') : undefined,
      notes: formNotes.trim() || undefined
    };

    onAddCustomTransaction(newTx);
    showToast('Transaksi manual berhasil ditambahkan dan disinkronkan ke Mutasi.', 'success');

    // Reset Form
    setFormAmount('');
    setFormNotes('');
    setFormCustomerName('');
    setShowAddForm(false);
  };

  // Delete transaction
  const handleDeleteMutation = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini akan memperbarui kas dan laporan.')) {
      if (onDeleteCustomTransaction) {
        onDeleteCustomTransaction(id);
        showToast('Transaksi berhasil dihapus.', 'info');
      }
    }
  };

  const formatRp = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handlePrint = () => {
    window.print();
  };

  // Format dates for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6" id="buku-mutasi-main-panel">
      
      {/* Toast Alert Popup */}
      {notification.show && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-2.5 animate-bounce max-w-sm border border-slate-750">
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-sky-400" />
          )}
          <span className="text-xs font-bold font-sans">{notification.msg}</span>
        </div>
      )}

      {/* Control center & Settings (Hidden in print) */}
      <div className="bg-white border-2 border-indigo-50 rounded-[2rem] p-6 shadow-sm print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-50 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Simulator &amp; Buku Mutasi Rekening
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cetak dan simpan rekapitulasi mutasi setoran / transfer yang selaras dengan rekening bank Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-55 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Input Mutasi Manual
            </button>

            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Cetak / Ekspor PDF
            </button>
          </div>
        </div>

        {/* Form Input Mutasi Manual */}
        {showAddForm && (
          <form onSubmit={handleSubmitManualMutation} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                Tambah Transaksi Manual (Mutasi)
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-bold"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Tipe Mutasi</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="DP">SETORAN DP (Kredit)</option>
                  <option value="PELUNASAN">SETORAN PELUNASAN (Kredit)</option>
                  <option value="PENGELUARAN">PENGELUARAN KAS (Debit)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Metode Keuangan</label>
                <select
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="TRANSFER">TRANSFER BANK</option>
                  <option value="CASH">CASH / TUNAI</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Jumlah Uang (Rp)</label>
                <input
                  type="text"
                  placeholder="Contoh: 2.000.000"
                  value={formAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val) {
                      setFormAmount(parseInt(val, 10).toLocaleString('id-ID'));
                    } else {
                      setFormAmount('');
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formType !== 'PENGELUARAN' && (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Nama Pemesan / Pelanggan</label>
                  <input
                    type="text"
                    placeholder="Contoh: PROFESOR AGASA"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
              )}

              <div className={formType === 'PENGELUARAN' ? 'sm:col-span-2' : ''}>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Keterangan Tambahan / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Contoh: TRSF E-BANKING atau Biaya Listrik Toko"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Simpan Transaksi Mutasi
              </button>
            </div>
          </form>
        )}

        {/* Live Config Filters */}
        <div className="bg-indigo-50/20 border border-indigo-50 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Pilih Rekening Bank</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full bg-white border border-indigo-100 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-700"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} - {acc.accountNumber} ({acc.accountOwner})
                </option>
              ))}
              <option value="custom">✍️ Tulis Rekening Manual...</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Set Saldo Awal Hari Ini</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="text"
                value={(selectedMethod === 'CASH' ? effectiveStartingBalance : startingBalance).toLocaleString('id-ID')}
                onChange={(e) => {
                  if (selectedMethod !== 'CASH') {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setStartingBalance(val ? parseInt(val, 10) : 0);
                  }
                }}
                disabled={selectedMethod === 'CASH'}
                className={`w-full border border-indigo-100 rounded-xl pl-9 pr-3.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-700 ${
                  selectedMethod === 'CASH' ? 'bg-slate-50 cursor-not-allowed text-slate-400' : 'bg-white'
                }`}
              />
            </div>
            {selectedMethod === 'CASH' && (
              <p className="text-[9px] text-slate-400 font-medium mt-1">
                * Diambil otomatis dari modal awal sesi kasir harian.
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Periode Tanggal Mutasi</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-700"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Metode Keuangan</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
              className="w-full bg-white border border-indigo-100 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-700"
            >
              <option value="TRANSFER">Hanya Transfer (E-Banking)</option>
              <option value="CASH">Hanya Cash / Tunai</option>
              <option value="ALL">Semua Transaksi (Cash + Transfer)</option>
            </select>
          </div>
        </div>

        {/* If custom is selected, show edit inputs */}
        {selectedBankId === 'custom' && (
          <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4.5 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
            <div>
              <label className="text-[10px] font-bold text-amber-800 block mb-1">Nama Bank Kustom</label>
              <input
                type="text"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-amber-800 block mb-1">Nomor Rekening Kustom</label>
              <input
                type="text"
                value={customAccountNumber}
                onChange={(e) => setCustomAccountNumber(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-amber-800 block mb-1">a/n Pemilik Rekening</label>
              <input
                type="text"
                value={customAccountOwner}
                onChange={(e) => setCustomAccountOwner(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* --- REFINED REAL-TIME MUTATION LEDGER PANEL --- */}
      <div 
        className="bg-white border-2 border-indigo-50 rounded-[2rem] p-6 shadow-sm relative overflow-hidden font-sans text-slate-800 max-w-5xl mx-auto"
        id="bank-mutation-replica-frame"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-50 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Laporan Mutasi Rekening Aktif
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              Rincian riwayat transaksi masuk dan keluar berdasarkan pencatatan mutasi
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            REALTIME STATEMENT
          </span>
        </div>

        {/* Info Grid Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-medium text-slate-600 mt-4">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 inline-block font-bold">Nomor Rekening</span>
              <span className="px-2 text-slate-400">:</span>
              <span className="font-extrabold text-slate-800">{activeAccount.accountNumber}</span>
            </div>
            <div className="flex">
              <span className="w-32 inline-block font-bold">Nama Pemilik</span>
              <span className="px-2 text-slate-400">:</span>
              <span className="font-extrabold text-slate-800">{activeAccount.accountOwner}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 inline-block font-bold">Periode</span>
              <span className="px-2 text-slate-400">:</span>
              <span className="font-extrabold text-slate-800">
                {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 inline-block font-bold">Mata Uang</span>
              <span className="px-2 text-slate-400">:</span>
              <span className="font-extrabold text-slate-800">IDR</span>
            </div>
          </div>
        </div>

        {/* Mutations Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs" id="bank-ledger-replica-table">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3 w-20">TGL/WAKTU</th>
                <th className="px-4 py-3">KETERANGAN</th>
                <th className="px-4 py-3 text-right w-44">MUTASI (CR/DB)</th>
                <th className="px-4 py-3 text-right w-44">TOTAL SALDO</th>
                <th className="px-3 py-3 text-center w-12 print:hidden">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* Saldo Awal Row if no mutations or to show starting balance */}
              <tr className="bg-slate-50/50 font-medium text-slate-500">
                <td className="px-4 py-2 font-mono text-[11px]">-</td>
                <td className="px-4 py-2 text-slate-400 italic">SALDO AWAL SEBELUM TRANSAKSI</td>
                <td className="px-4 py-2 text-right text-slate-400">-</td>
                <td className="px-4 py-2 text-right font-mono text-[11px] font-bold text-slate-700">
                  {effectiveStartingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 print:hidden"></td>
              </tr>

              {mutations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic font-semibold">
                    Tidak ada transaksi mutasi keuangan yang terdeteksi untuk kriteria filter periode ini.
                  </td>
                </tr>
              ) : (
                mutations.map((mut, idx) => {
                  return (
                    <tr 
                      key={mut.id} 
                      className={`hover:bg-slate-50/40 transition-colors border-b border-slate-100 ${
                        idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-[11px] font-bold align-top text-slate-500">
                        {mut.dateFormatted}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-pre-line leading-relaxed text-slate-700">
                        {mut.description}
                      </td>
                      {/* Combined MUTASI column */}
                      <td className={`px-4 py-3 text-right font-mono text-[11px] font-bold align-top ${
                        (mut.isDebit && !mut.isTransfer) ? 'text-rose-650' : 'text-emerald-650'
                      }`}>
                        {(mut.isDebit && !mut.isTransfer) ? '-' : '+'}{mut.amountFormatted} {(!mut.isDebit || mut.isTransfer) ? 'CR' : 'DB'}
                      </td>
                      {/* Total Saldo Column */}
                      <td className="px-4 py-3 text-right font-mono text-[11px] font-bold align-top text-slate-700">
                        {mut.balanceFormatted}
                      </td>
                      <td className="px-3 py-3 text-center align-top print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {userRole === 'OWNER' && (
                            <button
                              onClick={() => handleStartEdit(mut)}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Edit Transaksi"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(userRole === 'OWNER' || mut.id.startsWith('manual-tx-')) ? (
                            <button
                              onClick={() => handleDeleteMutation(mut.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span title="Hanya Owner" className="text-slate-300">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
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

        {/* Bottom Total summary card (Hidden on printer, optional for screen view) */}
        <div className="mt-8 border-t border-slate-150 pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-xs font-bold text-slate-500">
          <div className="space-y-1">
            <p>Total Mutasi Kredit (Uang Masuk / CR): <span className="text-emerald-600 font-extrabold">{formatRp(mutations.filter(m => !m.isDebit).reduce((s, m) => s + m.amount, 0))}</span></p>
            <p>Total Mutasi Debit (Uang Keluar / DB): <span className="text-rose-600 font-extrabold">{formatRp(mutations.filter(m => m.isDebit).reduce((s, m) => s + m.amount, 0))}</span></p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-right space-y-0.5">
            <p className="text-[10px] uppercase text-slate-400 tracking-wider">SALDO AKHIR PERIODE</p>
            <p className="text-base font-black font-mono text-slate-800">
              {mutations.length > 0 
                ? formatRp(mutations[mutations.length - 1].rawBalance)
                : formatRp(effectiveStartingBalance)
              }
            </p>
          </div>
        </div>

        {/* Footer print stamp */}
        <div className="text-center text-[10px] text-slate-400 font-mono mt-10 select-none border-t border-dashed border-slate-200 pt-4">
          Printed automatically by Athree POS Cashier System on {new Date().toLocaleString('id-ID')}
        </div>
      </div>

      {/* --- HIGH-FIDELITY EDIT TRANSACTION DIALOG --- */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in print:hidden" id="edit-transaction-modal">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden text-slate-800 font-sans">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-600" />
                  Mengubah Mutasi Kas Toko
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Ubah rincian mutasi kas masuk/keluar harian</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-transparent border-none cursor-pointer outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-left">
              
              {/* Type info */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Tipe Mutasi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('DP')}
                    className={`py-2 px-3 text-center text-xs font-black uppercase rounded-xl transition ${editType === 'DP' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Uang Muka (DP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('PELUNASAN')}
                    className={`py-2 px-3 text-center text-xs font-black uppercase rounded-xl transition ${editType === 'PELUNASAN' ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Pelunasan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('PENGELUARAN')}
                    className={`py-2 px-3 text-center text-xs font-black uppercase rounded-xl transition ${editType === 'PENGELUARAN' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              {/* Amount of money */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 font-mono">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={editAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val) {
                        setEditAmount(parseInt(val, 10).toLocaleString('id-ID'));
                      } else {
                        setEditAmount('');
                      }
                    }}
                    className="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-black font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Method select */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Metode Pembayaran</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as 'CASH' | 'TRANSFER')}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 px-3.5 py-3 rounded-2xl text-sm font-bold focus:border-indigo-400 focus:outline-none"
                >
                  <option value="CASH">💵 TUNAI (CASH)</option>
                  <option value="TRANSFER">🏦 TRANSFER BANK</option>
                </select>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Keterangan / Keperluan</label>
                <input
                  type="text"
                  required
                  placeholder="Keterangan transaksi"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Client name (optional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Nama Pelanggan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nama pelanggan/rekanan"
                  value={editCustomer}
                  onChange={(e) => setEditCustomer(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Timestamp info */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Waktu Transaksi</label>
                <input
                  type="datetime-local"
                  value={editTimestamp ? new Date(editTimestamp).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditTimestamp(new Date(e.target.value).toISOString())}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="py-3 px-4 text-xs font-black uppercase text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="py-3 px-4 text-xs font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
