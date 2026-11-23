import React, { useState, useEffect } from 'react';
import {
  Menu,
  Clock,
  Calendar,
  LogOut,
  ShieldCheck,
  Eye,
  RefreshCw,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { AdminUser } from '../types';
import { ConnectionBadge, ConnectionState } from './ConnectionStatusNotification';

interface HeaderProps {
  currentUser: AdminUser;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onOpenSeedModal?: () => void;
  onOpenAndroidSyncModal?: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  connection?: ConnectionState;
  onOpenConnectionDetails?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onToggleSidebar,
  onOpenSeedModal,
  onOpenAndroidSyncModal,
  onRefreshData,
  isRefreshing,
  connection,
  onOpenConnectionDetails,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format WITA (UTC+8) / Local time
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WITA'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOperator = currentUser.role === 'Operator';

  return (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left section: Hamburger & Title on mobile */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              type="button"
              className="lg:hidden p-2 rounded-lg text-emerald-800 hover:bg-emerald-50 focus:outline-hidden"
              aria-label="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase hidden sm:block">
                Sistem Presensi Kepegawaian
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="text-emerald-700">SDIT Al Izzah</span> Pohuwato
              </h1>
            </div>
          </div>

          {/* Center section: Live Clock & Calendar */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-100/80 px-3 py-1.5 rounded-full text-emerald-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-xs sm:text-sm">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-slate-800 font-mono text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{timeStr}</span>
            </div>
          </div>

          {/* Right section: Connection Status (Blue/Red), Android Sync, Role badge, and User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Notifikasi Terhubung dengan Absen SDIT Al Izzah (Biru jika terhubung, Merah jika terputus) */}
            {connection && (
              <ConnectionBadge
                connection={connection}
                onOpenDetails={onOpenConnectionDetails || (() => {})}
              />
            )}

            {/* Android com.aistudio.absensdit.pohuwato Sync Badge */}
            {onOpenAndroidSyncModal && (
              <button
                onClick={onOpenAndroidSyncModal}
                title="Status Sinkronisasi dengan aplikasi Android com.aistudio.absensdit.pohuwato"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono text-[11px] hidden lg:inline">
                  com.aistudio.absensdit.pohuwato
                </span>
                <span className="font-semibold text-[11px] lg:hidden">Android Sync</span>
              </button>
            )}

            {onRefreshData && (
              <button
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Sinkronkan data dengan Firebase"
                className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            )}

            {onOpenSeedModal && (
              <button
                onClick={onOpenSeedModal}
                title="Muat Data Awal SDIT Al Izzah"
                className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data Awal</span>
              </button>
            )}

            {/* Role Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOperator
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}
            >
              {isOperator ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-blue-700" />
              )}
              <span className="hidden sm:inline">{currentUser.role}</span>
              <span className="sm:hidden">{currentUser.role === 'Operator' ? 'Operator' : 'Kepsek'}</span>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[130px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentUser.role === 'Operator' ? 'Kelola Data' : 'Lihat Saja'}
                </span>
              </div>

              <button
                onClick={onLogout}
                title="Keluar dari akun admin"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
