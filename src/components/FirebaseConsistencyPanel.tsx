import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Copy,
  CheckCheck,
  Database,
  Server,
  Smartphone,
  ShieldCheck,
  FileJson,
  BookOpen,
  GitCompare,
} from 'lucide-react';
import {
  ANDROID_APP_INFO,
  checkFirebaseConfigConsistency,
  ConfigConsistencyReport,
  ConsistencyStatus,
} from '../services/dataService';

interface FirebaseConsistencyPanelProps {
  compact?: boolean;
}

const STATUS_BADGE_MAP: Record<
  ConsistencyStatus,
  { label: string; badgeClass: string; borderClass: string; bgClass: string }
> = {
  consistent: {
    label: 'KONSISTEN',
    badgeClass: 'bg-emerald-600 text-white',
    borderClass: 'border-emerald-300',
    bgClass: 'bg-emerald-50/70',
  },
  warning: {
    label: 'PERINGATAN',
    badgeClass: 'bg-amber-500 text-white',
    borderClass: 'border-amber-300',
    bgClass: 'bg-amber-50/70',
  },
  mismatch: {
    label: 'TIDAK COCOK',
    badgeClass: 'bg-rose-600 text-white',
    borderClass: 'border-rose-300',
    bgClass: 'bg-rose-50/70',
  },
};

export const FirebaseConsistencyPanel: React.FC<FirebaseConsistencyPanelProps> = ({
  compact = false,
}) => {
  const [report, setReport] = useState<ConfigConsistencyReport | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive Android config comparator inputs
  const [androidProjectInput, setAndroidProjectInput] = useState<string>('');
  const [androidDbInput, setAndroidDbInput] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(!compact);

  const runCheck = useCallback(
    async (customProj?: string, customDb?: string) => {
      setIsChecking(true);
      try {
        const res = await checkFirebaseConfigConsistency(
          customProj !== undefined ? customProj : androidProjectInput,
          customDb !== undefined ? customDb : androidDbInput
        );
        setReport(res);
      } catch (err) {
        console.error('Consistency check failed:', err);
      } finally {
        setIsChecking(false);
      }
    },
    [androidProjectInput, androidDbInput]
  );

  useEffect(() => {
    runCheck('', '');
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCompareAndroid = (e: React.FormEvent) => {
    e.preventDefault();
    runCheck(androidProjectInput, androidDbInput);
  };

  const handleResetCustomOverride = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('custom_firestore_database_id');
      window.location.reload();
    }
  };

  const overall = report?.overallStatus || 'consistent';
  const overallStyle = STATUS_BADGE_MAP[overall];

  const kotlinSnippet = `// Inisialisasi Wajib di Aplikasi Android (${ANDROID_APP_INFO.packageName})
val app = FirebaseApp.getInstance()
val db = FirebaseFirestore.getInstance(app, "${report?.configJson.firestoreDatabaseId || ANDROID_APP_INFO.expectedDatabaseId}")`;

  return (
    <div className="space-y-4">
      {/* 1. Overall Status Banner */}
      <div
        className={`rounded-2xl border-2 p-4 ${overallStyle.borderClass} ${overallStyle.bgClass} transition-colors`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                overall === 'consistent'
                  ? 'bg-emerald-600'
                  : overall === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
              }`}
            >
              {overall === 'consistent' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : overall === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Status Konsistensi Proyek & Database Firebase
                </h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider ${overallStyle.badgeClass}`}
                >
                  {overallStyle.label}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {overall === 'consistent'
                  ? 'Konfigurasi firebase-applet-config.json, Runtime SDK Web Admin, dan target sinkronisasi Android selaras pada proyek dan database yang sama.'
                  : overall === 'warning'
                    ? 'Terdapat peringatan konfigurasi (misalnya override database aktif atau data belum lengkap). Periksa detail di bawah.'
                    : 'Ditemukan ketidakcocokan projectId atau firestoreDatabaseId! Aplikasi Admin dan Android tidak akan tersinkronisasi sampai ID disamakan.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => runCheck()}
            disabled={isChecking}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Memeriksa...' : 'Cek Konsistensi'}</span>
          </button>
        </div>

        {/* Warning banner if custom override exists in localStorage */}
        {report?.runtimeSdk.hasCustomOverride && (
          <div className="mt-3 p-3 bg-amber-100/90 border border-amber-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
            <div>
              <strong>Override Database Aktif:</strong> Browser saat ini diarahkan ke{' '}
              <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded font-bold">
                {report.runtimeSdk.customOverrideValue}
              </code>{' '}
              (berbeda dengan <code className="font-mono">firebase-applet-config.json</code>).
            </div>
            <button
              type="button"
              onClick={handleResetCustomOverride}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Kembalikan ke Config Asli
            </button>
          </div>
        )}
      </div>

      {/* 2. Side-by-side Reference Card: firebase-applet-config.json */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              Referensi Aktif <code className="font-mono text-emerald-700">firebase-applet-config.json</code>
            </span>
          </div>
          {report?.liveSync.serverReachable && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live Ping: {report.liveSync.latencyMs}ms • {report.liveSync.pegawaiCount} Pegawai
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* projectId card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                <span>projectId (ID Proyek Firebase)</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy('projectId', report?.configJson.projectId || '')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'projectId' ? (
                  <>
                    <CheckCheck className="w-3 h-3" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 break-all text-[11px]">
              {report?.configJson.projectId || '-'}
            </div>
            <p className="text-[10px] text-slate-500">
              Runtime SDK: <span className="font-mono font-semibold text-slate-700">{report?.runtimeSdk.projectId || '-'}</span>
            </p>
          </div>

          {/* firestoreDatabaseId card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>firestoreDatabaseId (ID Database)</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy('databaseId', report?.configJson.firestoreDatabaseId || '')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'databaseId' ? (
                  <>
                    <CheckCheck className="w-3 h-3" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono font-bold text-emerald-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 break-all text-[11px]">
              {report?.configJson.firestoreDatabaseId || '-'}
            </div>
            <p className="text-[10px] text-slate-500">
              Runtime Aktif:{' '}
              <span className="font-mono font-semibold text-slate-700">
                {report?.runtimeSdk.activeDatabaseId || '-'}
              </span>
            </p>
          </div>
        </div>

        {report && report.liveSync.androidBiometricCount > 0 && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Terdeteksi <strong>{report.liveSync.androidBiometricCount} akun pegawai</strong> di database ini memiliki jejak pendaftaran/sinkronisasi langsung dari aplikasi Android <code className="font-mono font-bold">{ANDROID_APP_INFO.packageName}</code>.
            </span>
          </div>
        )}
      </div>

      {/* 3. Automated Consistency Checklist */}
      {report && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Hasil Pengecekan Konsistensi Otomatis ({report.checks.length} Pemeriksaan)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(report.checkedAt).toLocaleTimeString('id-ID')}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {report.checks.map((item) => {
              const st = STATUS_BADGE_MAP[item.status];
              return (
                <div key={item.id} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    {item.status === 'consistent' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : item.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-800">{item.label}</div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500">
                        <span>Target: <strong className="text-slate-700">{item.expected}</strong></span>
                        <span>Aktual: <strong className="text-slate-800">{item.actual}</strong></span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`self-start shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${st.badgeClass}`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Interactive Android Config Verifier */}
      <form
        onSubmit={handleCompareAndroid}
        className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-3 shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-700" />
          <h4 className="text-xs font-bold text-slate-800">
            Uji Kecocokan Konfigurasi Aplikasi Android Anda
          </h4>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Salin nilai <code className="font-mono bg-slate-100 px-1 rounded">projectId</code> dan{' '}
          <code className="font-mono bg-slate-100 px-1 rounded">firestoreDatabaseId</code> dari proyek Android{' '}
          <span className="font-mono font-semibold">{ANDROID_APP_INFO.packageName}</span> (misalnya dari{' '}
          <code className="font-mono bg-slate-100 px-1 rounded">google-services.json</code> atau kode Kotlin) ke kolom di bawah untuk memeriksa kesesuaiannya:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              projectId di Aplikasi Android
            </label>
            <input
              type="text"
              value={androidProjectInput}
              onChange={(e) => setAndroidProjectInput(e.target.value)}
              placeholder={report?.configJson.projectId || 'gen-lang-client-0238067453'}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              firestoreDatabaseId di Aplikasi Android
            </label>
            <input
              type="text"
              value={androidDbInput}
              onChange={(e) => setAndroidDbInput(e.target.value)}
              placeholder={report?.configJson.firestoreDatabaseId || '(default) atau ai-studio-...'}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const p = report?.configJson.projectId || '';
              const d = report?.configJson.firestoreDatabaseId || '';
              setAndroidProjectInput(p);
              setAndroidDbInput(d);
              runCheck(p, d);
            }}
            className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
          >
            Isi dengan Nilai Referensi Admin
          </button>

          <button
            type="submit"
            disabled={isChecking}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Verifikasi Kecocokan</span>
          </button>
        </div>

        {report?.androidComparison && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
              report.androidComparison.projectMatch && report.androidComparison.databaseMatch
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {report.androidComparison.projectMatch && report.androidComparison.databaseMatch ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  COCOK 100%! Nilai projectId dan firestoreDatabaseId yang Anda masukkan sama persis dengan <code className="font-mono">firebase-applet-config.json</code>.
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  TIDAK COCOK!{' '}
                  {!report.androidComparison.projectMatch && 'projectId berbeda. '}
                  {!report.androidComparison.databaseMatch && 'firestoreDatabaseId berbeda. '}
                  Ikuti panduan penyamaan di bawah ini.
                </span>
              </>
            )}
          </div>
        )}
      </form>

      {/* 5. Collapsible Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-800">
              Panduan Memastikan Admin & Aplikasi Android Merujuk ke Database yang Sama
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700">
            {showGuide ? 'Sembunyikan' : 'Tampilkan Panduan'}
          </span>
        </button>

        {showGuide && (
          <div className="p-4 pt-2 border-t border-slate-200 space-y-3 text-xs text-slate-700">
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                <strong>Samakan <code className="font-mono text-emerald-800">projectId</code> di kedua aplikasi:</strong>{' '}
                Buka file <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">google-services.json</code> (Android) pada bagian{' '}
                <code className="font-mono">project_info.project_id</code> dan pastikan nilainya sama persis dengan{' '}
                <code className="font-mono font-bold text-slate-900">{report?.configJson.projectId}</code> di{' '}
                <code className="font-mono">firebase-applet-config.json</code>.
              </li>
              <li>
                <strong>Samakan <code className="font-mono text-emerald-800">firestoreDatabaseId</code> (Sangat Penting):</strong>{' '}
                Aplikasi Android tidak boleh memakai <code className="font-mono">FirebaseFirestore.getInstance()</code> tanpa parameter karena akan otomatis mengarah ke database <code className="font-mono">(default)</code>, bukan{' '}
                <code className="font-mono font-bold text-emerald-800">{report?.configJson.firestoreDatabaseId}</code>.
              </li>
              <li>
                <strong>Gunakan inisialisasi bernama di Android (Kotlin/Java):</strong>
                <div className="mt-1.5 relative">
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {kotlinSnippet}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy('kotlin', kotlinSnippet)}
                    className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    {copiedKey === 'kotlin' ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        <span>Kode Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Kode Inisialisasi Android</span>
                      </>
                    )}
                  </button>
                </div>
              </li>
              <li>
                <strong>Verifikasi Koleksi Bersama:</strong> Pastikan Android membaca login NIP &amp; PIN dari koleksi{' '}
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">pegawai</code>, menyimpan presensi ke{' '}
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">absensi</code>, dan membaca konfigurasi GPS/jam dari{' '}
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">pengaturan/sekolah</code>.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
