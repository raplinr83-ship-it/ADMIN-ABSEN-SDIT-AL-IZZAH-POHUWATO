/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AdminUser,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  SchoolConfig,
  SchoolHoliday,
} from './types';
import {
  DEFAULT_CONFIG,
  subscribeEmployees,
  subscribeAttendance,
  subscribeLeaveRequests,
  subscribeSchoolConfig,
  subscribeHolidays,
  seedInitialData,
  getTodayDateString,
  runFirestoreDiagnostic,
  DiagnosticResult,
} from './services/dataService';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EmployeesView } from './components/EmployeesView';
import { AttendanceView } from './components/AttendanceView';
import { LeaveApprovalView } from './components/LeaveApprovalView';
import { SettingsView } from './components/SettingsView';
import { ReportView } from './components/ReportView';
import { LoginModal } from './components/LoginModal';
import { PhotoModal } from './components/PhotoModal';
import { MapModal } from './components/MapModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { AndroidSyncModal } from './components/AndroidSyncModal';
import {
  useAbsenConnection,
  FloatingConnectionNotification,
  ConnectionDetailsModal,
} from './components/ConnectionStatusNotification';
import { Sparkles, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Current logged in admin user
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('sdit_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Firestore Real-Time Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [config, setConfig] = useState<SchoolConfig>(DEFAULT_CONFIG);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals
  const [photoModalData, setPhotoModalData] = useState<{
    isOpen: boolean;
    imageUrl?: string;
    title: string;
    subtitle?: string;
    details?: any;
  }>({ isOpen: false, title: '' });

  const [mapModalData, setMapModalData] = useState<{
    isOpen: boolean;
    record?: AttendanceRecord;
  }>({ isOpen: false });

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [isAndroidSyncModalOpen, setIsAndroidSyncModalOpen] = useState<boolean>(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string>('');
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  // Status Terhubung Absen SDIT Al Izzah (Biru jika terhubung, Merah jika terputus)
  const { connection, checkConnection } = useAbsenConnection();
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);

  // Run Firestore diagnostic on component mount to test connection, auth, and data access
  useEffect(() => {
    runFirestoreDiagnostic()
      .then((res) => {
        setDiagnosticResult(res);
        if (!res.success) {
          console.warn('⚠️ [App Mount] Firestore diagnostic detected issues:', res.errors);
        } else {
          console.info('✅ [App Mount] Firestore diagnostic passed completely.');
        }
      })
      .catch((err) => {
        console.error('❌ [App Mount] Failed to run Firestore diagnostic:', err);
      });
  }, []);

  // Save session when currentUser changes
  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('sdit_admin_user', JSON.stringify(user));
    } catch {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('sdit_admin_user');
    } catch {}
  };

  // Real-Time Subscriptions to Firebase collections
  useEffect(() => {
    const unsubEmployees = subscribeEmployees((data) => {
      setEmployees(data);
      setIsLoaded(true);
    });

    const unsubAttendance = subscribeAttendance((data) => {
      setAttendanceRecords(data);
    });

    const unsubLeaves = subscribeLeaveRequests((data) => {
      setLeaveRequests(data);
    });

    const unsubConfig = subscribeSchoolConfig((cfg) => {
      setConfig(cfg);
    });

    const unsubHolidays = subscribeHolidays((hols) => {
      setHolidays(hols);
    });

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubLeaves();
      unsubConfig();
      unsubHolidays();
    };
  }, []);

  // Handler for Seeding Initial Demo Data for SDIT Al Izzah Pohuwato
  const handleExecuteSeed = async () => {
    setIsSeeding(true);
    setSeedMessage('');
    const res = await seedInitialData();
    setIsSeeding(false);
    setSeedMessage(res.message);
    if (res.success) {
      setTimeout(() => {
        setIsSeedModalOpen(false);
        setSeedMessage('');
      }, 2500);
    }
  };

  // Photo viewer modal trigger
  const handleViewPhoto = (imageUrl: string, title: string, details?: any) => {
    setPhotoModalData({
      isOpen: true,
      imageUrl,
      title,
      details,
    });
  };

  // Map viewer modal trigger
  const handleViewMap = (record: AttendanceRecord) => {
    setMapModalData({
      isOpen: true,
      record,
    });
  };

  // Manual sync refresh
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  // Unrecorded employees today
  const todayStr = getTodayDateString();
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const recordedEmpIds = new Set(todayRecords.map((r) => r.employeeId));
  const unrecordedEmployees = employees.filter(
    (e) => e.isActive && !recordedEmpIds.has(e.id)
  );

  const pendingLeavesCount = leaveRequests.filter((r) => r.status === 'pending').length;

  // Show login screen if not authenticated
  if (!currentUser) {
    return (
      <>
        <LoginModal
          onLoginSuccess={handleLogin}
          connection={connection}
          onOpenConnectionDetails={() => setIsConnectionModalOpen(true)}
        />
        <ConnectionDetailsModal
          isOpen={isConnectionModalOpen}
          onClose={() => setIsConnectionModalOpen(false)}
          connection={connection}
          onCheckAgain={checkConnection}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSeedModal={() => setIsSeedModalOpen(true)}
        onOpenAndroidSyncModal={() => setIsAndroidSyncModalOpen(true)}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
        connection={connection}
        onOpenConnectionDetails={() => setIsConnectionModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          role={currentUser.role}
          pendingLeavesCount={pendingLeavesCount}
          todayAbsentCount={unrecordedEmployees.length}
          connection={connection}
          onOpenConnectionDetails={() => setIsConnectionModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Empty database helper banner */}
          {isLoaded && employees.length === 0 && (
            <div className="mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Database className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Database Firebase Terhubung (Data Masih Kosong)
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Klik tombol di samping untuk mengisikan otomatis data master guru, staf TU, koordinat SDIT Al Izzah Pohuwato, dan riwayat presensi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExecuteSeed}
                disabled={isSeeding}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{isSeeding ? 'Mengisi Data...' : 'Inisialisasi Data Demo'}</span>
              </button>
            </div>
          )}

          {/* Tab Views */}
          {currentTab === 'dashboard' && (
            <DashboardView
              employees={employees}
              attendanceRecords={attendanceRecords}
              leaveRequests={leaveRequests}
              config={config}
              role={currentUser.role}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
              onOpenAndroidSyncModal={() => setIsAndroidSyncModalOpen(true)}
              onViewPhoto={handleViewPhoto}
              onViewMap={handleViewMap}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRefreshData={handleRefreshData}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesView employees={employees} role={currentUser.role} />
          )}

          {currentTab === 'attendance' && (
            <AttendanceView
              attendanceRecords={attendanceRecords}
              employees={employees}
              config={config}
              role={currentUser.role}
              onViewPhoto={handleViewPhoto}
              onViewMap={handleViewMap}
            />
          )}

          {currentTab === 'leave' && (
            <LeaveApprovalView
              leaveRequests={leaveRequests}
              role={currentUser.role}
              currentUser={currentUser}
              onViewPhoto={handleViewPhoto}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView config={config} holidays={holidays} role={currentUser.role} />
          )}

          {currentTab === 'reports' && (
            <ReportView
              employees={employees}
              attendanceRecords={attendanceRecords}
              config={config}
            />
          )}
        </main>
      </div>

      {/* Photo Viewer Modal */}
      <PhotoModal
        isOpen={photoModalData.isOpen}
        onClose={() => setPhotoModalData({ isOpen: false, title: '' })}
        imageUrl={photoModalData.imageUrl}
        title={photoModalData.title}
        subtitle={photoModalData.subtitle}
        details={photoModalData.details}
      />

      {/* GPS Location & Map Modal */}
      {mapModalData.record && (
        <MapModal
          isOpen={mapModalData.isOpen}
          onClose={() => setMapModalData({ isOpen: false })}
          config={config}
          checkInLat={mapModalData.record.checkInLat}
          checkInLng={mapModalData.record.checkInLng}
          checkInDistance={mapModalData.record.checkInDistance}
          employeeName={mapModalData.record.employeeName}
          checkInTime={mapModalData.record.checkInTime}
        />
      )}

      {/* WhatsApp Bulk Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        unrecordedEmployees={unrecordedEmployees}
        config={config}
      />

      {/* Android com.aistudio.absensdit.pohuwato Sync Modal */}
      <AndroidSyncModal
        isOpen={isAndroidSyncModalOpen}
        onClose={() => setIsAndroidSyncModalOpen(false)}
        totalEmployees={employees.length}
        totalTodayAttendance={todayRecords.length}
        initialDiagnostic={diagnosticResult}
      />

      {/* Initial Seed Confirmation Modal */}
      {isSeedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-emerald-200">
            <div className="p-6 space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Inisialisasi Data Demo SDIT Al Izzah
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan memasukkan data master 8 Guru & Pegawai TU SDIT Al Izzah Pohuwato, riwayat presensi 7 hari terakhir, permohonan izin contoh, dan konfigurasi jam sekolah ke dalam Firestore.
              </p>

              {seedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
                  {seedMessage}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSeedModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleExecuteSeed}
                disabled={isSeeding}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {isSeeding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Isi Data Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifikasi Floating Status Terhubung Absen SDIT Al Izzah (Biru jika terhubung, Merah jika terputus) */}
      <FloatingConnectionNotification
        connection={connection}
        onCheckAgain={checkConnection}
        onOpenDetails={() => setIsConnectionModalOpen(true)}
      />

      {/* Dialog Rincian Status Koneksi */}
      <ConnectionDetailsModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        connection={connection}
        onCheckAgain={checkConnection}
      />
    </div>
  );
}
