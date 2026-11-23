import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileCheck,
  Settings,
  FileSpreadsheet,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { AdminRole } from '../types';
import { ConnectionState } from './ConnectionStatusNotification';

export type NavTab =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'leave'
  | 'settings'
  | 'reports';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  role: AdminRole;
  pendingLeavesCount?: number;
  todayAbsentCount?: number;
  connection?: ConnectionState;
  onOpenConnectionDetails?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  role,
  pendingLeavesCount = 0,
  todayAbsentCount = 0,
  connection,
  onOpenConnectionDetails,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Ringkasan & statistik',
    },
    {
      id: 'employees' as NavTab,
      label: 'Data Pegawai',
      icon: Users,
      badge: null,
      description: 'Guru & Tenaga TU',
    },
    {
      id: 'attendance' as NavTab,
      label: 'Absensi Hari Ini',
      icon: CalendarCheck,
      badge: todayAbsentCount > 0 ? `${todayAbsentCount} Belum` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Real-time kehadiran & peta',
    },
    {
      id: 'leave' as NavTab,
      label: 'Persetujuan Izin',
      icon: FileCheck,
      badge: pendingLeavesCount > 0 ? String(pendingLeavesCount) : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
      description: 'Izin, Sakit & Dinas',
    },
    {
      id: 'reports' as NavTab,
      label: 'Laporan Rekap',
      icon: FileSpreadsheet,
      badge: null,
      description: 'Excel & Cetak PDF Kop',
    },
    {
      id: 'settings' as NavTab,
      label: 'Pengaturan',
      icon: Settings,
      badge: null,
      description: 'Jam, GPS, WhatsApp API',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-700/80 border border-emerald-400/40 p-1 flex items-center justify-center shadow-inner">
              <div className="w-full h-full rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-widest text-emerald-300 uppercase block">
                ADMIN ABSEN
              </span>
              <h2 className="text-sm font-extrabold text-white tracking-tight leading-tight">
                SDIT AL IZZAH
              </h2>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wide">
                POHUWATO, GORONTALO
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Motto / Islamic Tagline */}
        <div className="px-5 py-2.5 bg-emerald-800/40 border-b border-emerald-800/30 flex items-center gap-2 text-[11px] text-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate italic">Generasi Qur'ani, Berakhlak & Berprestasi</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-emerald-400/80 uppercase">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-emerald-300 group-hover:text-emerald-100'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium tracking-tight truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs ${
                          item.badgeColor || 'bg-emerald-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] block truncate ${
                      isActive ? 'text-emerald-100' : 'text-emerald-400/70'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Role Notice & School Badge Footer */}
        <div className="p-4 border-t border-emerald-800/60 bg-emerald-950/60">
          <div className="bg-emerald-900/60 rounded-xl p-3 border border-emerald-700/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-300 uppercase">
                Peran Pengguna
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  role === 'Operator'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
              >
                {role}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              {role === 'Operator'
                ? 'Hak akses penuh: Kelola data pegawai, jam, dan persetujuan izin.'
                : 'Hak akses monitoring: Lihat absensi, pantau kehadiran, dan unduh laporan.'}
            </p>
          </div>

          {/* Notifikasi Status Terhubung Absen SDIT Al Izzah (Biru jika terhubung, Merah jika terputus) */}
          {connection && (
            <button
              type="button"
              onClick={onOpenConnectionDetails}
              className={`w-full mt-3 flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-bold transition-all shadow-xs text-left cursor-pointer ${
                connection.isConnected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400'
                  : 'bg-red-600 hover:bg-red-700 text-white border-red-400 animate-pulse'
              }`}
              title="Klik untuk melihat status koneksi lengkap"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span className="truncate">
                  {connection.isConnected
                    ? 'Terhubung Absen SDIT'
                    : 'Tidak Terhubung Absen SDIT'}
                </span>
              </div>
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-sm bg-white/20 shrink-0">
                {connection.isConnected ? 'BIRU' : 'MERAH'}
              </span>
            </button>
          )}

          <div className="mt-3 text-center text-[10px] text-emerald-400/60">
            <span>SDIT Al Izzah Pohuwato © 2026</span>
          </div>
        </div>
      </aside>
    </>
  );
};
