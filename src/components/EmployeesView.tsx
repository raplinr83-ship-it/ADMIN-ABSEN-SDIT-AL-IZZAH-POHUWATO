import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Smartphone,
  RotateCcw,
  Edit2,
  Trash2,
  Phone,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  X,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  KeyRound,
  Info,
  Check,
} from 'lucide-react';
import { Employee, EmployeeRole, AdminRole } from '../types';
import {
  addEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeeDevice,
} from '../services/dataService';
import { generateWhatsAppLink } from '../services/whatsappService';

interface EmployeesViewProps {
  employees: Employee[];
  role: AdminRole;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ employees, role }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'Semua' | 'Guru' | 'TU'>('Semua');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<'Semua' | 'Terdaftar' | 'Belum'>('Semua');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [nip, setNip] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole>('Guru');
  const [phone, setPhone] = useState<string>('');
  const [pin, setPin] = useState<string>('123456');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Reset Device Modal State
  const [resetTargetEmployee, setResetTargetEmployee] = useState<Employee | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Delete Confirm Modal State
  const [deleteTargetEmployee, setDeleteTargetEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Success Notification
  const [alertMessage, setAlertMessage] = useState<string>('');

  const isOperator = role === 'Operator';

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole =
      selectedRoleFilter === 'Semua' || emp.role === selectedRoleFilter;

    const matchDevice =
      selectedDeviceFilter === 'Semua' ||
      (selectedDeviceFilter === 'Terdaftar' && Boolean(emp.deviceId)) ||
      (selectedDeviceFilter === 'Belum' && !emp.deviceId);

    return matchSearch && matchRole && matchDevice;
  });

  const handleOpenAddModal = () => {
    if (!isOperator) return;
    setEditingEmployee(null);
    setNip('');
    setName('');
    setPosition('');
    setEmployeeRole('Guru');
    setPhone('');
    setPin('123456');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    if (!isOperator) return;
    setEditingEmployee(emp);
    setNip(emp.nip);
    setName(emp.name);
    setPosition(emp.position);
    setEmployeeRole(emp.role);
    setPhone(emp.phone);
    setPin(emp.pin || '123456');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperator) return;
    setFormError('');

    if (!nip.trim() || !name.trim() || !position.trim() || !phone.trim()) {
      setFormError('Harap lengkapi semua kolom data pegawai.');
      return;
    }

    if (pin.trim().length < 4) {
      setFormError('PIN keamanan harus minimal 4 hingga 6 digit angka.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        await updateEmployee(
          editingEmployee.id,
          {
            nip: nip.trim(),
            name: name.trim(),
            position: position.trim(),
            role: employeeRole,
            phone: phone.trim(),
            pin: pin.trim() || '123456',
          },
          editingEmployee.nip
        );
        setAlertMessage(`Data pegawai ${name} (NIP: ${nip}) berhasil diperbarui & disinkronkan ke HP.`);
      } else {
        await addEmployee({
          nip: nip.trim(),
          name: name.trim(),
          position: position.trim(),
          role: employeeRole,
          phone: phone.trim(),
          pin: pin.trim() || '123456',
          deviceId: null,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        setAlertMessage(`Pegawai baru ${name} (NIP: ${nip}) berhasil ditambahkan dan disinkronkan ke database aplikasi HP.`);
      }
      setIsFormModalOpen(false);
      setTimeout(() => setAlertMessage(''), 6000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data pegawai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteResetDevice = async () => {
    if (!resetTargetEmployee || !isOperator) return;
    setIsResetting(true);
    try {
      await resetEmployeeDevice(resetTargetEmployee.id, resetTargetEmployee.nip);
      setAlertMessage(
        `Perangkat HP untuk pegawai ${resetTargetEmployee.name} berhasil di-reset. Status kembali "Belum terdaftar", dan pegawai sekarang dapat mendaftarkan HP baru pada aplikasi absensi.`
      );
      setResetTargetEmployee(null);
      setTimeout(() => setAlertMessage(''), 7000);
    } catch (err) {
      alert('Gagal me-reset perangkat: ' + (err instanceof Error ? err.message : 'Kesalahan jaringan'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetEmployee || !isOperator) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deleteTargetEmployee.id, deleteTargetEmployee.nip);
      setAlertMessage(`Data pegawai ${deleteTargetEmployee.name} berhasil dihapus dari database.`);
      setDeleteTargetEmployee(null);
      setTimeout(() => setAlertMessage(''), 5000);
    } catch (err) {
      alert('Gagal menghapus data pegawai: ' + (err instanceof Error ? err.message : 'Kesalahan jaringan'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Data Master Pegawai</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen Guru & Tenaga Kependidikan SDIT Al Izzah Pohuwato ({employees.length} terdaftar)
          </p>
        </div>

        {isOperator ? (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai Baru</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Mode Lihat Saja (Kepala Sekolah)</span>
          </div>
        )}
      </div>

      {alertMessage && (
        <div className="p-3.5 bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage('')} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Help / Synchronization Guide Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 text-xs space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Sinkronisasi Aplikasi Android Pegawai (com.aistudio.absensdit.pohuwato)</span>
          </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-300">
            Terhubung Firebase
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] text-slate-600">
          <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/60 space-y-1 shadow-xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              1. Cara Pegawai Login di HP
            </span>
            <p className="leading-relaxed">
              Pegawai membuka aplikasi di HP, mengetikkan <strong>NIP</strong> terdaftar dan <strong>PIN 6-digit</strong> (bawaan: <code className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-emerald-700 font-bold">123456</code>).
            </p>
          </div>
          <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/60 space-y-1 shadow-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              2. Status "Belum terdaftar"?
            </span>
            <p className="leading-relaxed">
              Status <em>"Belum terdaftar"</em> berarti pegawai baru didaftarkan dan belum pernah login di HP. Saat pegawai tap <strong>"MASUK & VERIFIKASI"</strong> di HP, ID perangkat otomatis terikat & terdaftar!
            </p>
          </div>
          <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/60 space-y-1 shadow-xs">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              3. Jika Pegawai Ganti HP
            </span>
            <p className="leading-relaxed">
              Klik tombol putar <strong className="text-amber-700">"Reset Perangkat"</strong> (ikon 🔄) pada baris pegawai. Status kembali <em>Belum terdaftar</em> dan pegawai bisa langsung login di smartphone barunya.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan NIP, nama lengkap, jabatan, atau nomor HP..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['Semua', 'Guru', 'TU'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedRoleFilter === r
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'Semua' ? 'Semua Peran' : r}
                </button>
              ))}
            </div>

            {/* Device Filters */}
            <select
              value={selectedDeviceFilter}
              onChange={(e) => setSelectedDeviceFilter(e.target.value as any)}
              className="text-xs py-1.5 px-3 border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Status HP</option>
              <option value="Terdaftar">HP Terdaftar</option>
              <option value="Belum">HP Belum Terdaftar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">Tidak ada data pegawai yang sesuai</p>
            <p>Coba ubah kata kunci pencarian atau filter peranan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold tracking-wider uppercase text-[11px]">
                  <th className="py-3.5 px-4">Pegawai & NIP</th>
                  <th className="py-3.5 px-4">Jabatan & Tugas</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">No. WhatsApp / HP</th>
                  <th className="py-3.5 px-4">Perangkat HP</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const hasDevice = Boolean(emp.deviceId);
                  const waChatLink = generateWhatsAppLink(
                    emp.phone,
                    `Assalamu'alaikum wr wb, Ustadz/Ustadzah ${emp.name}. Kami dari Bagian Kepegawaian SDIT Al Izzah Pohuwato ingin menginformasikan...`
                  );

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & NIP & PIN */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
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
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-600 font-mono font-semibold">
                                NIP: {emp.nip}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200" title="PIN 6-Digit untuk Login Aplikasi HP">
                                <KeyRound className="w-2.5 h-2.5" />
                                <span>PIN: {emp.pin || '123456'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {emp.position}
                      </td>

                      {/* Role (Guru / TU) */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            emp.role === 'Guru'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {emp.role === 'Guru' ? (
                            <GraduationCap className="w-3.5 h-3.5" />
                          ) : (
                            <Briefcase className="w-3.5 h-3.5" />
                          )}
                          <span>{emp.role}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700">{emp.phone}</span>
                          <a
                            href={waChatLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            title="Kirim pesan WhatsApp langsung"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Device Status */}
                      <td className="py-3 px-4">
                        {hasDevice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold" title={`Terkunci pada perangkat ID: ${emp.deviceId}`}>
                              <Smartphone className="w-3 h-3 text-emerald-600" />
                              <span className="truncate max-w-[90px]">{emp.deviceId}</span>
                            </span>
                            {isOperator && (
                              <button
                                onClick={() => setResetTargetEmployee(emp)}
                                title="Reset ID Perangkat (Pegawai Ganti HP)"
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                              Belum terdaftar
                            </span>
                            <p className="text-[10px] text-slate-400 leading-tight">
                              Terdaftar otomatis saat login HP
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {isOperator ? (
                            <>
                              <button
                                onClick={() => setResetTargetEmployee(emp)}
                                title="Tombol Reset Perangkat (Jika Pegawai Ganti HP)"
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(emp)}
                                title="Ubah Data Pegawai"
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTargetEmployee(emp)}
                                title="Hapus Pegawai"
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Lihat Saja</span>
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

      {/* Add / Edit Employee Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/70">
              <h3 className="text-sm font-bold text-slate-800">
                {editingEmployee ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru SDIT'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Pegawai (NIP / NUPTK / NIY)
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 198405122010011008"
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ustadzah Nurul Hidayah, S.Pd."
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status / Kategori Pegawai
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmployeeRole('Guru')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                      employeeRole === 'Guru'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Tenaga Pendidik (Guru)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeRole('TU')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                      employeeRole === 'TU'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Tenaga Kependidikan (TU)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Penugasan di Sekolah
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: Wali Kelas 3 / Guru Al-Qur'an / Tata Usaha"
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / WhatsApp Aktif
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Digunakan untuk menerima notifikasi pengingat presensi otomatis via WhatsApp Gateway.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PIN 6-Digit (Login Aplikasi Android Pegawai)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Bawaan: 123456</span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest text-emerald-950 font-bold bg-emerald-50/30"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  PIN ini dimasukkan oleh pegawai bersama NIP saat login di aplikasi HP <span className="font-mono font-medium text-emerald-700">com.aistudio.absensdit.pohuwato</span>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : editingEmployee ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Device Confirmation Modal */}
      {resetTargetEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-amber-200">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Konfirmasi Reset Perangkat HP
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah pegawai <strong className="text-slate-800">{resetTargetEmployee.name}</strong> mengganti perangkat HP?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Dampak Tindakan Reset:</span>
                </p>
                <p className="text-amber-800 text-[11px]">
                  ID perangkat yang terdaftar saat ini ({resetTargetEmployee.deviceId || 'ID Aktif'}) akan dihapus. Pegawai dapat langsung login dan mengikat perangkat smartphone barunya saat melakukan presensi berikutnya.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetTargetEmployee(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteResetDevice}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Mereset...' : 'Ya, Reset Perangkat HP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {deleteTargetEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-rose-200">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Hapus Data Pegawai
              </h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus data pegawai{' '}
                <strong className="text-slate-800">{deleteTargetEmployee.name}</strong> (NIP: {deleteTargetEmployee.nip})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetEmployee(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 rounded-xl shadow-xs"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Pegawai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
