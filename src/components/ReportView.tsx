import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertTriangle,
  Award,
  GraduationCap,
  X,
  School,
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  SchoolConfig,
  EmployeeMonthlyRecap,
} from '../types';
import { getTodayDateString } from '../services/dataService';

interface ReportViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  config: SchoolConfig;
}

export const ReportView: React.FC<ReportViewProps> = ({
  employees,
  attendanceRecords,
  config,
}) => {
  const currentDate = new Date();
  const [reportType, setReportType] = useState<'Bulanan' | 'Mingguan' | 'Harian'>('Bulanan');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [roleFilter, setRoleFilter] = useState<'Semua' | 'Guru' | 'TU'>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Print PDF Preview Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  // Calculate target date range
  const getFilterDateRange = () => {
    if (reportType === 'Harian') {
      return { start: selectedDate, end: selectedDate };
    }
    if (reportType === 'Mingguan') {
      const cur = new Date(selectedDate);
      const day = cur.getDay(); // 0 is Sunday
      const diffToMonday = cur.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(cur.setDate(diffToMonday));
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);

      return {
        start: monday.toISOString().split('T')[0],
        end: saturday.toISOString().split('T')[0],
      };
    }

    // Monthly
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  };

  const { start: startDateStr, end: endDateStr } = getFilterDateRange();

  // Filter attendance records in range
  const recordsInRange = attendanceRecords.filter(
    (r) => r.date >= startDateStr && r.date <= endDateStr
  );

  // Build recap per employee
  const recapData: EmployeeMonthlyRecap[] = employees
    .filter((emp) => emp.isActive)
    .filter((emp) => (roleFilter === 'Semua' ? true : emp.role === roleFilter))
    .filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((emp) => {
      const empRecords = recordsInRange.filter((r) => r.employeeId === emp.id);

      const presentCount = empRecords.filter((r) => r.status === 'Hadir').length;
      const lateCount = empRecords.filter((r) => r.status === 'Terlambat').length;
      const leaveCount = empRecords.filter((r) => r.status === 'Izin').length;
      const sickCount = empRecords.filter((r) => r.status === 'Sakit').length;
      const dutyCount = empRecords.filter((r) => r.status === 'Dinas').length;
      const alphaCount = empRecords.filter((r) => r.status === 'Alpa').length;

      // Estimated work days: at least the records count or min 1
      const totalLoggedDays = presentCount + lateCount + leaveCount + sickCount + dutyCount + alphaCount;
      const totalWorkDays = totalLoggedDays > 0 ? totalLoggedDays : 20;

      // Attendance percentage: (Hadir + Terlambat + Dinas + Izin/Sakit) / total
      const effectivePresence = presentCount + lateCount + dutyCount;
      const attendancePercentage =
        totalLoggedDays > 0 ? Math.round((effectivePresence / totalLoggedDays) * 100) : 0;

      return {
        employeeId: emp.id,
        nip: emp.nip,
        name: emp.name,
        position: emp.position,
        role: emp.role,
        phone: emp.phone,
        presentCount,
        lateCount,
        leaveCount,
        sickCount,
        dutyCount,
        alphaCount,
        totalWorkDays,
        attendancePercentage,
      };
    });

  // Totals for summary banner
  const totalEmployees = recapData.length;
  const avgAttendance =
    totalEmployees > 0
      ? Math.round(
          recapData.reduce((acc, cur) => acc + cur.attendancePercentage, 0) / totalEmployees
        )
      : 0;
  const totalHadir = recapData.reduce((acc, cur) => acc + cur.presentCount, 0);
  const totalTerlambat = recapData.reduce((acc, cur) => acc + cur.lateCount, 0);
  const totalAlpa = recapData.reduce((acc, cur) => acc + cur.alphaCount, 0);

  // Export to Excel-compatible CSV file
  const handleExportCSV = () => {
    const periodLabel =
      reportType === 'Bulanan'
        ? `Bulan ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
        : reportType === 'Mingguan'
        ? `Minggu ${startDateStr} s.d. ${endDateStr}`
        : `Tanggal ${selectedDate}`;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `REKAPITULASI PRESENSI PEGAWAI SDIT AL IZZAH POHUWATO\r\n`;
    csvContent += `Periode: ${periodLabel}\r\n`;
    csvContent += `Dicetak pada: ${new Date().toLocaleString('id-ID')} WITA\r\n\r\n`;
    csvContent += `No,NIP,Nama Pegawai,Kategori,Jabatan,Hadir (H),Terlambat (T),Izin (I),Sakit (S),Dinas (D),Alpa (A),Persentase (%)\r\n`;

    recapData.forEach((item, idx) => {
      csvContent += `"${idx + 1}","'${item.nip}","${item.name}","${item.role}","${item.position}",${item.presentCount},${item.lateCount},${item.leaveCount},${item.sickCount},${item.dutyCount},${item.alphaCount},"${item.attendancePercentage}%"\r\n`;
    });

    csvContent += `\r\n`;
    csvContent += `,,TOTAL KESELURUHAN,,,"${totalHadir}","${totalTerlambat}","","","","${totalAlpa}","Rata-rata: ${avgAttendance}%"\r\n\r\n`;
    csvContent += `Mengetahui,\r\n`;
    csvContent += `Kepala Sekolah SDIT Al Izzah Pohuwato,\r\n\r\n\r\n`;
    csvContent += `"${config.headmasterName}"\r\n`;
    csvContent += `NIP. ${config.headmasterNip}\r\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rekap_Absensi_SDIT_Al_Izzah_${reportType}_${startDateStr}_sd_${endDateStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const periodDisplay =
    reportType === 'Bulanan'
      ? `${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
      : reportType === 'Mingguan'
      ? `${startDateStr} s/d ${endDateStr}`
      : selectedDate;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Laporan Rekapitulasi Presensi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor rekapitulasi ke format Excel (CSV) dan cetak dokumen resmi bertanda tangan Kepala Sekolah
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (.CSV)</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Filter and Period Selection */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Report Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jenis Rekapitulasi
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['Bulanan', 'Mingguan', 'Harian'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReportType(t)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    reportType === t
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Period selector based on type */}
          {reportType === 'Bulanan' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType !== 'Bulanan' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {reportType === 'Mingguan' ? 'Pilih Hari dalam Minggu' : 'Pilih Tanggal'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kategori Pegawai
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua (Guru & TU)</option>
              <option value="Guru">Tenaga Pendidik (Guru)</option>
              <option value="TU">Tenaga Kependidikan (TU)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari pegawai di tabel rekapitulasi..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold block">Total Pegawai</span>
          <span className="text-xl font-extrabold text-slate-800">{totalEmployees}</span>
        </div>
        <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-800">
          <span className="font-semibold block">Rata-rata Kehadiran</span>
          <span className="text-xl font-extrabold">{avgAttendance}%</span>
        </div>
        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-800">
          <span className="font-semibold block">Total Keterlambatan</span>
          <span className="text-xl font-extrabold">{totalTerlambat} Kali</span>
        </div>
        <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-xs text-rose-800">
          <span className="font-semibold block">Total Alpa</span>
          <span className="text-xl font-extrabold">{totalAlpa} Hari</span>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tabel Rekapitulasi Presensi: {periodDisplay}
            </h3>
            <p className="text-[11px] text-slate-500">
              Keterangan: H (Hadir Tepat) • T (Terlambat) • I (Izin) • S (Sakit) • D (Dinas) • A (Alpa)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4">Pegawai & NIP</th>
                <th className="py-3 px-3">Jabatan</th>
                <th className="py-3 px-2 text-center text-emerald-700">H</th>
                <th className="py-3 px-2 text-center text-amber-700">T</th>
                <th className="py-3 px-2 text-center text-blue-700">I</th>
                <th className="py-3 px-2 text-center text-blue-700">S</th>
                <th className="py-3 px-2 text-center text-purple-700">D</th>
                <th className="py-3 px-2 text-center text-rose-700">A</th>
                <th className="py-3 px-4 text-center">Tingkat Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recapData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Tidak ada data pegawai yang memenuhi filter.
                  </td>
                </tr>
              ) : (
                recapData.map((item, index) => (
                  <tr key={item.employeeId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">
                      <div>
                        <span>{item.name}</span>
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">
                          {item.nip}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{item.position}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-emerald-700 bg-emerald-50/40 font-mono">
                      {item.presentCount}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/40 font-mono">
                      {item.lateCount}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-mono">
                      {item.leaveCount}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-mono">
                      {item.sickCount}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-mono">
                      {item.dutyCount}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-rose-700 bg-rose-50/40 font-mono">
                      {item.alphaCount}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.attendancePercentage >= 90
                                ? 'bg-emerald-600'
                                : item.attendancePercentage >= 75
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.attendancePercentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 font-mono text-[11px] w-9 text-right">
                          {item.attendancePercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official PDF Print Preview Modal with Kop Surat SDIT Al Izzah Pohuwato */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Modal Control Bar (Not Printed) */}
            <div className="p-3 bg-slate-800 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-bold flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Pratinjau Cetak Lembar Pengesahan Laporan Presensi Resmi</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div
              id="printable-report"
              className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-serif"
            >
              {/* KOP RESMI SDIT AL IZZAH POHUWATO */}
              <div className="border-b-4 border-double border-slate-900 pb-3 text-center relative mb-5">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-800 flex items-center justify-center text-emerald-800 shrink-0">
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-800">
                      YAYASAN AL IZZAH POHUWATO
                    </h3>
                    <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-950 uppercase mt-0.5">
                      SEKOLAH DASAR ISLAM TERPADU (SDIT) AL IZZAH
                    </h1>
                    <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                      NPSN: {config.npsn || '69900123'} • Akreditasi: A (Amat Baik) • Terdaftar di Kemenag & Kemendikbudristek
                    </p>
                    <p className="text-[10px] text-slate-600 font-sans">
                      Alamat: Jl. Trans Sulawesi, Kompleks Al Izzah Islamic Center, Marisa, Kab. Pohuwato, Gorontalo 96265
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans italic">
                      Email: sdit.alizzah.pohuwato@gmail.com | Website: alizzah.sch.id
                    </p>
                  </div>
                </div>
              </div>

              {/* Title & Period */}
              <div className="text-center my-4 font-sans">
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider underline">
                  LAPORAN REKAPITULASI PRESENSI KEPEGAWAIAN
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Periode: <strong className="text-slate-900">{periodDisplay}</strong>
                </p>
              </div>

              {/* Printable Table */}
              <div className="mt-4 font-sans">
                <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                      <th className="border border-slate-400 p-1.5 w-8">No</th>
                      <th className="border border-slate-400 p-1.5 text-left">Nama Pegawai & NIP</th>
                      <th className="border border-slate-400 p-1.5">Jabatan</th>
                      <th className="border border-slate-400 p-1.5 w-8">H</th>
                      <th className="border border-slate-400 p-1.5 w-8">T</th>
                      <th className="border border-slate-400 p-1.5 w-8">I</th>
                      <th className="border border-slate-400 p-1.5 w-8">S</th>
                      <th className="border border-slate-400 p-1.5 w-8">D</th>
                      <th className="border border-slate-400 p-1.5 w-8">A</th>
                      <th className="border border-slate-400 p-1.5 w-16">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recapData.map((item, idx) => (
                      <tr key={item.employeeId} className="border-b border-slate-300">
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5">
                          <strong>{item.name}</strong>
                          <span className="block text-[10px] text-slate-600 font-mono">
                            NIP: {item.nip}
                          </span>
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">{item.position}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{item.presentCount}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{item.lateCount}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{item.leaveCount}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{item.sickCount}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{item.dutyCount}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-700">{item.alphaCount}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">
                          {item.attendancePercentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-400 text-center">
                      <td colSpan={3} className="border border-slate-400 p-1.5 text-right pr-3">
                        TOTAL REKAPITULASI:
                      </td>
                      <td className="border border-slate-400 p-1.5">{totalHadir}</td>
                      <td className="border border-slate-400 p-1.5">{totalTerlambat}</td>
                      <td className="border border-slate-400 p-1.5">-</td>
                      <td className="border border-slate-400 p-1.5">-</td>
                      <td className="border border-slate-400 p-1.5">-</td>
                      <td className="border border-slate-400 p-1.5 text-rose-700">{totalAlpa}</td>
                      <td className="border border-slate-400 p-1.5">{avgAttendance}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures Section (KOLOM TANDA TANGAN KEPALA SEKOLAH & OPERATOR) */}
              <div className="mt-8 pt-4 flex items-start justify-between font-sans text-xs text-slate-800">
                {/* Operator Signature */}
                <div className="text-center w-56">
                  <p className="text-slate-500">Diverifikasi oleh:</p>
                  <p className="font-bold text-slate-900 mt-1">Operator Absensi & Kepegawaian</p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan ]</span>
                  </div>
                  <p className="font-bold text-slate-900 underline">{config.operatorName}</p>
                  <p className="text-[11px] text-slate-600 font-mono">NIP. {config.operatorNip}</p>
                </div>

                {/* Headmaster Signature */}
                <div className="text-center w-64">
                  <p className="text-slate-700">
                    Pohuwato,{' '}
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="font-bold text-slate-900 mt-1">
                    Mengetahui,
                    <br />
                    Kepala Sekolah SDIT Al Izzah Pohuwato
                  </p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan & Cap Sekolah ]</span>
                  </div>
                  <p className="font-bold text-slate-900 underline">{config.headmasterName}</p>
                  <p className="text-[11px] text-slate-600 font-mono">NIP. {config.headmasterNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
