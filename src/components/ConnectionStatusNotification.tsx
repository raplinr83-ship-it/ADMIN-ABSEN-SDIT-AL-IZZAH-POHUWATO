import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Server,
  Database,
  ExternalLink,
} from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, getActiveDatabaseId } from '../firebase/config';
import firebaseConfig from '../../firebase-applet-config.json';
import { ANDROID_APP_INFO } from '../services/dataService';

export interface ConnectionState {
  isConnected: boolean;
  latencyMs: number;
  lastChecked: Date;
  isChecking: boolean;
  error?: string | null;
}

// Global connection checker hook
export function useAbsenConnection() {
  const [connection, setConnection] = useState<ConnectionState>({
    isConnected: true, // Optimistic default
    latencyMs: 45,
    lastChecked: new Date(),
    isChecking: false,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setConnection({
        isConnected: false,
        latencyMs: 0,
        lastChecked: new Date(),
        isChecking: false,
        error: 'Perangkat sedang offline (tidak ada jaringan internet).',
      });
      return false;
    }

    setConnection((prev) => ({ ...prev, isChecking: true }));
    const startTime = performance.now();

    try {
      // Force ping to Cloud Firestore server
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      const latency = Math.round(performance.now() - startTime);

      setConnection({
        isConnected: true,
        latencyMs: latency,
        lastChecked: new Date(),
        isChecking: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        try {
          await getDocFromServer(doc(db, 'pengaturan', 'sekolah'));
          const latency = Math.round(performance.now() - startTime);
          setConnection({
            isConnected: true,
            latencyMs: latency,
            lastChecked: new Date(),
            isChecking: false,
            error: null,
          });
          return true;
        } catch (fallbackErr: any) {
          err = fallbackErr;
        }
      }

      const latency = Math.round(performance.now() - startTime);
      const errMsg = err?.message || String(err);
      const isActuallyOffline =
        errMsg.includes('the client is offline') ||
        errMsg.includes('backend') ||
        errMsg.includes('Failed to get document') ||
        errMsg.includes('network') ||
        errMsg.includes('database') ||
        err?.code === 'unavailable' ||
        err?.code === 'permission-denied' ||
        err?.code === 'not-found' ||
        err?.code === 'unauthenticated' ||
        err?.code === 'failed-precondition';

      let friendlyError: string | null = null;
      if (isActuallyOffline) {
        if (err?.code === 'permission-denied') {
          friendlyError = `Akses database ditolak (permission-denied). Periksa Firestore Security Rules. (${errMsg})`;
        } else if (err?.code === 'not-found') {
          friendlyError = `Database "${getActiveDatabaseId()}" tidak ditemukan di proyek "${firebaseConfig.projectId}".`;
        } else {
          friendlyError = errMsg;
        }
      }

      setConnection({
        isConnected: !isActuallyOffline,
        latencyMs: latency,
        lastChecked: new Date(),
        isChecking: false,
        error: friendlyError,
      });
      return !isActuallyOffline;
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const handleOnline = () => checkConnection();
    const handleOffline = () => {
      setConnection((prev) => ({
        ...prev,
        isConnected: false,
        error: 'Koneksi internet terputus',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 25 seconds
    const interval = setInterval(checkConnection, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  return { connection, checkConnection };
}

interface ConnectionBadgeProps {
  connection: ConnectionState;
  onOpenDetails: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Top Navbar Badge Component:
 * - Warna BIRU jika Terhubung
 * - Warna MERAH jika Tidak Terhubung
 */
export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  connection,
  onOpenDetails,
  className = '',
  compact = false,
}) => {
  const { isConnected, isChecking } = connection;

  if (isConnected) {
    return (
      <button
        type="button"
        onClick={onOpenDetails}
        title="Status: Terhubung dengan Absen SDIT Al Izzah (Klik untuk rincian)"
        className={`group inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border ${
          compact
            ? 'bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100 hover:border-blue-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:shadow-blue-200 hover:shadow-md'
        } ${className}`}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              compact ? 'bg-blue-400' : 'bg-white'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              compact ? 'bg-blue-600' : 'bg-white'
            }`}
          />
        </span>

        <Wifi className={`w-3.5 h-3.5 shrink-0 ${compact ? 'text-blue-600' : 'text-blue-100'}`} />

        <span className="truncate">
          <span className="hidden sm:inline">Terhubung dengan Absen SDIT Al Izzah</span>
          <span className="sm:hidden">Absen SDIT: Terhubung</span>
        </span>

        {isChecking && <RefreshCw className="w-3 h-3 animate-spin opacity-80 shrink-0" />}
      </button>
    );
  }

  // Not Connected: WARNA MERAH
  return (
    <button
      type="button"
      onClick={onOpenDetails}
      title="Status: Tidak Terhubung dengan Absen SDIT Al Izzah (Klik untuk periksa)"
      className={`group inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border animate-pulse ${
        compact
          ? 'bg-red-50 text-red-700 border-red-500 hover:bg-red-100 hover:border-red-600'
          : 'bg-red-600 hover:bg-red-700 text-white border-red-700 hover:shadow-red-200 hover:shadow-md'
      } ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            compact ? 'bg-red-500' : 'bg-white'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            compact ? 'bg-red-600' : 'bg-white'
          }`}
        />
      </span>

      <WifiOff className={`w-3.5 h-3.5 shrink-0 ${compact ? 'text-red-600' : 'text-red-100'}`} />

      <span className="truncate font-extrabold">
        <span className="hidden sm:inline">Tidak Terhubung dengan Absen SDIT Al Izzah</span>
        <span className="sm:hidden">Absen SDIT: Terputus</span>
      </span>

      {isChecking && <RefreshCw className="w-3 h-3 animate-spin opacity-80 shrink-0" />}
    </button>
  );
};

interface FloatingNotificationProps {
  connection: ConnectionState;
  onCheckAgain: () => void;
  onOpenDetails: () => void;
}

/**
 * Floating / Sticky Alert Toast Notification
 * - Biru ketika terhubung
 * - Merah ketika tidak terhubung
 */
export const FloatingConnectionNotification: React.FC<FloatingNotificationProps> = ({
  connection,
  onCheckAgain,
  onOpenDetails,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const { isConnected, isChecking, latencyMs } = connection;

  // Reset dismissal if status turns disconnected
  useEffect(() => {
    if (!isConnected) {
      setIsDismissed(false);
    }
  }, [isConnected]);

  if (isDismissed) {
    return (
      <button
        type="button"
        onClick={() => setIsDismissed(false)}
        className={`fixed bottom-4 right-4 z-40 p-2.5 rounded-full shadow-lg border cursor-pointer transition-transform hover:scale-105 flex items-center gap-2 ${
          isConnected
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-red-600 text-white border-red-700 animate-bounce'
        }`}
        title="Tampilkan status notifikasi Absen SDIT Al Izzah"
      >
        {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span className="text-[11px] font-bold pr-1">
          {isConnected ? 'Terhubung (Biru)' : 'Terputus (Merah)'}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full mx-auto px-4 sm:px-0">
      <div
        className={`rounded-2xl p-4 shadow-xl border-2 transition-all backdrop-blur-md ${
          isConnected
            ? 'bg-blue-50/95 border-blue-500 text-blue-950 shadow-blue-500/10'
            : 'bg-red-50/95 border-red-500 text-red-950 shadow-red-500/20 animate-pulse'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                isConnected ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                    isConnected ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'
                  }`}
                >
                  {isConnected ? 'STATUS: BIRU' : 'STATUS: MERAH'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {connection.lastChecked.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-extrabold leading-tight">
                {isConnected
                  ? 'Terhubung dengan Absen SDIT Al Izzah'
                  : 'Tidak Terhubung dengan Absen SDIT Al Izzah'}
              </h4>

              <p className="text-[11px] text-slate-600 leading-snug">
                {isConnected
                  ? `Database Firestore sinkron real-time (Latensi: ${latencyMs}ms).`
                  : 'Gagal menjangkau server Firestore. Periksa internet atau status database.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            title="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenDetails}
            className={`text-[11px] font-bold hover:underline flex items-center gap-1 ${
              isConnected ? 'text-blue-700' : 'text-red-700'
            }`}
          >
            <span>Rincian Koneksi</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onCheckAgain}
            disabled={isChecking}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 text-white ${
              isConnected
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Menguji...' : 'Uji Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ConnectionState;
  onCheckAgain: () => void;
}

/**
 * Detailed Information Dialog
 */
export const ConnectionDetailsModal: React.FC<ConnectionDetailsModalProps> = ({
  isOpen,
  onClose,
  connection,
  onCheckAgain,
}) => {
  if (!isOpen) return null;

  const { isConnected, latencyMs, lastChecked, isChecking, error } = connection;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header Bar */}
        <div
          className={`p-5 text-white flex items-center justify-between ${
            isConnected
              ? 'bg-gradient-to-r from-blue-700 to-indigo-700'
              : 'bg-gradient-to-r from-red-600 to-rose-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                Indikator Notifikasi
              </span>
              <h3 className="text-base font-extrabold text-white">
                {isConnected
                  ? 'Terhubung dengan Absen SDIT Al Izzah'
                  : 'Tidak Terhubung dengan Absen SDIT Al Izzah'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Main Status Pill */}
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
              isConnected
                ? 'bg-blue-50 border-blue-400 text-blue-900'
                : 'bg-red-50 border-red-400 text-red-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isConnected ? 'bg-blue-600 ring-4 ring-blue-200' : 'bg-red-600 ring-4 ring-red-200'
                }`}
              />
              <div>
                <span className="text-xs font-bold block">Status Koneksi</span>
                <span className="text-xs text-slate-600">
                  {isConnected
                    ? 'Koneksi Berhasil (Berwarna Biru)'
                    : 'Koneksi Terputus (Berwarna Merah)'}
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                isConnected ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {isConnected ? 'BIRU (ONLINE)' : 'MERAH (OFFLINE)'}
            </span>
          </div>

          {/* Technical Specs */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Database Target:</span>
              </span>
              <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[200px]" title={getActiveDatabaseId()}>
                {getActiveDatabaseId()}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Project ID:</span>
              </span>
              <span className="font-mono text-slate-800 font-semibold text-[11px]">
                {firebaseConfig.projectId}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Konsistensi Config JSON:</span>
              <span
                className={`font-bold text-[11px] ${
                  getActiveDatabaseId() === firebaseConfig.firestoreDatabaseId
                    ? 'text-emerald-700'
                    : 'text-amber-600'
                }`}
              >
                {getActiveDatabaseId() === firebaseConfig.firestoreDatabaseId
                  ? 'Sesuai firebase-applet-config.json'
                  : 'Override Aktif (Berbeda dengan JSON)'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Latensi Jaringan:</span>
              <span className="font-mono font-bold text-slate-800">
                {isConnected ? `${latencyMs} ms` : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Terakhir Dicek:</span>
              <span className="font-semibold text-slate-700">
                {lastChecked.toLocaleTimeString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Aplikasi Android:</span>
              <span className="font-mono text-emerald-800 font-bold text-[11px]">
                {ANDROID_APP_INFO.packageName}
              </span>
            </div>
          </div>

          {getActiveDatabaseId() !== firebaseConfig.firestoreDatabaseId && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl text-xs flex items-center justify-between gap-2">
              <span>
                Browser sedang memakai Database ID kustom (bukan bawaan <code className="font-mono">firebase-applet-config.json</code>).
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('custom_firestore_database_id');
                  window.location.reload();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 cursor-pointer"
              >
                Reset ke Bawaan
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs">
              <span className="font-bold block">Pesan Kesalahan:</span>
              <span className="font-mono text-[11px] break-all">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={onCheckAgain}
            disabled={isChecking}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-colors ${
              isConnected
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Menguji...' : 'Uji Ulang Koneksi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
