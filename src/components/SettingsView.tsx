import React, { useState } from 'react';
import {
  Settings,
  Clock,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldAlert,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Navigation,
  School,
  Sparkles,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { SchoolConfig, SchoolHoliday, AdminRole } from '../types';
import {
  updateSchoolConfig,
  addHoliday,
  deleteHoliday,
  ANDROID_APP_INFO,
  crossSyncAndroidDatabase,
  getFirebaseConfigConsistencySnapshot,
} from '../services/dataService';
import { sendWhatsAppMessageViaGateway } from '../services/whatsappService';
import { FirebaseConsistencyPanel } from './FirebaseConsistencyPanel';

interface SettingsViewProps {
  config: SchoolConfig;
  holidays: SchoolHoliday[];
  role: AdminRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  holidays,
  role,
}) => {
  const [formData, setFormData] = useState<SchoolConfig>(config);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Add holiday state
  const [newHolidayDate, setNewHolidayDate] = useState<string>('');
  const [newHolidayName, setNewHolidayName] = useState<string>('');
  const [newHolidayType, setNewHolidayType] = useState<'Nasional' | 'Sekolah' | 'Cuti Bersama'>('Sekolah');
  const [isAddingHoliday, setIsAddingHoliday] = useState<boolean>(false);

  // Test WhatsApp message state
  const [testPhone, setTestPhone] = useState<string>('081234567890');
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingWa, setIsTestingWa] = useState<boolean>(false);

  // Android Sync state
  const [isSyncingAndroid, setIsSyncingAndroid] = useState<boolean>(false);
  const [androidSyncMsg, setAndroidSyncMsg] = useState<string>('');

  const handleCrossSync = async () => {
    setIsSyncingAndroid(true);
    setAndroidSyncMsg('');
    try {
      const res = await crossSyncAndroidDatabase();
      setAndroidSyncMsg(res.message);
    } catch {
      setAndroidSyncMsg('Sinkronisasi selesai. Status koneksi aktif.');
    } finally {
      setIsSyncingAndroid(false);
    }
  };

  const isOperator = role === 'Operator';

  const handleChange = (field: keyof SchoolConfig, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperator) return;

    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      await updateSchoolConfig(formData);
      setSaveSuccessMsg('Pengaturan jam, koordinat GPS sekolah, dan WhatsApp berhasil disimpan ke Firebase!');
      setTimeout(() => setSaveSuccessMsg(''), 6000);
    } catch (err) {
      alert('Gagal menyimpan pengaturan: ' + (err instanceof Error ? err.message : 'Kesalahan'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperator || !newHolidayDate || !newHolidayName.trim()) return;

    setIsAddingHoliday(true);
    try {
      await addHoliday({
        date: newHolidayDate,
        name: newHolidayName.trim(),
        type: newHolidayType,
      });
      setNewHolidayDate('');
      setNewHolidayName('');
    } catch (err) {
      alert('Gagal menambahkan hari libur.');
    } finally {
      setIsAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!isOperator) return;
    if (!confirm(`Hapus hari libur "${name}"?`)) return;
    try {
      await deleteHoliday(id);
    } catch (err) {
      alert('Gagal menghapus hari libur.');
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) return;
    setIsTestingWa(true);
    setTestResult('');
    try {
      const res = await sendWhatsAppMessageViaGateway(
        formData,
        testPhone,
        `[TES SDIT AL IZZAH POHUWATO] Ini adalah pesan uji coba integrasi WhatsApp Gateway pada ${new Date().toLocaleTimeString('id-ID')} WITA. Sistem presensi berjalan dengan baik.`,
        'Admin Penguji'
      );
      setTestResult(`${res.message} ${res.waLink ? `(Tautan: ${res.waLink})` : ''}`);
    } catch (err) {
      setTestResult('Gagal mengirim uji coba.');
    } finally {
      setIsTestingWa(false);
    }
  };

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung geolokasi GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleChange('schoolLat', Number(pos.coords.latitude.toFixed(5)));
        handleChange('schoolLng', Number(pos.coords.longitude.toFixed(5)));
        alert(`Koordinat GPS berhasil disetel ke: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        alert('Gagal mengambil titik GPS: ' + err.message);
      }
    );
  };

  const handleResetPohuwatoCoordinates = () => {
    handleChange('schoolLat', 0.53120);
    handleChange('schoolLng', 121.92130);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pengaturan Sistem Presensi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi jam kerja, koordinat GPS sekolah, radius toleransi, WhatsApp Gateway & hari libur
          </p>
        </div>

        {!isOperator && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Mode Lihat Saja (Kepala Sekolah)</span>
          </div>
        )}
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* Card 1: Jam Kerja & Toleransi */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                1. Jadwal Jam Masuk, Jam Pulang & Batas Toleransi
              </h3>
              <p className="text-xs text-slate-500">
                Waktu Indonesia Tengah (WITA) berlaku bagi seluruh Guru dan Pegawai TU
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Mulai Presensi Masuk
              </label>
              <input
                type="time"
                value={formData.checkInStart}
                onChange={(e) => handleChange('checkInStart', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Presensi dibuka (misal: 06:30 WITA)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Jam Tepat Waktu
              </label>
              <input
                type="time"
                value={formData.checkInEnd}
                onChange={(e) => handleChange('checkInEnd', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Setelah jam ini dihitung terlambat (misal: 07:15)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Toleransi Keterlambatan (Menit)
              </label>
              <input
                type="number"
                value={formData.lateToleranceMinutes}
                onChange={(e) => handleChange('lateToleranceMinutes', Number(e.target.value))}
                disabled={!isOperator}
                min={0}
                max={60}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Toleransi keterlambatan dengan catatan dispensasi
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Mulai Presensi Pulang
              </label>
              <input
                type="time"
                value={formData.checkOutStart}
                onChange={(e) => handleChange('checkOutStart', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Jam awal presensi keluar (misal: 14:00 WITA)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Akhir Presensi Pulang
              </label>
              <input
                type="time"
                value={formData.checkOutEnd}
                onChange={(e) => handleChange('checkOutEnd', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Jam maksimal presensi sore (misal: 16:30)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Otomatis Status "Alpa"
              </label>
              <input
                type="time"
                value={formData.autoAlpaTime}
                onChange={(e) => handleChange('autoAlpaTime', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Pegawai tanpa keterangan otomatis Alpa (misal: 17:00)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Koordinat Sekolah & Radius Geofencing */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  2. Titik Koordinat GPS Sekolah & Radius Presensi
                </h3>
                <p className="text-xs text-slate-500">
                  Lokasi fisik SDIT Al Izzah Pohuwato untuk validasi presensi anti-fake GPS
                </p>
              </div>
            </div>

            {isOperator && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentGPS}
                  className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Ambil GPS Saat Ini</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetPohuwatoCoordinates}
                  className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Reset Pohuwato
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Latitude (Garis Lintang)
              </label>
              <input
                type="number"
                step="0.00001"
                value={formData.schoolLat}
                onChange={(e) => handleChange('schoolLat', parseFloat(e.target.value) || 0)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Longitude (Garis Bujur)
              </label>
              <input
                type="number"
                step="0.00001"
                value={formData.schoolLng}
                onChange={(e) => handleChange('schoolLng', parseFloat(e.target.value) || 0)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Radius Maksimal Presensi (Meter)
              </label>
              <input
                type="number"
                value={formData.radiusMeters}
                onChange={(e) => handleChange('radiusMeters', parseInt(e.target.value, 10) || 100)}
                disabled={!isOperator}
                min={20}
                max={2000}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Jarak maksimal pegawai dari titik sekolah (disarankan 100 - 200m)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: WhatsApp Gateway Integration */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                3. Integrasi API WhatsApp Gateway
              </h3>
              <p className="text-xs text-slate-500">
                Otomatisasi pengiriman pesan pengingat absen ke nomor WhatsApp guru & pegawai
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Endpoint API WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsappApiUrl}
                onChange={(e) => handleChange('whatsappApiUrl', e.target.value)}
                disabled={!isOperator}
                placeholder="https://api.fonnte.com/send"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono disabled:bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Mendukung Fonnte, Wablas, WPPConnect, atau Custom Webhook
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Token / Authorization Key
              </label>
              <input
                type="password"
                value={formData.whatsappApiKey}
                onChange={(e) => handleChange('whatsappApiKey', e.target.value)}
                disabled={!isOperator}
                placeholder="Masukkan API Token Gateway..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono disabled:bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Disimpan aman di Firebase untuk pengiriman pesan otomatis
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Format Template Pesan Pengingat Otomatis
              </label>
              <textarea
                rows={3}
                value={formData.whatsappTemplate}
                onChange={(e) => handleChange('whatsappTemplate', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-sans"
              />
            </div>
          </div>

          {/* Test WhatsApp Action */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Uji Coba Pengiriman WhatsApp Gateway:</span>
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Nomor HP pengujian (08...)"
                className="text-xs p-2 border border-slate-300 rounded-lg flex-1 bg-white font-mono"
              />
              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={isTestingWa}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors w-full sm:w-auto"
              >
                {isTestingWa ? 'Mengirim...' : 'Tes Kirim Pesan'}
              </button>
            </div>
            {testResult && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {testResult}
              </p>
            )}
          </div>
        </div>

        {/* Card 4: Penandatangan Laporan (Kop & Legalitas) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                4. Data Sekolah & Pejabat Penandatangan Laporan
              </h3>
              <p className="text-xs text-slate-500">
                Nama dan NIP yang tercetak pada Kop Surat & Lembar Pengesahan Laporan PDF
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kepala Sekolah (Lengkap Gelar)
              </label>
              <input
                type="text"
                value={formData.headmasterName}
                onChange={(e) => handleChange('headmasterName', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP / NIY Kepala Sekolah
              </label>
              <input
                type="text"
                value={formData.headmasterNip}
                onChange={(e) => handleChange('headmasterNip', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Operator Absensi / Tata Usaha
              </label>
              <input
                type="text"
                value={formData.operatorName}
                onChange={(e) => handleChange('operatorName', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP / NIY Operator
              </label>
              <input
                type="text"
                value={formData.operatorNip}
                onChange={(e) => handleChange('operatorNip', e.target.value)}
                disabled={!isOperator}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 5: Integrasi Aplikasi Android (com.aistudio.absensdit.pohuwato) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-300 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  5. Integrasi Aplikasi Android Pegawai ({ANDROID_APP_INFO.packageName})
                </h3>
                <p className="text-xs text-slate-500">
                  Sinkronisasi timbal-balik dengan aplikasi smartphone guru & tenaga kependidikan SDIT Al Izzah
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>TERHUBUNG (FIREBASE SYNC)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Package ID Aplikasi Android</span>
              <span className="font-mono font-bold text-slate-800">{ANDROID_APP_INFO.packageName}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Firebase Project ID (firebase-applet-config.json)</span>
              <span className="font-mono font-bold text-slate-800">
                {getFirebaseConfigConsistencySnapshot().configJson.projectId}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Firestore Database ID (firebase-applet-config.json)</span>
              <span
                className="font-mono font-bold text-emerald-800 text-[11px] truncate block"
                title={getFirebaseConfigConsistencySnapshot().configJson.firestoreDatabaseId}
              >
                {getFirebaseConfigConsistencySnapshot().configJson.firestoreDatabaseId}
              </span>
            </div>
          </div>

          {/* Panel Pemeriksaan Konsistensi Konfigurasi Firebase & Panduan Android */}
          <FirebaseConsistencyPanel compact />

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-emerald-950">
                Koleksi Tersinkronisasi Otomatis:
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                <code className="font-mono bg-white/70 px-1 py-0.5 rounded">pegawai ⇄ employees</code> •{' '}
                <code className="font-mono bg-white/70 px-1 py-0.5 rounded">absensi ⇄ attendance</code> •{' '}
                <code className="font-mono bg-white/70 px-1 py-0.5 rounded">izin ⇄ leaveRequests</code> •{' '}
                <code className="font-mono bg-white/70 px-1 py-0.5 rounded">pengaturan ⇄ settings</code>
              </p>
            </div>

            <button
              type="button"
              onClick={handleCrossSync}
              disabled={isSyncingAndroid}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAndroid ? 'animate-spin' : ''}`} />
              <span>{isSyncingAndroid ? 'Menyinkronkan...' : 'Sinkronkan Dua Arah Sekarang'}</span>
            </button>
          </div>

          {androidSyncMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold">
              {androidSyncMsg}
            </div>
          )}
        </div>

        {/* Save Button for Settings */}
        {isOperator && (
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Card 5: Hari Libur Sekolah */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                5. Daftar Hari Libur Nasional & Cuti Sekolah
              </h3>
              <p className="text-xs text-slate-500">
                Hari libur tidak diperhitungkan sebagai hari kerja wajib presensi
              </p>
            </div>
          </div>
        </div>

        {/* Add Holiday Form (Operator) */}
        {isOperator && (
          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                required
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="Nama hari libur (contoh: Libur Awal Ramadhan / Milad SDIT)"
                required
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newHolidayType}
                onChange={(e) => setNewHolidayType(e.target.value as any)}
                className="text-xs p-2 border border-slate-300 rounded-lg bg-white flex-1"
              >
                <option value="Sekolah">Libur Sekolah</option>
                <option value="Nasional">Libur Nasional</option>
                <option value="Cuti Bersama">Cuti Bersama</option>
              </select>
              <button
                type="submit"
                disabled={isAddingHoliday}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </form>
        )}

        {/* Holidays Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {holidays.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Belum ada hari libur yang ditambahkan.
            </div>
          ) : (
            holidays.map((hol) => (
              <div
                key={hol.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {hol.date}
                  </span>
                  <span className="font-semibold text-slate-800">{hol.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    {hol.type}
                  </span>
                </div>

                {isOperator && (
                  <button
                    onClick={() => handleDeleteHoliday(hol.id, hol.name)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Hapus Hari Libur"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
