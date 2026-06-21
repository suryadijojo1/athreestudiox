import React, { useState, useRef, useEffect } from 'react';
import LogoRenderer, { LOGO_PRESETS } from './LogoRenderer';
import { 
  Upload, 
  Sparkles, 
  Lock, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Image as ImageIcon,
  Check,
  Building,
  Save,
  HelpCircle,
  Sun,
  Moon,
  Plus,
  CreditCard,
  Users,
  RotateCcw,
  Receipt,
  Database,
  Package,
  Pencil,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountOwner: string;
}

export interface SalesAgent {
  code: string;
  name: string;
}

interface PengaturanTokoProps {
  userRole?: 'KASIR' | 'OWNER';
  setActiveTab?: (tab: string) => void;
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
  kasirPassword?: string;
  ownerPassword?: string;
  onUpdatePasswords?: (newKasirPass: string, newOwnerPass: string) => Promise<void>;
  onResetStokBarang?: (mode: 'EMPTY' | 'PRESET') => void;
  onResetDaftarNota?: (mode: 'EMPTY' | 'PRESET') => void;
}

export default function PengaturanToko({ 
  userRole = 'OWNER', 
  setActiveTab, 
  theme = 'light', 
  setTheme,
  kasirPassword = 'admin',
  ownerPassword = 'Owner',
  onUpdatePasswords,
  onResetStokBarang,
  onResetDaftarNota
}: PengaturanTokoProps) {
  // Password panel states
  const [newKasirPassword, setNewKasirPassword] = useState(kasirPassword);
  const [newOwnerPassword, setNewOwnerPassword] = useState(ownerPassword);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  // Keep passwords in sync if loaded asynchronously from parent
  useEffect(() => {
    setNewKasirPassword(kasirPassword);
  }, [kasirPassword]);

  useEffect(() => {
    setNewOwnerPassword(ownerPassword);
  }, [ownerPassword]);

  const handleUpdatePasswordsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasirPassword.trim() || !newOwnerPassword.trim()) {
      alert('Password tidak boleh kosong!');
      return;
    }
    setIsUpdatingPass(true);
    setPassSuccessMsg('');
    try {
      if (onUpdatePasswords) {
        await onUpdatePasswords(newKasirPassword.trim(), newOwnerPassword.trim());
        setPassSuccessMsg('Sandi berhasil diperbarui secara permanen dan disinkronkan ke Cloud Firebase!');
        setTimeout(() => setPassSuccessMsg(''), 5000);
      }
    } catch (err) {
      alert('Gagal menyinkronkan sandi baru ke cloud. Silakan periksa koneksi internet.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  // Read current configuration from localStorage
  const [logoType, setLogoType] = useState<'none' | 'preset' | 'custom'>(() => {
    return (localStorage.getItem('athree-shop-logo-type') as 'none' | 'preset' | 'custom') || 'preset';
  });

  const [presetKey, setPresetKey] = useState<string>(() => {
    return localStorage.getItem('athree-shop-logo-preset') || 'shield';
  });

  const [customUrl, setCustomUrl] = useState<string | null>(() => {
    return localStorage.getItem('athree_custom_logo_data');
  });

  const [shopName, setShopName] = useState<string>(() => {
    return localStorage.getItem('athree-shop-name') || 'ATHREE STUDIO JAYAPURA';
  });

  const [shopSlogan, setShopSlogan] = useState<string>(() => {
    return localStorage.getItem('athree-shop-slogan') || 'Studio Printing, Custom Apparel, Sablon Jersey Premium & Digital Printing Terpercaya.';
  });

  const [saveStatus, setSaveStatus] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bank accounts list configuration
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('athree_bank_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((acc: any) => acc.id !== 'bca-seed' && acc.id !== 'papua-seed' && acc.bankName !== 'BCA' && acc.bankName !== 'BANK PAPUA');
        const hasBni = filtered.some((acc: any) => acc.accountNumber === '0152452997' || acc.id === 'bni-seed');
        if (!hasBni) {
          filtered.push({ id: 'bni-seed', bankName: 'BNI', accountNumber: '0152452997', accountOwner: 'DEWI ADHITYARANI M' });
        }
        localStorage.setItem('athree_bank_accounts', JSON.stringify(filtered));
        return filtered;
      } catch (e) {
        // Fallback
      }
    }
    const defaultAccounts = [
      { id: 'bni-seed', bankName: 'BNI', accountNumber: '0152452997', accountOwner: 'DEWI ADHITYARANI M' }
    ];
    localStorage.setItem('athree_bank_accounts', JSON.stringify(defaultAccounts));
    return defaultAccounts;
  });

  const [newBankName, setNewBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountOwner, setNewAccountOwner] = useState('');

  // Official Sales Agents states
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>(() => {
    const saved = localStorage.getItem('athree_sales_agents');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const defaults = [
      { code: 'SL-01', name: 'Dewi Lestari' },
      { code: 'SL-02', name: 'Budi Hermawan' },
      { code: 'SL-03', name: 'Stephanus' },
      { code: 'SL-04', name: 'Martha Papua' }
    ];
    localStorage.setItem('athree_sales_agents', JSON.stringify(defaults));
    return defaults;
  });

  const [newSalesCode, setNewSalesCode] = useState('');
  const [newSalesName, setNewSalesName] = useState('');

  // States for editing a sales agent
  const [editingAgentCode, setEditingAgentCode] = useState<string | null>(null);
  const [editingNewCode, setEditingNewCode] = useState('');
  const [editingAgentName, setEditingAgentName] = useState('');

  const handleAddSalesAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const codeClean = newSalesCode.trim().toUpperCase();
    const nameClean = newSalesName.trim();

    if (!codeClean || !nameClean) {
      alert('Mohon isi Kode Sales dan Nama Sales terlebih dahulu!');
      return;
    }

    if (salesAgents.some(agent => agent.code === codeClean)) {
      alert(`Kode Sales "${codeClean}" sudah terdaftar sebelumnya! Harap gunakan kode unik.`);
      return;
    }

    const updated = [...salesAgents, { code: codeClean, name: nameClean }];
    setSalesAgents(updated);
    localStorage.setItem('athree_sales_agents', JSON.stringify(updated));
    setNewSalesCode('');
    setNewSalesName('');

    // Trigger local event to notify other components immediately
    window.dispatchEvent(new Event('athree-sales-agents-changed'));

    setSaveStatus({ show: true, msg: 'Sales Agent baru berhasil ditambahkan!', type: 'success' });
    setTimeout(() => setSaveStatus({ show: false, msg: '', type: 'success' }), 3000);
  };

  const handleDeleteSalesAgent = (code: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus sales agent "${name}" (${code}) dari daftar resmi?`)) {
      const updated = salesAgents.filter(agent => agent.code !== code);
      setSalesAgents(updated);
      localStorage.setItem('athree_sales_agents', JSON.stringify(updated));

      // Trigger local event
      window.dispatchEvent(new Event('athree-sales-agents-changed'));

      setSaveStatus({ show: true, msg: `Sales "${name}" berhasil dihapus dari sistem.`, type: 'info' });
      setTimeout(() => setSaveStatus({ show: false, msg: '', type: 'success' }), 3000);
    }
  };

  const handleStartEditSales = (agent: SalesAgent) => {
    setEditingAgentCode(agent.code);
    setEditingNewCode(agent.code);
    setEditingAgentName(agent.name);
  };

  const handleCancelEditSales = () => {
    setEditingAgentCode(null);
    setEditingNewCode('');
    setEditingAgentName('');
  };

  const handleSaveEditSales = (oldCode: string) => {
    const codeClean = editingNewCode.trim().toUpperCase();
    const nameClean = editingAgentName.trim();

    if (!codeClean || !nameClean) {
      alert('Kode Sales dan Nama Sales tidak boleh kosong!');
      return;
    }

    if (codeClean !== oldCode && salesAgents.some(agent => agent.code === codeClean)) {
      alert(`Kode Sales "${codeClean}" sudah terdaftar sebelumnya! Harap gunakan kode unik.`);
      return;
    }

    const updated = salesAgents.map(agent => 
      agent.code === oldCode ? { code: codeClean, name: nameClean } : agent
    );
    setSalesAgents(updated);
    localStorage.setItem('athree_sales_agents', JSON.stringify(updated));

    // Support updating invoices if matching code changes
    if (codeClean !== oldCode) {
      try {
        const storedInvoices = localStorage.getItem('nota_stok_invoices');
        if (storedInvoices) {
          const invoicesList = JSON.parse(storedInvoices);
          let changed = false;
          const updatedInvoices = invoicesList.map((inv: any) => {
            if (inv.salesCode === oldCode) {
              changed = true;
              return { ...inv, salesCode: codeClean };
            }
            return inv;
          });
          if (changed) {
            localStorage.setItem('nota_stok_invoices', JSON.stringify(updatedInvoices));
            window.dispatchEvent(new Event('athree-invoices-changed'));
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi salesCode di invoices:", err);
      }
    }

    // Trigger local event
    window.dispatchEvent(new Event('athree-sales-agents-changed'));

    setEditingAgentCode(null);
    setEditingNewCode('');
    setEditingAgentName('');

    setSaveStatus({ show: true, msg: 'Data Sales Agent berhasil diperbarui!', type: 'success' });
    setTimeout(() => setSaveStatus({ show: false, msg: '', type: 'success' }), 3000);
  };

  // Wallpaper states
  const [loginWallpaper, setLoginWallpaper] = useState<string | null>(() => {
    return localStorage.getItem('athree_login_wallpaper');
  });
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const [wallpaperDragActive, setWallpaperDragActive] = useState(false);

  const processWallpaperFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Maaf, file harus berupa gambar (PNG, JPG, SVG, WEBP)!');
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      alert('Maaf, file gambar terlalu besar (maksimal batas 4.5MB untuk kelancaran loading)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      localStorage.setItem('athree_login_wallpaper', base64Data);
      setLoginWallpaper(base64Data);
      setSaveStatus({ show: true, msg: 'Wallpaper login kustom berhasil disimpan!', type: 'success' });
      setTimeout(() => setSaveStatus({ show: false, msg: '', type: 'success' }), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleWallpaperFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processWallpaperFile(e.target.files[0]);
    }
  };

  const handleWallpaperDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setWallpaperDragActive(true);
    } else if (e.type === "dragleave") {
      setWallpaperDragActive(false);
    }
  };

  const handleWallpaperDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWallpaperDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processWallpaperFile(e.dataTransfer.files[0]);
    }
  };

  const deleteWallpaper = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus wallpaper kustom dan kembali ke wallpaper default?')) {
      localStorage.removeItem('athree_login_wallpaper');
      setLoginWallpaper(null);
      setSaveStatus({ show: true, msg: 'Wallpaper login dikembalikan ke bawaan pabrik.', type: 'info' });
      setTimeout(() => setSaveStatus({ show: false, msg: '', type: 'success' }), 4000);
    }
  };

  const handleAddBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountNumber.trim() || !newAccountOwner.trim()) {
      alert('Semua bidang bank (Nama Bank, No Rekening, a/n Pemilik) wajib diisi!');
      return;
    }
    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: newBankName.trim().toUpperCase(),
      accountNumber: newAccountNumber.trim(),
      accountOwner: newAccountOwner.trim().toUpperCase()
    };
    const updated = [...bankAccounts, newAccount];
    setBankAccounts(updated);
    localStorage.setItem('athree_bank_accounts', JSON.stringify(updated));
    setNewBankName('');
    setNewAccountNumber('');
    setNewAccountOwner('');

    // Trigger local event to notify other opened components immediately
    window.dispatchEvent(new Event('athree-rekening-changed'));

    setSaveStatus({
      show: true,
      msg: 'Rekening bank baru berhasil ditambahkan!',
      type: 'success'
    });
  };

  const handleDeleteBankAccount = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus rekening bank ${name}?`)) {
      const updated = bankAccounts.filter(acc => acc.id !== id);
      setBankAccounts(updated);
      localStorage.setItem('athree_bank_accounts', JSON.stringify(updated));

      // Trigger local event
      window.dispatchEvent(new Event('athree-rekening-changed'));

      setSaveStatus({
        show: true,
        msg: 'Rekening bank berhasil dihapus!',
        type: 'info'
      });
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (saveStatus.show) {
      const timer = setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [saveStatus.show]);

  // Handle local state changes & persist to localStorage
  const handleSaveLogoConfig = (
    type: 'none' | 'preset' | 'custom',
    pKey: string,
    cUrl: string | null,
    sName: string,
    sSlogan: string
  ) => {
    localStorage.setItem('athree-shop-logo-type', type);
    localStorage.setItem('athree-shop-logo-preset', pKey);
    if (cUrl) {
      localStorage.setItem('athree_custom_logo_data', cUrl);
    } else {
      localStorage.removeItem('athree_custom_logo_data');
    }
    localStorage.setItem('athree-shop-name', sName);
    localStorage.setItem('athree-shop-slogan', sSlogan);

    // Trigger local event to notify other opened components immediately
    window.dispatchEvent(new Event('athree-logo-changed'));

    setSaveStatus({
      show: true,
      msg: 'Pengaturan logo dan identitas toko berhasil disimpan ke penyimpanan lokal!',
      type: 'success'
    });
  };

  const handleLogoTypeChange = (newType: 'none' | 'preset' | 'custom') => {
    setLogoType(newType);
    handleSaveLogoConfig(newType, presetKey, customUrl, shopName, shopSlogan);
  };

  const handlePresetSelect = (key: string) => {
    setPresetKey(key);
    handleSaveLogoConfig(logoType, key, customUrl, shopName, shopSlogan);
  };

  const handleShopDetailChange = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveLogoConfig(logoType, presetKey, customUrl, shopName, shopSlogan);
  };

  // Convert uploaded file to base64
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Maaf, file harus berupa gambar (PNG, JPG, SVG, WEBP)!');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Maaf, file gambar terlalu besar (maksimal batas 2MB untuk optimasi RAM browser)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setCustomUrl(base64Data);
      setLogoType('custom');
      handleSaveLogoConfig('custom', presetKey, base64Data, shopName, shopSlogan);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const clickFileUpload = () => {
    fileInputRef.current?.click();
  };

  const deleteCustomLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda ingin menghapus logo kustom yang terunggah?')) {
      setCustomUrl(null);
      const nextType = logoType === 'custom' ? 'preset' : logoType;
      setLogoType(nextType);
      handleSaveLogoConfig(nextType, presetKey, null, shopName, shopSlogan);
    }
  };

  // Is blocked (when actor is KASIR)
  const isBlocked = userRole !== 'OWNER';

  return (
    <div className="space-y-6" id="pengaturan-toko-main">
      
      {/* Toast Notification */}
      {saveStatus.show && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 animate-fade-in max-w-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold leading-normal">{saveStatus.msg}</p>
        </div>
      )}

      {/* Header and description banner */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-indigo-500" />
            Konfigurasi Logo &amp; Cetakan Nota
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            Atur penampilan kop surat atau identitas atas pada setiap cetakan nota pembayaran pelanggan, baik format kertas standar A4 maupun mini thermal POS.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Saling Sinkronisasi Real-Time
        </div>
      </div>

      {/* Access Control Alert for Kasir */}
      {isBlocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
          <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Akses Terkunci (Sesi Kasir Terdeteksi)</h4>
            <p className="text-xs text-amber-750 font-medium leading-relaxed">
              Anda saat ini masuk sebagai <strong className="font-extrabold text-amber-900">ADMIN KASIR</strong>. Hanya <strong className="font-extrabold text-amber-900">OWNER UTAMA</strong> yang diperbolehkan mengonfigurasi pustaka logo toko, mengubah slogan toko, dan mengunggah logo kustom. Silakan beralih ke sesi <strong className="font-extrabold text-indigo-750">Owner Utama</strong> menggunakan panel sesi di sebelah kiri untuk melakukan perubahan.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left & Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left block (Controls) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Core Logo Option Selector */}
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-bl-full pointer-events-none" />
            
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
              1. Pilih Tipe Logo Toko
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={isBlocked}
                onClick={() => handleLogoTypeChange('none')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${
                  logoType === 'none'
                    ? 'border-indigo-500 bg-indigo-50/30 text-indigo-700 font-extrabold shadow-3xs'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                } ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center font-bold text-[10px] bg-white text-slate-400">
                  ∅
                </div>
                <span className="text-[11px] font-bold mt-2">Kertas Polos</span>
                <span className="text-[9px] text-slate-400 mt-0.5 leading-none font-medium">Text Saja</span>
              </button>

              <button
                type="button"
                disabled={isBlocked}
                onClick={() => handleLogoTypeChange('preset')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${
                  logoType === 'preset'
                    ? 'border-indigo-500 bg-indigo-50/30 text-indigo-700 font-extrabold shadow-3xs'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                } ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white text-indigo-500">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-[11px] font-bold mt-2">Pustaka Bawaan</span>
                <span className="text-[9px] text-slate-400 mt-0.5 leading-none font-medium">Tersedia 5 Varian</span>
              </button>

              <button
                type="button"
                disabled={isBlocked}
                onClick={() => handleLogoTypeChange('custom')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${
                  logoType === 'custom'
                    ? 'border-indigo-500 bg-indigo-50/30 text-indigo-700 font-extrabold shadow-3xs'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                } ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white text-emerald-500 relative">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  {customUrl && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-[11px] font-bold mt-2">Unggah Kustom</span>
                <span className="text-[9px] text-slate-400 mt-0.5 leading-none font-medium">PNG / JPG Luar</span>
              </button>
            </div>
          </div>

          {/* Logo Presets Selection block */}
          {logoType === 'preset' && (
            <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                2. Pilih Desain Pustaka Bawaan (Jersey Athletics)
              </h3>

              <div className="space-y-2.5">
                {LOGO_PRESETS.map((p) => {
                  const isSelected = presetKey === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => handlePresetSelect(p.key)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/20 shadow-4xs'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      } ${isBlocked ? 'opacity-55 cursor-not-allowed' : ''}`}
                    >
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                        {p.svg("w-8 h-8 text-indigo-600")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-extrabold ${isSelected ? 'text-indigo-900 font-extrabold' : 'text-slate-850'}`}>
                            {p.name}
                          </p>
                          {isSelected && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-indigo-100">
                              <Check className="w-2.5 h-2.5" />
                              Terpilih
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">{p.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Upload Block */}
          {logoType === 'custom' && (
            <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                2. Unggah Logo Toko Anda Sendiri
              </h3>

              {/* Drag and Drop Region */}
              <div
                onDragEnter={isBlocked ? undefined : handleDrag}
                onDragOver={isBlocked ? undefined : handleDrag}
                onDragLeave={isBlocked ? undefined : handleDrag}
                onDrop={isBlocked ? undefined : handleDrop}
                onClick={isBlocked ? undefined : clickFileUpload}
                className={`relative border-2 border-dashed rounded-3xl p-7 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  dragActive ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                } ${isBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isBlocked}
                />

                {customUrl ? (
                  <div className="space-y-3.5 w-full flex flex-col items-center">
                    <div className="relative p-2.5 bg-white rounded-2xl shadow-md border border-slate-100 max-w-[120px]">
                      <img
                        src={customUrl}
                        alt="Logo Pratinjau"
                        className="max-h-20 object-contain mx-auto rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      {!isBlocked && (
                        <button
                          type="button"
                          onClick={deleteCustomLogo}
                          className="absolute -top-2 -right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full border-none cursor-pointer transition shadow hover:scale-105"
                          title="Hapus gambar & reset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Logo Kustom Terdeteksi</p>
                      <p className="text-[10px] text-slate-450 mt-1 max-w-xs mx-auto leading-normal">
                        Kop surat akan mencetak logo kustom ini secara eksklusif. Anda dapat mengganti dengan menyeret file baru ke sini.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mx-auto">
                      <Upload className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-normal">
                        Seret &amp; Taruh Logo atau <span className="text-indigo-600 underline">Klik untuk Memilih</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Direkomendasikan format PNG transparan dengan ukuran proporsional (Maksimal 2MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slogan and details form */}
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
              3. Detail Keterangan Kop Surat
            </h3>

            <form onSubmit={handleShopDetailChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide block">Nama Toko Utama</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value.toUpperCase())}
                  disabled={isBlocked}
                  required
                  placeholder="CONTOH: ATHREE STUDIO JAYAPURA"
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4.5 py-3 text-xs text-slate-800 font-bold focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide block">Slogan / Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  value={shopSlogan}
                  onChange={(e) => setShopSlogan(e.target.value)}
                  disabled={isBlocked}
                  required
                  placeholder="Ketik deskripsi layanan di bawah logo..."
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4.5 py-3 text-xs text-slate-800 font-bold focus:outline-none transition leading-relaxed resize-none"
                />
                <p className="text-[10px] text-slate-400">
                  * Keterangan ini otomatis terpasang persis di bawah logo dan judul nama toko pada nota cetak thermal serta A4.
                </p>
              </div>

              {!isBlocked && (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition cursor-pointer border-none shadow-md shadow-indigo-600/10"
                >
                  <Save className="w-4 h-4" />
                  Simpan Detail Keterangan
                </button>
              )}
            </form>
          </div>

          {/* Theme Settings Panel */}
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
              4. Mode Tampilan Aplikasi (Theme)
            </h3>
            
            <p className="text-xs text-slate-500 font-medium">
              Ubah tema warna antarmuka aplikasi antara Mode Terang (Light Mode) dan Mode Gelap (Dark Mode) untuk kenyamanan pandangan mata Anda selama mengoperasikan kasir.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Light Mode Button Option */}
              <button
                type="button"
                onClick={() => setTheme && setTheme('light')}
                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50/20 text-indigo-900 font-black shadow-3xs'
                    : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                  theme === 'light' ? 'bg-indigo-500/10 text-indigo-650' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black">Mode Terang (Light)</p>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-medium"> Default Bersih &amp; Kontras </p>
                </div>
              </button>

              {/* Dark Mode Button Option */}
              <button
                type="button"
                onClick={() => setTheme && setTheme('dark')}
                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50/20 text-indigo-900 font-black shadow-3xs'
                    : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                  theme === 'dark' ? 'bg-indigo-500/10 text-indigo-600 dark:text-amber-300' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black">Mode Gelap (Dark)</p>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-medium"> Nyaman di Ruang Rendah Cahaya </p>
                </div>
              </button>
            </div>
          </div>

          {/* Wallpaper Login Settings Panel */}
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              5. Wallpaper Tampilan Awal Login
            </h3>
            
            <p className="text-xs text-slate-500 font-medium">
              Unggah file gambar wallpaper untuk halaman utama Login masuk sistem. Dimensi gambar akan diatur secara otomatis agar penuh dan pas di seluruh resolusi layar perangkat Anda (Responsif &amp; Full Screen).
            </p>

            {/* Drag & Drop Upload Zone for Wallpaper */}
            <div className="space-y-4">
              <input
                type="file"
                ref={wallpaperInputRef}
                onChange={handleWallpaperFileChange}
                accept="image/*"
                className="hidden"
                id="wallpaper-upload-input"
              />

              <div
                onDragEnter={handleWallpaperDrag}
                onDragOver={handleWallpaperDrag}
                onDragLeave={handleWallpaperDrag}
                onDrop={handleWallpaperDrop}
                onClick={() => !isBlocked && wallpaperInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] ${
                  isBlocked ? 'bg-slate-50 border-slate-200 cursor-not-allowed' :
                  wallpaperDragActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-indigo-150 hover:border-indigo-500 bg-slate-50/30'
                }`}
              >
                {loginWallpaper ? (
                  <div className="w-full h-full absolute inset-0 group">
                    <img
                      src={loginWallpaper}
                      alt="Wallpaper Login"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-2">
                      <p className="text-white text-xs font-black uppercase tracking-wider">Ganti Wallpaper</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWallpaper(e);
                        }}
                        className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition border-none shadow-md"
                      >
                        Hapus Wallpaper
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl border border-indigo-100">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Seret &amp; Taruh Wallpaper</p>
                      <p className="text-[10px] text-indigo-600 font-extrabold mt-0.5 underline">
                        atau klik untuk memilih file dari perangkat Anda
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">
                        Disarankan file berupa 16:9 Landscape (Max 4.5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {loginWallpaper && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-extrabold">Wallpaper login kustom sedang aktif.</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => deleteWallpaper(e)}
                    className="text-[10.5px] font-black text-rose-600 hover:text-rose-700 hover:underline border-none bg-transparent cursor-pointer"
                  >
                    Hapus &amp; Reset ke Bawaan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bank Accounts Management Block */}
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
              <CreditCard className="w-4 h-4 text-indigo-500" />
              5. Kelola Pilihan Rekening Bank Toko
            </h3>
            
            <p className="text-xs text-slate-500 font-medium">
              Kelola daftar bank, nomor rekening, dan nama pemilik rekening toko di bawah ini. Daftar ini akan ditampilkan di nota pelanggan dan memandu pembayaran via Transfer Bank.
            </p>

            {/* List of existing accounts */}
            <div className="space-y-2">
              {bankAccounts.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-450 font-bold">Belum ada rekening bank terdaftar</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                    Silakan tambahkan nomor rekening di bawah agar kasir dapat membagikannya kepada pelanggan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {bankAccounts.map((acc) => (
                    <div key={acc.id} className="p-3.5 bg-gradient-to-br from-indigo-50/10 to-indigo-50/30 dark:from-slate-850 dark:to-slate-800 rounded-2xl border border-indigo-100/60 dark:border-slate-750 flex justify-between items-start gap-2 relative overflow-hidden group">
                      <div className="space-y-1 relative z-10">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {acc.bankName}
                        </span>
                        <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-200 tracking-tight pt-1">
                          {acc.accountNumber}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          a/n {acc.accountOwner}
                        </div>
                      </div>
                      
                      {!isBlocked && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBankAccount(acc.id, `${acc.bankName} - ${acc.accountNumber}`)}
                          className="p-1.5 hover:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border-none cursor-pointer self-start relative z-10"
                          title="Hapus Rekening"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Bank Account Form */}
            {!isBlocked && (
              <form onSubmit={handleAddBankAccount} className="bg-slate-50/60 dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-750 space-y-3.5">
                <p className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider block border-b border-slate-200/50 pb-1.5">
                  ➕ Tambah Akun Rekening Baru
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Nama Bank</label>
                    <input
                      type="text"
                      placeholder="CONTOH: BCA, MANDIRI"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      required
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs font-extrabold focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block">No Rekening</label>
                    <input
                      type="text"
                      placeholder="No. Rekening"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                      required
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs font-extrabold focus:outline-none text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Nama Pemilik (a/n)</label>
                    <input
                      type="text"
                      placeholder="Nama di Rekening"
                      value={newAccountOwner}
                      onChange={(e) => setNewAccountOwner(e.target.value)}
                      required
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs font-extrabold focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Simpan Rekening Baru
                </button>
              </form>
            )}
          </div>

          {/* Sales Agents Management Block */}
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
              <Users className="w-4 h-4 text-indigo-500" />
              6. Kelola Daftar Sales Resmi Toko
            </h3>
            
            <p className="text-xs text-slate-500 font-medium">
              Kelola database partner / Sales Agent resmi yang bernaung di bawah studio. Hanya Sales dengan kode terdaftar yang akan diizinkan dalam input Nota Pemesanan untuk menjamin integritas data komisi/kinerja.
            </p>

            {/* List of existing sales agents */}
            <div className="space-y-2">
              {salesAgents.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-455 font-bold">Belum ada Sales terdaftar</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                    Silakan masukkan sales resmi pertama Anda menggunakan formulir di bawah.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {salesAgents.map((agent) => {
                    const isEditing = editingAgentCode === agent.code;
                    return (
                      <div key={agent.code} className={`p-3 rounded-2xl border transition ${
                        isEditing 
                          ? 'bg-indigo-50/70 border-indigo-200 shadow-xs col-span-full' 
                          : 'bg-slate-50/60 hover:bg-slate-100 border-slate-100/80 flex justify-between items-center gap-2 relative group text-left'
                      }`}>
                        {isEditing ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 w-full text-left">
                            <div className="space-y-1 sm:w-1/4">
                              <label className="text-[9px] font-black text-indigo-700 uppercase tracking-wide">Kode Sales</label>
                              <input 
                                type="text" 
                                value={editingNewCode} 
                                onChange={(e) => setEditingNewCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))} 
                                className="w-full bg-white border border-indigo-200 focus:border-indigo-600 rounded-xl px-2.5 py-1 text-xs font-black uppercase text-slate-800 font-mono focus:outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1 flex-1">
                              <label className="text-[9px] font-black text-indigo-700 uppercase tracking-wide">Nama Sales</label>
                              <input 
                                type="text" 
                                value={editingAgentName} 
                                onChange={(e) => setEditingAgentName(e.target.value)} 
                                className="w-full bg-white border border-indigo-200 focus:border-indigo-600 rounded-xl px-2.5 py-1 text-xs font-black text-slate-800 focus:outline-none"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-1.5 sm:mb-0.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleSaveEditSales(agent.code)}
                                className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition cursor-pointer border-none"
                                title="Simpan Perubahan"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditSales}
                                className="p-1 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1 transition cursor-pointer border-none"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="text-[10px] font-black text-indigo-700 bg-indigo-55/60 px-2 py-0.5 rounded-lg inline-block uppercase tracking-wider font-mono">
                                {agent.code}
                              </div>
                              <div className="text-xs font-black text-slate-800 truncate pt-1 tracking-tight">
                                {agent.name}
                              </div>
                            </div>
                            
                            {!isBlocked && (
                              <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditSales(agent)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition border-none cursor-pointer shrink-0"
                                  title="Edit Sales"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSalesAgent(agent.code, agent.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border-none cursor-pointer shrink-0"
                                  title="Hapus Sales"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Sales Agent Form */}
            {!isBlocked && (
              <form onSubmit={handleAddSalesAgent} className="bg-slate-50/60 p-4.5 rounded-2xl border border-slate-100 space-y-3.5">
                <p className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider block border-b border-slate-200/50 pb-1.5 flex items-center gap-1.5">
                  <span>👤 Tambah Partner / Sales Agent Baru</span>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-700 uppercase tracking-wide block">Kode Sales (Unik &amp; Singkat)</label>
                    <input
                      type="text"
                      placeholder="CONTOH: SL-01, DEWI, RUDI"
                      value={newSalesCode}
                      onChange={(e) => setNewSalesCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      required
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-extrabold uppercase focus:outline-none text-slate-800 font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-700 uppercase tracking-wide block">Nama Lengkap Sales</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dewi Lestari"
                      value={newSalesName}
                      onChange={(e) => setNewSalesName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-extrabold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="py-2 px-5 bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition cursor-pointer border-none flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Daftarkan Sales Resmi
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* CARD: GANTI PASSWORD USER KASIR & OWNER */}
            <div className="bg-white border border-indigo-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    Manajemen Kata Sandi Keamanan
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Ubah sandi login untuk kredensial Kasir dan Owner</p>
                </div>
              </div>

              {userRole !== 'OWNER' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-800 uppercase text-left">AKSES TERBATAS</h4>
                    <p className="text-[10.5px] text-amber-700/90 font-bold mt-1 leading-normal text-left">
                      Hanya akun <span className="font-extrabold text-amber-900">OWNER UTAMA</span> yang dapat merubah kata sandi user Kasir dan Owner. Akun Kasir saat ini hanya berwenang untuk membaca konfigurasi saja.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdatePasswordsSubmit} className="space-y-4">
                  {passSuccessMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-xs font-extrabold animate-bounce">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passSuccessMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {/* INPUT: KASIR PASSWORD */}
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black uppercase text-indigo-700 tracking-wider block">Kata Sandi Baru Kasir</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Sandi Kasir baru"
                          value={newKasirPassword}
                          onChange={(e) => setNewKasirPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-indigo-50/50 focus:border-indigo-400 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-850 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* INPUT: OWNER PASSWORD */}
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black uppercase text-indigo-700 tracking-wider block">Kata Sandi Baru Owner</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Sandi Owner baru"
                          value={newOwnerPassword}
                          onChange={(e) => setNewOwnerPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-indigo-50/50 focus:border-indigo-400 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-850 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPass}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/10"
                  >
                    <Save className="w-4 h-4" />
                    {isUpdatingPass ? 'Mengamankan Sandi Baru...' : 'Perbarui Semua Sandi Akses!'}
                  </button>
                </form>
              )}
            </div>

            {/* CARD: RESET DATA PILIHAN */}
            <div className="bg-white border border-indigo-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    Reset & Bersihkan Data Toko
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Hapus data stok atau daftar nota untuk memulai lapor ulang/real-time baru</p>
                </div>
              </div>

              {userRole !== 'OWNER' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-800 uppercase text-left">AKSES TERBATAS</h4>
                    <p className="text-[10.5px] text-amber-700/90 font-bold mt-1 leading-normal text-left">
                      Hanya akun <span className="font-extrabold text-amber-900">OWNER UTAMA</span> yang dapat melakukan reset data toko.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-1">
                  {/* 1. RESET STOK BARANG */}
                  <div className="border border-slate-105 dark:border-slate-800 bg-slate-50/40 p-4.5 rounded-2xl space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-tight">
                        <Package className="w-4 h-4 text-indigo-505" />
                        1. Stok Barang
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-bold leading-normal">
                        Menghapus produk terdaftar, sisa stok, modal beli, dan riwayat mutasi masuk/keluar produk.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        id="btn-reset-stok-empty"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin MENGOSONGKAN seluruh data stok barang? Semua data produk saat ini akan dihapus secara permanen.')) {
                            onResetStokBarang?.('EMPTY');
                            alert('Data stok barang berhasil dikosongkan!');
                          }
                        }}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-105 text-rose-700 font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer border border-rose-200 transition text-center"
                      >
                        Kosongkan Semua Stok
                      </button>
                      <button
                        type="button"
                        id="btn-reset-stok-preset"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin mengembalikan data produk ke template bawaan?')) {
                            onResetStokBarang?.('PRESET');
                            alert('Data produk berhasil direset ke daftar simulasi!');
                          }
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer border border-slate-200 transition text-center"
                      >
                        Setel ke Template Bawaan
                      </button>
                    </div>
                  </div>

                  {/* 2. RESET DAFTAR NOTA PEMBAYARAN */}
                  <div className="border border-slate-105 dark:border-slate-800 bg-slate-50/40 p-4.5 rounded-2xl space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-tight">
                        <Receipt className="w-4 h-4 text-indigo-505" />
                        2. Daftar Nota
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-bold leading-normal">
                        Menghapus seluruh invoice transaksi, piutang, DP masuk, pelunasan, mutasi kas, dan laporan kriteria sales.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        id="btn-reset-nota-empty"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin MENGOSONGKAN seluruh riwayat nota penjualan? Tindakan ini akan mengosongkan laci kas lunas.')) {
                            onResetDaftarNota?.('EMPTY');
                            alert('Daftar nota pembayaran berhasil dikosongkan!');
                          }
                        }}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-105 text-rose-700 font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer border border-rose-200 transition text-center"
                      >
                        Kosongkan Semua Nota
                      </button>
                      <button
                        type="button"
                        id="btn-reset-nota-preset"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin mengembalikan daftar nota pembayaran ke template bawaan?')) {
                            onResetDaftarNota?.('PRESET');
                            alert('Daftar nota berhasil direset ke data simulasi!');
                          }
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer border border-slate-200 transition text-center"
                      >
                        Setel ke Template Bawaan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Right block (Mock Print Receipt Preview Box) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                Pratinjau Hasil Cetakan
              </span>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Kertas Putih A4
              </span>
            </div>

            {/* High fidelity simulation card of top receipt section */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm font-sans space-y-5 text-slate-800 relative overflow-hidden" id="high-fidelity-shop-logo-simulation">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200" />
              
              {/* Receipt Identity Header */}
              <div className="flex flex-col items-center text-center pb-5 border-b border-dashed border-slate-200 space-y-2.5">
                
                {/* Logo insertion */}
                {logoType !== 'none' ? (
                  <div className="p-1 px-2.5 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <LogoRenderer
                      logoType={logoType}
                      presetKey={presetKey}
                      customUrl={customUrl}
                      className="w-12 h-12 text-indigo-600"
                    />
                  </div>
                ) : (
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 px-3 py-1 rounded bg-slate-50">
                    (Logo Dinonaktifkan)
                  </div>
                )}

                {/* Typography details */}
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                    {shopName || 'ATHREE STUDIO JAYAPURA'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-bold max-w-xs mx-auto leading-normal">
                    {shopSlogan || 'Studio Printing, Custom Apparel, Sablon Jersey Premium & Digital Printing Terpercaya.'}
                  </p>
                </div>

                <div className="text-[9px] text-slate-400 flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 font-bold pt-1 border-t border-slate-100 max-w-sm w-full">
                  <span>📍 JL. Raya Tanah Hitam, Jayapura</span>
                  <span>•</span>
                  <span>📱 WA: +62 812-4567-890</span>
                </div>
              </div>

              {/* Sample receipt middle segment to complete context */}
              <div className="space-y-3 opacity-45 select-none text-[10.5px] font-bold font-mono">
                <div className="flex justify-between border-b pb-1.5 border-slate-100">
                  <span>NOTA NO: #029</span>
                  <span>TANGGAL: 16 Juni 2026</span>
                </div>
                
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>1x Jersey Custom (Sandalwood S)</span>
                    <span>Rp 185.000</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black border-t border-dashed pt-1.5 border-slate-200">
                    <span>TOTAL BAYAR</span>
                    <span>Rp 185.000</span>
                  </div>
                </div>
              </div>

              {/* Live Preview hint stamp */}
              <div className="text-center pt-2.5">
                <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                  * Pratinjau di atas dinamis mengikuti opsi pengaturan sebelah kiri. Coba ganti preset logo atau slogan, lalu klik cetak di bagian bawah nota untuk membuktikannya!
                </p>
              </div>

            </div>

            {/* Quick action helper card */}
            <div className="bg-indigo-50/40 border border-indigo-100/70 p-4.5 rounded-2xl space-y-2">
              <h5 className="text-[11px] font-black text-indigo-855 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                Cara Pembuktian Cetakan:
              </h5>
              <ol className="text-[10px] text-indigo-700/90 list-decimal list-inside space-y-1 font-bold leading-normal">
                <li>Atur logo toko sesuka Anda di halaman ini</li>
                <li>Pilih tab <span className="text-indigo-900 font-extrabold cursor-pointer hover:underline" onClick={() => setActiveTab?.('daftar-nota')}>'Daftar Nota Pembayaran'</span></li>
                <li>Klik tombol cetak atau lihat nota pada salah satu baris</li>
                <li>Klik tombol <span className="text-indigo-900 font-extrabold">'Cetak Nota atau Pilih Printer'</span> di bagian bawah</li>
                <li>Kop surat di lembaran cetak akan otomatis terpasang dengan logo baru Anda!</li>
              </ol>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
