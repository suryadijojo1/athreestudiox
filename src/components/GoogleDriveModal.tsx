import React, { useState, useEffect } from 'react';
import { 
  googleDriveSignIn, 
  googleDriveLogout, 
  initDriveAuth, 
  getDriveAccessToken, 
  uploadBackupToGoogleDrive, 
  listDriveBackups, 
  downloadDriveBackup, 
  DriveBackupFile 
} from '../lib/googleDrive';
import { User } from 'firebase/auth';
import { X, Cloud, CloudUpload, CloudDownload, RefreshCw, LogOut, CheckCircle2, AlertCircle, FileText, HardDrive } from 'lucide-react';
import { Product, Invoice, StockMovement, AuditLog } from '../types';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  products,
  invoices,
  auditLogs
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<DriveBackupFile[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsConnected(!!token);
        if (token) {
          fetchDriveFiles();
        }
      },
      () => {
        setCurrentUser(null);
        setIsConnected(false);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchDriveFiles = async () => {
    setLoading(true);
    try {
      const files = await listDriveBackups();
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: err.message || 'Gagal memuat berkas Google Drive.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const result = await googleDriveSignIn();
      if (result) {
        setCurrentUser(result.user);
        setIsConnected(true);
        setStatusMsg({ text: `Berhasil terhubung dengan akun Google: ${result.user.email}`, type: 'success' });
        await fetchDriveFiles();
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: 'Gagal menghubungkan Google Drive. Pastikan pop-up diperbolehkan.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleDriveLogout();
      setCurrentUser(null);
      setIsConnected(false);
      setDriveFiles([]);
      setStatusMsg({ text: 'Terputus dari Google Drive.', type: 'info' });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUploadBackup = async () => {
    if (!isConnected) return;
    setLoading(true);
    setStatusMsg(null);

    try {
      const localProducts = localStorage.getItem('nota_stok_products') ? JSON.parse(localStorage.getItem('nota_stok_products')!) : products;
      const localInvoices = localStorage.getItem('nota_stok_invoices') ? JSON.parse(localStorage.getItem('nota_stok_invoices')!) : invoices;
      const localMovements = localStorage.getItem('nota_stok_movements') ? JSON.parse(localStorage.getItem('nota_stok_movements')!) : [];
      const localAuditLogs = localStorage.getItem('nota_stok_audit_logs') ? JSON.parse(localStorage.getItem('nota_stok_audit_logs')!) : auditLogs;

      const backupObject = {
        backupVersion: "1.0",
        exportedAt: new Date().toISOString(),
        shopName: "ATHREE STUDIO JAYAPURA",
        data: {
          products: localProducts,
          invoices: localInvoices,
          movements: localMovements,
          auditLogs: localAuditLogs
        }
      };

      const nowStr = new Date().toISOString().split('T')[0];
      const fileName = `cadangan_sistem_pos_jersey_${nowStr}_${Date.now()}.json`;

      const result = await uploadBackupToGoogleDrive(backupObject, fileName);
      setStatusMsg({ 
        text: `Berhasil mengunggah cadangan "${result.name}" ke Google Drive Anda!`, 
        type: 'success' 
      });
      await fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: err.message || 'Gagal menyimpan ke Google Drive.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFile = async (file: DriveBackupFile) => {
    const confirm = window.confirm(
      `Apakah Anda yakin ingin memulihkan/mengimpor data cadangan dari Google Drive ini?\n\n` +
      `📁 Berkas: ${file.name}\n` +
      `⏰ Tanggal Dibuat: ${new Date(file.createdTime).toLocaleString('id-ID')}\n\n` +
      `Data transaksi dan stok di browser akan diperbarui dari berkas ini.`
    );
    if (!confirm) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await downloadDriveBackup(file.id);
      const content = data.data || data;

      if (!content || (!content.invoices && !content.products)) {
        alert("Format berkas cadangan dari Google Drive tidak valid!");
        return;
      }

      if (content.products && Array.isArray(content.products)) {
        localStorage.setItem('nota_stok_products', JSON.stringify(content.products));
      }
      if (content.invoices && Array.isArray(content.invoices)) {
        localStorage.setItem('nota_stok_invoices', JSON.stringify(content.invoices));
      }
      if (content.movements && Array.isArray(content.movements)) {
        localStorage.setItem('nota_stok_movements', JSON.stringify(content.movements));
      }
      if (content.auditLogs && Array.isArray(content.auditLogs)) {
        localStorage.setItem('nota_stok_audit_logs', JSON.stringify(content.auditLogs));
      }

      alert("Berhasil memulihkan data dari Google Drive! Halaman akan dimuat ulang.");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: err.message || 'Gagal memulihkan berkas dari Google Drive.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Integrasi Google Drive
              </h2>
              <p className="text-xs text-slate-400">
                Simpan dan pulihkan cadangan nota & stok langsung dari Google Drive Anda
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {statusMsg && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${
              statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
              statusMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
              'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}>
              {statusMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
              {statusMsg.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />}
              {statusMsg.type === 'info' && <Cloud className="w-5 h-5 shrink-0 text-blue-400" />}
              <div className="flex-1 font-medium">{statusMsg.text}</div>
            </div>
          )}

          {/* Account Status */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-500'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Koneksi</p>
                <p className="text-sm font-bold text-white">
                  {isConnected ? (currentUser?.email || 'Terhubung ke Google Drive') : 'Belum Terhubung'}
                </p>
              </div>
            </div>

            {isConnected ? (
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Putuskan Akun
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 bg-white rounded-full p-0.5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                Sign in dengan Google Drive
              </button>
            )}
          </div>

          {/* Action Cards */}
          {isConnected && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/30 p-5 border border-slate-800 rounded-2xl">
                <div>
                  <h3 className="font-bold text-sm text-white">Unggah Cadangan Baru</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Simpan salinan data nota, stok produk, dan log sistem saat ini ke Google Drive Anda
                  </p>
                </div>
                <button
                  onClick={handleUploadBackup}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-900/30 transition-all shrink-0 cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" />
                  Simpan ke Drive
                </button>
              </div>

              {/* Drive Files List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Daftar Cadangan di Google Drive
                  </h3>
                  <button
                    onClick={fetchDriveFiles}
                    disabled={loading}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Refresh berkas"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                </div>

                {driveFiles.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-400 text-xs">
                    {loading ? 'Memuat daftar berkas cadangan...' : 'Belum ada berkas cadangan di Google Drive Anda. Klik "Simpan ke Drive" untuk membuat baru.'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {driveFiles.map((file) => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-xs font-bold text-slate-200 truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(file.createdTime).toLocaleString('id-ID')}
                            {file.size && ` • ${Math.round(Number(file.size) / 1024)} KB`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestoreFile(file)}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer"
                        >
                          <CloudDownload className="w-3.5 h-3.5" />
                          Pulihkan
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
