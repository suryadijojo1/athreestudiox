/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AuditLog } from '../types';
import { motion } from 'motion/react';
import { 
  History, 
  Search, 
  Trash2, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  Boxes, 
  Receipt, 
  UserCheck, 
  Shield, 
  Info, 
  AlertTriangle,
  Database,
  Calendar
} from 'lucide-react';

interface HistoriAktivitasProps {
  auditLogs: AuditLog[];
  onClearLogs: () => void;
  userRole: 'KASIR' | 'OWNER';
}

export default function HistoriAktivitas({ auditLogs, onClearLogs, userRole }: HistoriAktivitasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'OWNER' | 'KASIR'>('ALL');
  const [selectedModule, setSelectedModule] = useState<'ALL' | 'NOTA' | 'STOK' | 'SISTEM'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  // Stats calculation
  const stats = useMemo(() => {
    let ownerCount = 0;
    let kasirCount = 0;
    let stockCount = 0;
    let invoiceCount = 0;

    auditLogs.forEach(log => {
      if (log.user === 'OWNER') ownerCount++;
      if (log.user === 'KASIR') kasirCount++;
      if (log.module === 'STOK') stockCount++;
      if (log.module === 'NOTA') invoiceCount++;
    });

    return {
      total: auditLogs.length,
      ownerCount,
      kasirCount,
      stockCount,
      invoiceCount
    };
  }, [auditLogs]);

  // Filtering & Search
  const filteredLogs = useMemo(() => {
    let result = [...auditLogs];

    // Module Filter
    if (selectedModule !== 'ALL') {
      result = result.filter(log => log.module === selectedModule);
    }

    // Role Filter
    if (selectedRole !== 'ALL') {
      result = result.filter(log => log.user === selectedRole);
    }

    // Search query matches description, action type or reference number
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.description.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        (log.referenceNum && log.referenceNum.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'NEWEST') {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    return result;
  }, [auditLogs, selectedModule, selectedRole, searchTerm, sortBy]);

  // Nice UI helper for Log Labels & Colors
  const getActionBadgeDetails = (type: AuditLog['actionType']) => {
    switch (type) {
      case 'CREATE_INVOICE':
        return { label: 'Tulis Nota Baru', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'UPDATE_INVOICE':
        return { label: 'Revisi Nota', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'PAYMENT_SETTLEMENT':
        return { label: 'Pelunasan / Cicilan', bg: 'bg-teal-50 text-teal-700 border-teal-100' };
      case 'DELETE_INVOICE':
        return { label: 'Hapus Nota', bg: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'ADD_PRODUCT':
        return { label: 'Tambah Barang', bg: 'bg-green-50 text-green-700 border-green-100' };
      case 'UPDATE_PRODUCT':
        return { label: 'Edit Info Barang', bg: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'DELETE_PRODUCT':
        return { label: 'Hapus Barang', bg: 'bg-red-50 text-red-700 border-red-100' };
      case 'RESTOCK_PRODUCT':
        return { label: 'Grup Restock', bg: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'BULK_IMPORT':
        return { label: 'Impor CSV Bulky', bg: 'bg-cyan-50 text-cyan-700 border-cyan-100' };
      case 'RESET_SYSTEM':
        return { label: 'Reset Sistem', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
      default:
        return { label: type, bg: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  // Indonesian date formatter helper
  const formatIndoDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const handleClearClick = () => {
    if (userRole !== 'OWNER') {
      alert('Hanya Owner yang memiliki otoritas untuk membersihkan histori aktivitas.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus SELURUH histori aktivitas? Tindakan ini tidak dapat dibatalkan demi keamanan audit.')) {
      onClearLogs();
    }
  };

  return (
    <div className="space-y-6" id="audit-log-panel">
      {/* Visual greeting card / banner */}
      <div 
        className="p-8 rounded-[2.5rem] bg-gradient-to-r from-slate-800 via-indigo-950 to-indigo-900 border-b-4 border-slate-700 shadow-xl relative overflow-hidden text-white"
        id="audit-banner-card"
      >
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 transition rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
            <History className="w-3.5 h-3.5 animate-spin-slow" />
            Audit Logging Engine v1.0
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
            Riwayat Aktivitas &amp; Audit Log
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Menelusuri setiap rekam jejak, perubahan data stok jersey, penulisan nota, mutasi kas, and pembaruan sistem. Dirancang untuk melindungi integritas transaksi kasir di lapangan.
          </p>
        </div>
      </div>

      {/* Bento Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="audit-stats-grid">
        <div className="p-4 bg-white border-2 border-indigo-50 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Entri Log</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-indigo-50/80 text-indigo-600 rounded-xl p-2.5">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-indigo-50 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-purple-600 uppercase font-black tracking-wider">Oleh Owner</span>
            <div className="text-xl font-black text-purple-950 mt-0.5">{stats.ownerCount}</div>
          </div>
          <div className="bg-purple-50 text-purple-600 rounded-xl p-2.5">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-indigo-50 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-amber-600 uppercase font-black tracking-wider">Oleh Kasir</span>
            <div className="text-xl font-black text-amber-950 mt-0.5">{stats.kasirCount}</div>
          </div>
          <div className="bg-amber-50 text-amber-600 rounded-xl p-2.5">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-indigo-50 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-teal-600 uppercase font-black tracking-wider">Mutasi Nota</span>
            <div className="text-xl font-black text-teal-950 mt-0.5">{stats.invoiceCount}</div>
          </div>
          <div className="bg-teal-50 text-teal-600 rounded-xl p-2.5">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Filter and Table Interface */}
      <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-6 shadow-md space-y-6" id="audit-logs-card">
        
        {/* Controls Panel */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kata kunci tindakan atau SKU nomor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border-2 border-indigo-50 hover:border-indigo-100 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition"
              />
            </div>

            {/* Filter Module */}
            <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-indigo-50 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value as any)}
                className="bg-transparent text-xs font-extrabold text-slate-700 outline-none border-none cursor-pointer"
              >
                <option value="ALL">Semua Modul</option>
                <option value="NOTA">Modul Nota</option>
                <option value="STOK">Modul Stok</option>
                <option value="SISTEM">Modul Sistem</option>
              </select>
            </div>

            {/* Filter Operator */}
            <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-indigo-50 px-3 py-1.5 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="bg-transparent text-xs font-extrabold text-slate-700 outline-none border-none cursor-pointer"
              >
                <option value="ALL">Semua Operator</option>
                <option value="OWNER">Owner Saja</option>
                <option value="KASIR">Kasir Saja</option>
              </select>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-indigo-50 px-3 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-extrabold text-slate-700 outline-none border-none cursor-pointer"
              >
                <option value="NEWEST">Terbaru Dahulu</option>
                <option value="OLDEST">Terlama Dahulu</option>
              </select>
            </div>
          </div>

          {/* Action Tools */}
          {userRole === 'OWNER' && (
            <button
              onClick={handleClearClick}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-50 text-rose-700 hover:bg-rose-100/80 active:bg-rose-100 text-xs font-black uppercase tracking-wider rounded-2xl transition border-none cursor-pointer self-start xl:self-auto shrink-0 shadow-sm"
              id="btn-clear-logs"
            >
              <Trash2 className="w-4 h-4" />
              Reset Histori Log
            </button>
          )}
        </div>

        {/* Informational banner */}
        <div className="p-4 bg-indigo-50/30 border border-indigo-50 rounded-2xl text-[11px] text-slate-500 flex items-start gap-2.5 leading-normal">
          <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            Setiap aksi modifikasi database (create, update, delete) akan tersinkronisasi otomatis dengan instansi browser lokal. Otoritas penghapusan log logis hanya dimiliki oleh <strong className="text-indigo-950">pemegang peran Owner</strong> demi asas kepatuhan auditing finansial.
          </div>
        </div>

        {/* Log list table */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-indigo-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-sans">Tanggal &amp; Jam</th>
                  <th className="py-3.5 px-4 font-sans">Modul</th>
                  <th className="py-3.5 px-4 font-sans text-center">Operator</th>
                  <th className="py-3.5 px-4 font-sans">Tindakan</th>
                  <th className="py-3.5 px-4 font-sans">Deskripsi Detail Perubahan</th>
                  <th className="py-3.5 px-4 font-sans">Referensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-sans text-slate-600">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce" />
                        <p>Tidak ada entri audit log yang sesuai dengan filter pencarian Anda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badge = getActionBadgeDetails(log.actionType);
                    return (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-slate-50/50 transition duration-100 ${
                          log.actionType === 'RESET_SYSTEM' ? 'bg-amber-50/10' : ''
                        }`}
                      >
                        {/* ISO string formatting to local */}
                        <td className="py-3 px-4 font-mono text-[10px] whitespace-nowrap text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {formatIndoDate(log.timestamp)}
                        </td>

                        {/* Module name */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${
                            log.module === 'NOTA' 
                              ? 'bg-blue-50 text-blue-700' 
                              : log.module === 'STOK' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {log.module === 'STOK' && <Boxes className="w-2.5 h-2.5" />}
                            {log.module === 'NOTA' && <FileText className="w-2.5 h-2.5" />}
                            {log.module === 'SISTEM' && <Database className="w-2.5 h-2.5" />}
                            {log.module}
                          </span>
                        </td>

                        {/* Who did it */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 font-bold rounded-full text-[9px] ${
                            log.user === 'OWNER' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-orange-100 text-orange-850 border border-orange-200'
                          }`}>
                            {log.user === 'OWNER' ? '👑 OWNER' : '👤 KASIR'}
                          </span>
                        </td>

                        {/* Action Type Tag */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full border font-black ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Message description */}
                        <td className="py-3 px-4 font-semibold text-slate-700 leading-relaxed max-w-xs md:max-w-md">
                          {log.description}
                        </td>

                        {/* SKU or INVOICE reference */}
                        <td className="py-3 px-4 font-mono font-black text-[10px] text-slate-400">
                          {log.referenceNum || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
