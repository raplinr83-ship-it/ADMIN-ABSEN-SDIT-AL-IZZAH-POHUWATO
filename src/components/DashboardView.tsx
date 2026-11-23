import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  Sparkles,
  ChevronRight,
  MapPin,
  Calendar,
  Eye,
  FileCheck,
  TrendingUp,
  MessageSquare,
  ShieldAlert,
  Smartphone,
  RefreshCw,
  ShieldCheck,
  Database,
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  SchoolConfig,
  AdminRole,
} from '../types';
import {
  getTodayDateString,
  processAutoAlphaToday,
  getFirebaseConfigConsistencySnapshot,
} from '../services/dataService';
import { generateWhatsAppLink, formatWhatsAppMessage } from '../services/whatsappService';

interface DashboardViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  config: SchoolConfig;
  role: AdminRole;
  onOpenWhatsAppModal: () => void;
  onOpenAndroidSyncModal?: () => void;
  onViewPhoto: (imageUrl: string, title: string, details?: any) => void;
  onViewMap: (record: AttendanceRecord) => void;
  onNavigateTab: (tab: any) => void;
  onRefreshData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendanceRecords,
  leaveRequests,
  config,
  role,
  onOpenWhatsAppModal,
  onOpenAndroidSyncModal,
  onViewPhoto,
  onViewMap,
  onNavigateTab,
}) => {
  const [isProcessingAlpa, setIsProcessingAlpa] = useState<boolean>(false);
  const [alpaResultMessage, setAlpaResultMessage] = useState<string>('');
  const [filterRole, setFilterRole] = useState<'Semua' | 'Guru' | 'TU'>('Semua');

  const todayStr = getTodayDateString();

  // Filtered employees
  const targetEmployees = employees.filter((e) => {
    if (!e.isActive) return false;
    if (filterRole === 'Semua') return true;
    return e.role === filterRole;
  });

  const totalEmpCount = targetEmployees.length;

  // Filter today's attendance records
  const todayRecords = attendanceRecords.filter((r) => {
    if (r.date !== todayStr) return false;
    const emp = employees.find((e) => e.id === r.employeeId);
    if (!emp) return true;
    if (filterRole === 'Semua') return true;
    return emp.role === filterRole;
  });

  // Calculate status counts
  const presentCount = todayRecords.filter((r) => r.status === 'Hadir').length;
  const lateCount = todayRecords.filter((r) => r.status === 'Terlambat').length;
  const leaveCount = todayRecords.filter(
    (r) => r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Dinas'
  ).length;
  const recordedAlpaCount = todayRecords.filter((r) => r.status === 'Alpa').length;

  // Recorded IDs
  const recordedEmpIds = new Set(todayRecords.map((r) => r.employeeId));
  const unrecordedEmployees = targetEmployees.filter(
    (e) => !recordedEmpIds.has(e.id)
  );
  const notCheckedInCount = unrecordedEmployees.length;

  // Attendance rate
  const attendanceRate =
    totalEmpCount > 0
      ? Math.round(((presentCount + lateCount) / totalEmpCount) * 100)
      : 0;

  // Process Auto Alpa handler
  const handleRunAutoAlpa = async () => {
    if (role === 'Kepala Sekolah') {
      alert('Peran Kepala Sekolah hanya memiliki hak akses melihat data.');
      return;
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin menetapkan status "Alpa" secara otomatis untuk ${notCheckedInCount} pegawai yang belum presensi hari ini?`
      )
    ) {
      return;
    }

    setIsProcessingAlpa(true);
    setAlpaResultMessage('');
    try {
      const count = await processAutoAlphaToday(employees, attendanceRecords.filter((r) => r.date === todayStr));
      setAlpaResultMessage(`Alhamdulillah, berhasil memperbarui ${count} pegawai menjadi status Alpa.`);
    } catch (err) {
      setAlpaResultMessage('Gagal memproses otomatis alpa.');
    } finally {
      setIsProcessingAlpa(false);
      setTimeout(() => setAlpaResultMessage(''), 6000);
    }
  };

  // Generate 7-day attendance trends for chart
  const last7Days: { dateStr: string; label: string; present: number; late: number; leave: number; alpa: number; total: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateFormatted = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

    const recordsOnDate = attendanceRecords.filter((r) => r.date === dateFormatted);
    const p = recordsOnDate.filter((r) => r.status === 'Hadir').length;
    const l = recordsOnDate.filter((r) => r.status === 'Terlambat').length;
    const lv = recordsOnDate.filter((r) => r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Dinas').length;
    const a = recordsOnDate.filter((r) => r.status === 'Alpa').length;

    last7Days.push({
      dateStr: dateFormatted,
      label: dayLabel,
      present: p,
      late: l,
      leave: lv,
      alpa: a,
      total: p + l + lv + a,
    });
  }

  // 5 latest check-ins today
  const recentCheckIns = todayRecords
    .filter((r) => r.checkInTime)
    .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Role Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 rounded-2xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold block">
            Dashboard Utama
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Presensi Kepegawaian Hari Ini
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Batas waktu presensi masuk:{' '}
            <span className="font-bold underline decoration-amber-400">
              {config.checkInEnd} WITA
            </span>{' '}
            (Toleransi: {config.lateToleranceMinutes} menit)
          </p>
        </div>

        {/* Filter Category & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex items-center border border-white/20">
            {(['Semua', 'Guru', 'TU'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterRole === r
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                {r === 'Semua' ? 'Semua Pegawai' : r}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenWhatsAppModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim WA ({notCheckedInCount})</span>
          </button>
        </div>
      </div>

      {/* Android com.aistudio.absensdit.pohuwato Integration & Firebase Consistency Banner */}
      {(() => {
        const snap = getFirebaseConfigConsistencySnapshot();
        const isConsistent = snap.overallStatus === 'consistent';
        return (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-emerald-950">
                    Status Proyek Firebase &amp; Aplikasi Android Pegawai
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isConsistent
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-200 text-amber-950'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{isConsistent ? 'KONFIGURASI KONSISTEN' : 'PERLU CEK KONFIGURASI'}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-900 font-mono">
                  <span>
                    Package: <strong>com.aistudio.absensdit.pohuwato</strong>
                  </span>
                  <span className="text-emerald-400">•</span>
                  <span>
                    projectId: <strong className="bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">{snap.configJson.projectId}</strong>
                  </span>
                  <span className="text-emerald-400">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-700" />
                    firestoreDatabaseId:{' '}
                    <strong className="bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
                      {snap.runtimeSdk.activeDatabaseId}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {onOpenAndroidSyncModal && (
              <button
                onClick={onOpenAndroidSyncModal}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cek Konsistensi &amp; Panduan</span>
              </button>
            )}
          </div>
        );
      })()}

      {alpaResultMessage && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{alpaResultMessage}</span>
          <button
            onClick={() => setAlpaResultMessage('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ×
          </button>
        </div>
      )}

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Pegawai */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pegawai</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-800">{totalEmpCount}</span>
            <span className="text-[11px] font-semibold text-slate-500">Guru & TU</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Terdaftar aktif di sistem
          </div>
        </div>

        {/* Hadir Hari Ini */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Hadir Tepat Waktu</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700">{presentCount}</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {attendanceRate}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600">
            Sebelum {config.checkInEnd} WITA
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Terlambat</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700">{lateCount}</span>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {totalEmpCount > 0 ? Math.round((lateCount / totalEmpCount) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600">
            Setelah jam toleransi
          </div>
        </div>

        {/* Izin / Sakit / Dinas */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Izin / Sakit / Dinas</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-blue-700">{leaveCount}</span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Disetujui
            </span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600">
            Ada surat keterangan
          </div>
        </div>

        {/* Belum Presensi / Alpa */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs hover:border-rose-400 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Belum Presensi</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-700">{notCheckedInCount}</span>
            {recordedAlpaCount > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {recordedAlpaCount} Alpa
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-rose-600">Perlu pengingat WA</span>
            {role === 'Operator' && notCheckedInCount > 0 && (
              <button
                onClick={handleRunAutoAlpa}
                disabled={isProcessingAlpa}
                className="text-[10px] font-bold text-rose-700 hover:underline"
              >
                Set Alpa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Attendance Interactive Trend Chart & Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Chart Container (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Grafik Tren Kehadiran 7 Hari Terakhir
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                SDIT Al Izzah Pohuwato • Rekapitulasi Hadir, Terlambat, Izin/Sakit & Alpa
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-slate-600">Hadir</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-600">Terlambat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600">Izin/Sakit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-600">Alpa</span>
              </div>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="pt-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-52 border-b border-slate-200 pb-3">
              {last7Days.map((day, idx) => {
                const maxVal = Math.max(totalEmpCount, 8);
                const pHeight = (day.present / maxVal) * 100;
                const lHeight = (day.late / maxVal) * 100;
                const lvHeight = (day.leave / maxVal) * 100;
                const aHeight = (day.alpa / maxVal) * 100;

                const isToday = idx === 6;

                return (
                  <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg pointer-events-none z-10 w-28 text-center whitespace-normal">
                      <span className="font-bold block">{day.label}</span>
                      <span>H: {day.present} | T: {day.late} | I: {day.leave} | A: {day.alpa}</span>
                    </div>

                    {/* Stacked Bar */}
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col-reverse h-40">
                      {pHeight > 0 && (
                        <div
                          style={{ height: `${pHeight}%` }}
                          className="bg-emerald-600 transition-all duration-500"
                          title={`Hadir: ${day.present}`}
                        />
                      )}
                      {lHeight > 0 && (
                        <div
                          style={{ height: `${lHeight}%` }}
                          className="bg-amber-500 transition-all duration-500"
                          title={`Terlambat: ${day.late}`}
                        />
                      )}
                      {lvHeight > 0 && (
                        <div
                          style={{ height: `${lvHeight}%` }}
                          className="bg-blue-500 transition-all duration-500"
                          title={`Izin/Sakit: ${day.leave}`}
                        />
                      )}
                      {aHeight > 0 && (
                        <div
                          style={{ height: `${aHeight}%` }}
                          className="bg-rose-500 transition-all duration-500"
                          title={`Alpa: ${day.alpa}`}
                        />
                      )}
                    </div>

                    {/* Day Label */}
                    <span
                      className={`text-[10px] mt-2 block text-center truncate w-full ${
                        isToday ? 'font-bold text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {isToday ? 'Hari Ini' : day.label.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
              <span>* Data dihimpun langsung dari catatan absensi harian Firebase</span>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Lihat Laporan Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pegawai Belum Absen & WhatsApp Quick Actions (1 column) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Belum Absen ({notCheckedInCount})
                </h3>
              </div>
              <button
                onClick={onOpenWhatsAppModal}
                disabled={notCheckedInCount === 0}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>Kirim Semua</span>
                <Send className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
              {unrecordedEmployees.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-slate-700">Luar biasa!</p>
                  <p>Semua pegawai terdaftar sudah melakukan presensi hari ini.</p>
                </div>
              ) : (
                unrecordedEmployees.map((emp) => {
                  const defaultMsg = formatWhatsAppMessage(config.whatsappTemplate, {
                    nama: emp.name,
                    nip: emp.nip,
                    sekolah: config.schoolName,
                    jam_batas: config.checkInEnd || '07:15',
                  });
                  const waLink = generateWhatsAppLink(emp.phone, defaultMsg);

                  return (
                    <div key={emp.id} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{emp.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{emp.position}</p>
                      </div>

                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200 transition-colors shrink-0"
                        title="Kirim pengingat WhatsApp langsung"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>WA</span>
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick auto-Alpa trigger button in footer */}
          {role === 'Operator' && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={handleRunAutoAlpa}
                disabled={isProcessingAlpa || notCheckedInCount === 0}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Proses Otomatis Alpa Hari Ini ({notCheckedInCount})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Recent Check-in Feed Today */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Aktivitas Presensi Terbaru Hari Ini
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('attendance')}
            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Semua Data Absensi ({todayRecords.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentCheckIns.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Belum ada aktivitas presensi masuk yang tercatat hari ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentCheckIns.map((rec) => {
              const isPresent = rec.status === 'Hadir';
              const isLate = rec.status === 'Terlambat';

              return (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all bg-slate-50/50 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Selfie photo thumb or icon */}
                    {rec.checkInPhoto ? (
                      <button
                        onClick={() =>
                          onViewPhoto(rec.checkInPhoto!, `Foto Presensi - ${rec.employeeName}`, {
                            employeeName: rec.employeeName,
                            nip: rec.nip,
                            time: rec.checkInTime,
                            location: `${rec.checkInDistance || 0} meter dari sekolah`,
                            status: rec.status,
                          })
                        }
                        className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 group"
                      >
                        <img
                          src={rec.checkInPhoto}
                          alt={rec.employeeName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {rec.employeeName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {rec.employeeName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {rec.checkInTime} WITA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        isPresent
                          ? 'bg-emerald-100 text-emerald-800'
                          : isLate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rec.status}
                    </span>

                    {rec.checkInLat ? (
                      <button
                        onClick={() => onViewMap(rec)}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
                      >
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{rec.checkInDistance ?? 0}m</span>
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
