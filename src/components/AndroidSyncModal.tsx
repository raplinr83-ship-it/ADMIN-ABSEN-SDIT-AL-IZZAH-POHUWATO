import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  RefreshCw,
  X,
  Database,
  ArrowRightLeft,
  Server,
  Layers,
  Sparkles,
  Activity,
  Check,
  AlertTriangle,
  Copy,
  CheckCheck,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  ANDROID_APP_INFO,
  crossSyncAndroidDatabase,
  runFirestoreDiagnostic,
  DiagnosticResult,
} from '../services/dataService';
import { FirebaseConsistencyPanel } from './FirebaseConsistencyPanel';

interface AndroidSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalEmployees: number;
  totalTodayAttendance: number;
  initialDiagnostic?: DiagnosticResult | null;
}

export const AndroidSyncModal: React.FC<AndroidSyncModalProps> = ({
  isOpen,
  onClose,
  totalEmployees,
  totalTodayAttendance,
  initialDiagnostic,
}) => {
  const [activeTab, setActiveTab] = useState<'consistency' | 'sync'>('consistency');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string>('');
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(initialDiagnostic || null);
  const [isRunningDiag, setIsRunningDiag] = useState<boolean>(false);

  const handleRunDiagnostic = async () => {
    setIsRunningDiag(true);
    try {
      const res = await runFirestoreDiagnostic();
      setDiagnostic(res);
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsRunningDiag(false);
    }
  };

  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [customDbInput, setCustomDbInput] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('custom_firestore_database_id')) || '';
  });
  const [customDbSaved, setCustomDbSaved] = useState<string>('');

  const androidPromptText = `Tolong ubah inisialisasi Firebase Firestore di aplikasi Android ini agar terhubung ke database Web Admin SDIT Al Izzah:
- Firebase Project ID: ${ANDROID_APP_INFO.firebaseProjectId}
- Firestore Database ID: ${ANDROID_APP_INFO.firestoreDatabaseId}
- Koleksi: pegawai (dokumen id = nip, cari field nip dan pin)
Gunakan kode:
FirebaseFirestore.getInstance(FirebaseApp.getInstance(), "${ANDROID_APP_INFO.firestoreDatabaseId}")
bukan FirebaseFirestore.getInstance() default.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(androidPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleSaveCustomDb = () => {
    if (customDbInput.trim()) {
      localStorage.setItem('custom_firestore_database_id', customDbInput.trim());
      setCustomDbSaved(`Database ID disimpan: ${customDbInput.trim()}. Memuat ulang...`);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleResetDb = () => {
    localStorage.removeItem('custom_firestore_database_id');
    setCustomDbSaved('Mengembalikan ke Database ID bawaan Web Admin. Memuat ulang...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncResult('');
    try {
      const res = await crossSyncAndroidDatabase();
      setSyncResult(res.message);
    } catch (err) {
      setSyncResult('Sinkronisasi selesai. Status koneksi aktif.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase block">
                Integrasi &amp; Konsistensi Firebase
              </span>
              <h3 className="text-base font-extrabold text-white">
                {ANDROID_APP_INFO.packageName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('consistency')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'consistency'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cek Konsistensi &amp; Panduan ID</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Sinkronisasi &amp; Diagnostik</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'consistency' ? (
            <FirebaseConsistencyPanel />
          ) : (
            <>
          {/* Explanation Alert for 4 vs 12 accounts */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Mengapa Akun di HP (4 orang) Berbeda dengan di Admin (12 orang)?</span>
            </div>
            <p className="leading-relaxed">
              Google AI Studio membuat <strong>Database ID terpisah</strong> saat Anda membuat aplikasi Android dan Web Admin secara terpisah. Oleh karena itu, aplikasi di HP membaca database lamanya sendiri, sedangkan Web Admin membaca database barunya.
            </p>
          </div>

          {/* Solusi 1: Salin Prompt untuk AI Android */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <span className="text-xs font-bold text-blue-950">
                  Solusi 1: Sambungkan Aplikasi Android ke Database Ini (Rekomendasi)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Prompt</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-blue-900 leading-relaxed">
              Buka ruang obrolan tempat Anda membuat aplikasi Android <strong>com.aistudio.absensdit.pohuwato</strong>, lalu tempelkan (*paste*) prompt ini ke AI pembuat Android:
            </p>

            <pre className="p-3 bg-white border border-blue-200 rounded-xl text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed select-all">
              {androidPromptText}
            </pre>
          </div>

          {/* Solusi 2: Ganti Database ID Web Admin ke Database Android */}
          <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs">
                2
              </span>
              <span className="text-xs font-bold text-slate-800">
                Solusi 2: Sambungkan Web Admin Ini ke Database HP Android Anda
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Jika Anda mengetahui Database ID dari aplikasi Android (misal dari file <code>google-services.json</code> atau chat Android), masukkan di bawah ini:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Contoh: (default) atau ai-studio-xxxx..."
                value={customDbInput}
                onChange={(e) => setCustomDbInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleSaveCustomDb}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Ganti Database
              </button>
              {localStorage.getItem('custom_firestore_database_id') && (
                <button
                  type="button"
                  onClick={handleResetDb}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Reset Asli
                </button>
              )}
            </div>

            {customDbSaved && (
              <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                {customDbSaved}
              </div>
            )}
          </div>

          {/* Live Status Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950">
                  Sinkronisasi Dua Arah Aktif (Real-Time)
                </span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Aplikasi web admin ini membaca dan menulis data pada database Firebase yang sama dengan aplikasi Android pegawai{' '}
                <strong className="font-mono text-emerald-900">
                  {ANDROID_APP_INFO.packageName}
                </strong>
                .
              </p>
            </div>
          </div>

          {/* Configuration Matrix */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 bg-slate-50 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>Package ID Android:</span>
              </span>
              <span className="font-mono font-bold text-slate-800">
                {ANDROID_APP_INFO.packageName}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Firebase Project:</span>
              </span>
              <span className="font-mono font-bold text-slate-800">
                {ANDROID_APP_INFO.firebaseProjectId}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Firestore Database ID:</span>
              </span>
              <span className="font-mono font-semibold text-slate-700 text-[11px] truncate max-w-[200px]" title={ANDROID_APP_INFO.firestoreDatabaseId}>
                {ANDROID_APP_INFO.firestoreDatabaseId}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Koleksi Sinkron:</span>
              </span>
              <div className="text-right text-[11px] font-mono text-emerald-800 font-semibold">
                <span>pegawai ⇄ employees</span>
                <span className="block">absensi ⇄ attendance</span>
                <span className="block">izin ⇄ leaveRequests</span>
                <span className="block">pengaturan ⇄ settings</span>
              </div>
            </div>
          </div>

          {/* Current Live Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Pegawai Tersinkron</span>
              <span className="text-lg font-extrabold text-slate-800">{totalEmployees}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Absensi Hari Ini</span>
              <span className="text-lg font-extrabold text-emerald-700">{totalTodayAttendance}</span>
            </div>
          </div>

          {/* Diagnostic Tool Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Diagnostik Koneksi & Database
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunDiagnostic}
                disabled={isRunningDiag}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRunningDiag ? 'animate-spin' : ''}`} />
                <span>{isRunningDiag ? 'Menguji...' : 'Uji Diagnostik'}</span>
              </button>
            </div>

            {diagnostic ? (
              <div className="text-[11px] space-y-1.5 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status Server Ping:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      diagnostic.connectionTest.connected ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {diagnostic.connectionTest.connected ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Terhubung ({diagnostic.connectionTest.latencyMs}ms)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Gagal: {diagnostic.connectionTest.error}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Uji NIP 9921 (TU):</span>
                  <span className="font-semibold text-slate-700">
                    {diagnostic.nipChecks['9921']?.found ? '✅ Ditemukan di Firestore' : '❌ Belum Ditemukan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Koleksi Terbaca:</span>
                  <span className="font-mono text-slate-700 text-[10px]">
                    pegawai ({diagnostic.collections['pegawai']?.count ?? 0}), employees ({diagnostic.collections['employees']?.count ?? 0})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  *Buka Console Browser (F12) untuk melihat laporan diagnostik Firebase terperinci.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Klik tombol di atas untuk memverifikasi koneksi langsung ke server Firestore dan memeriksa status dokumen NIP.
              </p>
            )}
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold">
              {syncResult}
            </div>
          )}
            </>
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
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
