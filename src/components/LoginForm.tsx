import React, { useState } from 'react';
import { Lock, Users, Crown, ShieldAlert, Sparkles } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (role: 'KASIR' | 'OWNER') => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [selectedRole, setSelectedRole] = useState<'KASIR' | 'OWNER'>('KASIR');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedRole === 'KASIR') {
      if (password === 'admin') {
        onLoginSuccess('KASIR');
      } else {
        setErrorMsg('Password salah! Untuk Kasir masukkan "admin"');
      }
    } else if (selectedRole === 'OWNER') {
      if (password === 'Owner') {
        onLoginSuccess('OWNER');
      } else {
        setErrorMsg('Password salah! Untuk Owner masukkan "Owner" (perhatikan huruf besar/kecil)');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/75 flex items-center justify-center p-4" id="login-container">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-indigo-100/80 shadow-2xl shadow-indigo-100/40 overflow-hidden transform transition-all duration-300">
        
        {/* Top Header Section */}
        <div className="bg-indigo-600 px-8 py-10 text-white text-center relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-indigo-500/30 rounded-full blur-xl" />
          
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-2xl text-white shadow-inner mb-4">
            A3
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Athree Studio</h2>
          <p className="text-xs text-indigo-100/90 mt-1 font-medium">Sistem Manajemen Nota & Persediaan Stok Gudang</p>
        </div>

        {/* Form Body Section */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              Pilih Hak Akses Anda
            </label>
            
            <div className="grid grid-cols-2 gap-3" id="login-role-selection">
              {/* Option KASIR */}
              <button
                type="button"
                id="login-select-kasir"
                onClick={() => {
                  setSelectedRole('KASIR');
                  setErrorMsg('');
                  setPassword('');
                }}
                className={`py-3.5 px-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  selectedRole === 'KASIR'
                    ? 'border-amber-400 bg-amber-50/20 text-slate-900 shadow-md shadow-amber-100/50'
                    : 'border-indigo-50 hover:border-indigo-100 bg-slate-50/50 text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Users className={`w-5 h-5 ${selectedRole === 'KASIR' ? 'text-amber-500' : 'text-slate-400'}`} />
                  {selectedRole === 'KASIR' && (
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  )}
                </div>
                <span className="block text-xs font-black tracking-wider uppercase">KASIR</span>
                <span className="text-[10px] block opacity-80 mt-0.5">Operasional nota & produksi</span>
              </button>

              {/* Option OWNER */}
              <button
                type="button"
                id="login-select-owner"
                onClick={() => {
                  setSelectedRole('OWNER');
                  setErrorMsg('');
                  setPassword('');
                }}
                className={`py-3.5 px-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  selectedRole === 'OWNER'
                    ? 'border-indigo-600 bg-indigo-50/20 text-slate-900 shadow-md shadow-indigo-100/50'
                    : 'border-indigo-50 hover:border-indigo-100 bg-slate-50/50 text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Crown className={`w-5 h-5 ${selectedRole === 'OWNER' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {selectedRole === 'OWNER' && (
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                  )}
                </div>
                <span className="block text-xs font-black tracking-wider uppercase">OWNER</span>
                <span className="text-[10px] block opacity-80 mt-0.5">Semua fitur & revisi penuh</span>
              </button>
            </div>
          </div>

          {/* Password Input Block */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Password Keamanan</span>
              <span className="font-medium text-[10px] text-slate-400 hover:text-indigo-600 cursor-pointer">
                Petunjuk: {selectedRole === 'KASIR' ? 'admin' : 'Owner'}
              </span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Masukkan password ${selectedRole.toLowerCase()}...`}
                required
                className="w-full bg-slate-50 border-2 border-indigo-50 focus:border-indigo-500 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none transition duration-150"
              />
            </div>
          </div>

          {/* Responsive live feedback error notification banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-750 text-xs font-semibold" id="login-error-banner">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <button
            type="submit"
            id="login-submit-button"
            className={`w-full py-3.5 px-6 font-black rounded-2xl tracking-wider text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition border-none shadow-lg ${
              selectedRole === 'KASIR'
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-amber-200'
                : 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
          >
            Masuk ke Sistem
          </button>
        </form>

        {/* Decal visual footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-indigo-100/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Secure Gatekeeper
          </span>
          <span>© 2026 Athree Studio</span>
        </div>

      </div>
    </div>
  );
}
