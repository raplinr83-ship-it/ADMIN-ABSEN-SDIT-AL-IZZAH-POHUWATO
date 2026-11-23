import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  Edit,
  MessageSquare,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  SchoolConfig,
  AdminRole,
  AttendanceStatus,
} from '../types';
import {
  getTodayDateString,
  updateAttendanceRecord,
} from '../services/dataService';
import { generateWhatsAppLink } from '../services/whatsappService';

interface AttendanceViewProps {
  attendanceRecords: AttendanceRecord[];
  employees: Employee[];
  config: SchoolConfig;
  role: AdminRole;
  onViewPhoto: (imageUrl: string, title: string, details?: any) => void;
  onViewMap: (record: AttendanceRecord) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendanceRecords,
  employees,
  config,
  role,
  onViewPhoto,
  onViewMap,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [roleFilter, setRoleFilter] = useState<'Semua' | 'Guru' | 'TU'>('Semua');

  // Edit status modal state (for Operator)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('Hadir');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const isOperator = role === 'Operator';
  const isToday = selectedDate === getTodayDateString();

  // Combine attendance records with employees for the selected date
  const recordsOnDate = attendanceRecords.filter((r) => r.date === selectedDate);
  const recordMap = new Map(recordsOnDate.map((r) => [r.employeeId, r]));

  // Build unified view: show recorded and unrecorded active employees
  const displayItems = employees
    .filter((emp) => emp.isActive)
    .map((emp) => {
      const record = recordMap.get(emp.id);
      return {
        employee: emp,
        record: record || null,
        status: record ? record.status : ('Belum Presensi' as const),
      };
    })
    .filter((item) => {
      // Search filter
      const matchSearch =
        item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.position.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchStatus =
        statusFilter === 'Semua' || item.status === statusFilter;

      // Role filter
      const matchRole =
        roleFilter === 'Semua' || item.employee.role === roleFilter;

      return matchSearch && matchStatus && matchRole;
    });

  // Calculate day metrics
  const totalRecorded = recordsOnDate.length;
  const presentCount = recordsOnDate.filter((r) => r.status === 'Hadir').length;
  const lateCount = recordsOnDate.filter((r) => r.status === 'Terlambat').length;
  const leaveCount = recordsOnDate.filter(
    (r) => r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Dinas'
  ).length;
  const alpaCount = recordsOnDate.filter((r) => r.status === 'Alpa').length;

  const handleOpenEdit = (rec: AttendanceRecord) => {
    if (!isOperator) return;
    setEditingRecord(rec);
    setNewStatus(rec.status);
    setNewNotes(rec.notes || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !isOperator) return;
    setIsUpdating(true);
    try {
      await updateAttendanceRecord(editingRecord.id, {
        status: newStatus,
        notes: newNotes,
      });
      setEditingRecord(null);
    } catch (err) {
      alert('Gagal memperbarui status absensi: ' + (err instanceof Error ? err.message : 'Kesalahan'));
    } finally {
      setIsUpdating(false);
    }
  };

  const shiftDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isToday ? 'Absensi Hari Ini' : `Absensi Tanggal: ${selectedDate}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabel real-time jam masuk, jam pulang, verifikasi foto selfie, dan titik peta GPS
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => shiftDate(-1)}
            title="Hari Sebelumnya"
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => shiftDate(1)}
            title="Hari Berikutnya"
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors"
            >
              Hari Ini
            </button>
          )}
        </div>
      </div>

      {/* Mini Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-500">Tercatat:</span>
          <span className="font-extrabold text-slate-800">{totalRecorded} Pegawai</span>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs flex items-center justify-between text-emerald-800">
          <span>Hadir Tepat:</span>
          <span className="font-extrabold">{presentCount}</span>
        </div>
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs flex items-center justify-between text-amber-800">
          <span>Terlambat:</span>
          <span className="font-extrabold">{lateCount}</span>
        </div>
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs flex items-center justify-between text-blue-800">
          <span>Izin/Sakit:</span>
          <span className="font-extrabold">{leaveCount}</span>
        </div>
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs flex items-center justify-between text-rose-800 col-span-2 sm:col-span-1">
          <span>Alpa:</span>
          <span className="font-extrabold">{alpaCount}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pegawai, NIP, atau jabatan..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Status Kehadiran</option>
            <option value="Hadir">Hadir Tepat Waktu</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Dinas">Dinas</option>
            <option value="Alpa">Alpa</option>
            <option value="Belum Presensi">Belum Presensi</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Kategori (Guru & TU)</option>
            <option value="Guru">Tenaga Pendidik (Guru)</option>
            <option value="TU">Tenaga Kependidikan (TU)</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {displayItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada catatan absensi yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold tracking-wider uppercase text-[11px]">
                  <th className="py-3.5 px-4">Pegawai</th>
                  <th className="py-3.5 px-4">Jam Masuk</th>
                  <th className="py-3.5 px-4">Jam Pulang</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Foto Selfie</th>
                  <th className="py-3.5 px-4">Lokasi GPS (Peta)</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayItems.map(({ employee: emp, record, status }) => {
                  const isPresent = status === 'Hadir';
                  const isLate = status === 'Terlambat';
                  const isSickOrLeave = status === 'Izin' || status === 'Sakit' || status === 'Dinas';
                  const isAlpa = status === 'Alpa';
                  const isUnrecorded = status === 'Belum Presensi';

                  const distance = record?.checkInDistance ?? 0;
                  const isWithinRadius = distance <= (config.radiusMeters || 150);

                  const waChatLink = generateWhatsAppLink(
                    emp.phone,
                    `Assalamu'alaikum wr wb, Ustadz/Ustadzah ${emp.name}...`
                  );

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                            {emp.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              {emp.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              NIP: {emp.nip} • {emp.position}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Check-in Time */}
                      <td className="py-3 px-4">
                        {record?.checkInTime ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{record.checkInTime}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Check-out Time */}
                      <td className="py-3 px-4">
                        {record?.checkOutTime ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{record.checkOutTime}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum Pulang</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isLate
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isSickOrLeave
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : isAlpa
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {status}
                        </span>
                        {record?.notes && (
                          <span className="block text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                            {record.notes}
                          </span>
                        )}
                      </td>

                      {/* Selfie Photo */}
                      <td className="py-3 px-4">
                        {record?.checkInPhoto ? (
                          <button
                            onClick={() =>
                              onViewPhoto(
                                record.checkInPhoto!,
                                `Foto Presensi Masuk - ${emp.name}`,
                                {
                                  employeeName: emp.name,
                                  nip: emp.nip,
                                  time: record.checkInTime,
                                  location: `${record.checkInDistance || 0}m dari sekolah`,
                                  status: record.status,
                                }
                              )
                            }
                            className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 group shadow-2xs"
                          >
                            <img
                              src={record.checkInPhoto}
                              alt={emp.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Tidak ada foto</span>
                        )}
                      </td>

                      {/* GPS Location & Map Button */}
                      <td className="py-3 px-4">
                        {record?.checkInLat ? (
                          <button
                            onClick={() => onViewMap(record)}
                            className="inline-flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors text-left"
                          >
                            <MapPin
                              className={`w-3.5 h-3.5 ${
                                isWithinRadius ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            />
                            <div>
                              <span className="font-bold text-slate-800 text-[11px] block">
                                {distance} meter
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  isWithinRadius ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {isWithinRadius ? 'Dalam Radius' : 'Luar Radius'}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={waChatLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Kirim pesan WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          {isOperator && record && (
                            <button
                              onClick={() => handleOpenEdit(record)}
                              title="Ubah Status / Catatan Absensi"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status Modal (for Operator) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-emerald-100 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/70">
              <h3 className="text-sm font-bold text-slate-800">
                Ubah Status Absensi Pegawai
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Pegawai
                </label>
                <p className="text-sm font-bold text-slate-800">
                  {editingRecord.employeeName} ({editingRecord.nip})
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Tanggal: {editingRecord.date} • Jam Masuk: {editingRecord.checkInTime || '-'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Kehadiran
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                >
                  <option value="Hadir">Hadir Tepat Waktu</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Dinas">Dinas Luar</option>
                  <option value="Alpa">Alpa (Tanpa Keterangan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Penyesuaian
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Contoh: Penyesuaian manual karena kendala jaringan di Pohuwato..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-xs"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
