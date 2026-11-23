import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AdminRole, AdminUser } from '../types';
import { ConnectionBadge, ConnectionState } from './ConnectionStatusNotification';

interface LoginModalProps {
  onLoginSuccess: (user: AdminUser) => void;
  connection?: ConnectionState;
  onOpenConnectionDetails?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  connection,
  onOpenConnectionDetails,
}) => {
  const [email, setEmail] = useState<string>('operator@alizzah.sch.id');
  const [password, setPassword] = useState<string>('operator123');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('Operator');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan email dan kata sandi admin.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials
      let user: AdminUser;

      if (selectedRole === 'Kepala Sekolah') {
        user = {
          id: 'admin-kepsek-01',
          email: email.toLowerCase(),
          name: 'Ustadz Ahmad Al-Farisi, S.Pd.I., M.Pd.',
          role: 'Kepala Sekolah',
          nip: '19840512 201001 1 008',
        };
      } else {
        user = {
          id: 'admin-operator-01',
          email: email.toLowerCase(),
          name: 'Siti Rahmawati, S.Kom.',
          role: 'Operator',
          nip: '19920815 201903 2 014',
        };
      }

      setIsLoading(false);
      onLoginSuccess(user);
    }, 400);
  };

  const handleQuickLogin = (role: AdminRole) => {
    if (role === 'Kepala Sekolah') {
      setEmail('kepsek@alizzah.sch.id');
      setPassword('kepsek123');
      setSelectedRole('Kepala Sekolah');
      onLoginSuccess({
        id: 'admin-kepsek-01',
        email: 'kepsek@alizzah.sch.id',
        name: 'Ustadz Ahmad Al-Farisi, S.Pd.I., M.Pd.',
        role: 'Kepala Sekolah',
        nip: '19840512 201001 1 008',
      });
    } else {
      setEmail('operator@alizzah.sch.id');
      setPassword('operator123');
      setSelectedRole('Operator');
      onLoginSuccess({
        id: 'admin-operator-01',
        email: 'operator@alizzah.sch.id',
        name: 'Siti Rahmawati, S.Kom.',
        role: 'Operator',
        nip: '19920815 201903 2 014',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative Islamic Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-200/60 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-7 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-600/30 rounded-full blur-2xl" />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shadow-lg mb-3">
            <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-emerald-800">
              <GraduationCap className="w-8 h-8 text-emerald-700" />
            </div>
          </div>

          <h2 className="text-xs font-bold tracking-widest text-emerald-300 uppercase">
            Sistem Informasi Presensi
          </h2>
          <h1 className="text-xl font-extrabold tracking-tight text-white mt-1">
            SDIT AL IZZAH POHUWATO
          </h1>
          <p className="text-xs text-emerald-200/90 mt-1">
            Portal Administrasi Presensi Guru & Tenaga Kependidikan
          </p>

          {/* Notifikasi Status Koneksi (Biru jika terhubung, Merah jika tidak) */}
          {connection && (
            <div className="mt-3.5 flex justify-center">
              <ConnectionBadge
                connection={connection}
                onOpenDetails={onOpenConnectionDetails || (() => {})}
                compact={false}
              />
            </div>
          )}
        </div>

        {/* Login Form Container */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Peran Masuk:
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Operator');
                  setEmail('operator@alizzah.sch.id');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  selectedRole === 'Operator'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Operator (Kelola)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Kepala Sekolah');
                  setEmail('kepsek@alizzah.sch.id');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  selectedRole === 'Kepala Sekolah'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Kepsek (Lihat)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 text-center">
              {selectedRole === 'Operator'
                ? 'Hak akses Operator: Kelola data pegawai, jam absen, reset HP, persetujuan izin.'
                : 'Hak akses Kepala Sekolah: Pantau dashboard, cek kehadiran real-time & cetak laporan.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Email Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@alizzah.sch.id"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
            </button>
          </form>

          {/* Quick Login Presets for Instant Testing */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Akses Cepat Pengujian:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Operator')}
                className="p-2.5 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Operator</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">
                  Siti Rahmawati
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Kepala Sekolah')}
                className="p-2.5 border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-800 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Kepala Sekolah</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">
                  Ustadz Ahmad Al-Farisi
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-500">
          SDIT Al Izzah Pohuwato • Kab. Pohuwato, Gorontalo
        </div>
      </div>
    </div>
  );
};
