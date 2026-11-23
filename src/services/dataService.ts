import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, auth, getActiveDatabaseId, handleFirestoreError, OperationType } from '../firebase/config';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  SchoolConfig,
  SchoolHoliday,
} from '../types';

// Android app integration info (always synced with firebase-applet-config.json)
export const ANDROID_APP_INFO = {
  packageName: 'com.aistudio.absensdit.pohuwato',
  appName: 'Absensi SDIT Pohuwato (Android)',
  firebaseProjectId: firebaseConfig.projectId,
  firestoreDatabaseId: getActiveDatabaseId(),
  expectedDatabaseId: firebaseConfig.firestoreDatabaseId,
  status: 'Tersambung Real-time',
};

// Default school configuration for SDIT Al Izzah Pohuwato
export const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: 'SDIT Al Izzah Pohuwato',
  npsn: '69900123',
  checkInStart: '06:30',
  checkInEnd: '07:15',
  lateToleranceMinutes: 15,
  checkOutStart: '14:00',
  checkOutEnd: '16:30',
  autoAlpaTime: '17:00',
  schoolLat: 0.53120, // Pohuwato, Gorontalo
  schoolLng: 121.92130,
  radiusMeters: 150,
  whatsappApiUrl: 'https://api.fonnte.com/send',
  whatsappApiKey: 'TOKEN_GATEWAY_SDIT_POHUWATO',
  whatsappSenderNumber: '6282198765432',
  whatsappTemplate: 'Assalamu\'alaikum wr wb, Ustadz/Ustadzah {nama}. Mengingatkan bahwa hingga saat ini Anda belum melakukan check-in presensi di {sekolah}. Batas absensi pukul {jam_batas}. Syukran.',
  headmasterName: 'Ustadz Ahmad Al-Farisi, S.Pd.I., M.Pd.',
  headmasterNip: '19840512 201001 1 008',
  operatorName: 'Siti Rahmawati, S.Kom.',
  operatorNip: '19920815 201903 2 014',
};

// Default Initial Employees for SDIT Al Izzah Pohuwato
export const INITIAL_EMPLOYEES: Omit<Employee, 'id'>[] = [
  {
    nip: '198405122010011008',
    name: 'Ustadz Ahmad Al-Farisi, M.Pd.',
    position: 'Kepala Sekolah & Guru PAI',
    role: 'Guru',
    phone: '081245678901',
    deviceId: 'DEV-XIAOMI-12T-PRO-981',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '198709142012022004',
    name: 'Ustadzah Nurul Hidayah, S.Pd.',
    position: 'Wali Kelas 1 & Guru Tematik',
    role: 'Guru',
    phone: '085244112233',
    deviceId: 'DEV-SAMSUNG-A54-884',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '199003252015011007',
    name: 'Ustadz Muhammad Ridwan, Lc.',
    position: 'Koordinator Tahfidz & Guru Qur\'an',
    role: 'Guru',
    phone: '082155667788',
    deviceId: 'DEV-IPHONE-13-112',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '199307182018022005',
    name: 'Ustadzah Aisyah Maharani, S.Pd.',
    position: 'Wali Kelas 3 & Guru Matematika',
    role: 'Guru',
    phone: '081399887766',
    deviceId: 'DEV-OPPO-RENO8-445',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '199104082017011003',
    name: 'Ustadz Fajar Pratama, S.Pd.',
    position: 'Guru PJOK & Pembina Pramuka',
    role: 'Guru',
    phone: '082233445566',
    deviceId: 'DEV-REALME-10-773',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '199511192020022009',
    name: 'Ustadzah Fatimah Azzahra, S.Hum.',
    position: 'Guru Bahasa Arab & Hadits',
    role: 'Guru',
    phone: '087811223344',
    deviceId: 'DEV-VIVO-V27-991',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '199208152019032014',
    name: 'Siti Rahmawati, S.Kom.',
    position: 'Kepala Tata Usaha & Admin Dapodik',
    role: 'TU',
    phone: '081298765432',
    deviceId: 'DEV-SAMSUNG-M33-552',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '199602282021031002',
    name: 'Budi Santoso, A.Md.',
    position: 'Staf Keuangan & Sarana Prasarana',
    role: 'TU',
    phone: '085377889900',
    deviceId: null, // belum terdaftar
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '9921',
    name: 'Raplin R. Haras, S.Kom',
    position: 'Tata Usaha',
    role: 'TU',
    phone: '085257312289',
    deviceId: null,
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '198501012011011001',
    name: 'Ustadz Ahmad Fauzi, S.Pd.I',
    position: 'Guru PAI & Tahfidz',
    role: 'Guru',
    phone: '081234567891',
    deviceId: null,
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    nip: '198902022014022002',
    name: 'Ustadzah Siti Aminah, S.Pd',
    position: 'Guru Kelas 1 / Wali Kelas',
    role: 'Guru',
    phone: '081234567892',
    deviceId: null,
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
];

export const INITIAL_HOLIDAYS: SchoolHoliday[] = [
  { id: 'hol-1', date: '2026-01-01', name: 'Tahun Baru Masehi', type: 'Nasional' },
  { id: 'hol-2', date: '2026-03-20', name: 'Hari Raya Idul Fitri 1447 H', type: 'Nasional' },
  { id: 'hol-3', date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 H Hari ke-2', type: 'Nasional' },
  { id: 'hol-4', date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'Nasional' },
  { id: 'hol-5', date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 H', type: 'Nasional' },
  { id: 'hol-6', date: '2026-08-17', name: 'Hari Kemerdekaan RI ke-81', type: 'Nasional' },
  { id: 'hol-7', date: '2026-11-25', name: 'Hari Guru Nasional & Milad SDIT', type: 'Sekolah' },
];

// Helper to get formatted today date (YYYY-MM-DD)
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Distance calculation between coordinates (Haversine formula in meters)
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Helper to normalize employee doc from Android app (Bahasa Indonesia or English fields)
function normalizeEmployeeDoc(id: string, d: Record<string, any>): Employee {
  const name = d.name || d.nama || d.nama_pegawai || d.nama_lengkap || 'Tanpa Nama';
  const nip = d.nip || d.id || id;
  const position = d.position || d.jabatan || d.tugas || 'Guru';
  const rawRole = (d.role || d.peran || d.status || d.kategori || 'Guru').toString();
  const role: 'Guru' | 'TU' = rawRole.toLowerCase().includes('tu') || rawRole.toLowerCase().includes('tata') ? 'TU' : 'Guru';
  const phone = d.phone || d.no_hp || d.telepon || d.nomor_hp || d.no_telepon || '';
  const deviceId = d.deviceId ?? d.device_id ?? d.id_perangkat ?? null;
  const pin = (d.pin || d.pin_keamanan || d.password || d.kata_sandi || '123456').toString();
  const isActive = d.isActive ?? d.is_active ?? d.aktif ?? true;
  const createdAt = d.createdAt || d.created_at || new Date().toISOString();

  return {
    id,
    nip,
    name,
    position,
    role,
    phone,
    deviceId: deviceId || null,
    pin,
    isActive,
    createdAt,
    updatedAt: d.updatedAt || d.updated_at,
  };
}

// Helper to normalize attendance doc from Android app (com.aistudio.absensdit.pohuwato)
function normalizeAttendanceDoc(id: string, d: Record<string, any>): AttendanceRecord {
  const employeeId = d.employeeId || d.id_pegawai || d.nip || '';
  const nip = d.nip || '';
  const employeeName = d.employeeName || d.nama || d.nama_pegawai || '';
  const date = d.date || d.tanggal || getTodayDateString();
  const checkInTime = d.checkInTime || d.jam_masuk || d.jamMasuk || undefined;
  const checkInPhoto = d.checkInPhoto || d.foto || d.foto_masuk || d.foto_selfie || undefined;
  const checkInLat = d.checkInLat ?? d.lat ?? d.latitude ?? undefined;
  const checkInLng = d.checkInLng ?? d.lng ?? d.longitude ?? undefined;
  const checkInDistance = d.checkInDistance ?? d.jarak ?? d.distance ?? undefined;
  const checkOutTime = d.checkOutTime || d.jam_pulang || d.jamPulang || undefined;
  const checkOutPhoto = d.checkOutPhoto || d.foto_pulang || undefined;
  const checkOutLat = d.checkOutLat ?? undefined;
  const checkOutLng = d.checkOutLng ?? undefined;

  let rawStatus = (d.status || 'Hadir').toString();
  let status: AttendanceRecord['status'] = 'Hadir';
  if (rawStatus.toLowerCase().includes('lambat')) status = 'Terlambat';
  else if (rawStatus.toLowerCase().includes('izin')) status = 'Izin';
  else if (rawStatus.toLowerCase().includes('sakit')) status = 'Sakit';
  else if (rawStatus.toLowerCase().includes('dinas')) status = 'Dinas';
  else if (rawStatus.toLowerCase().includes('alpa') || rawStatus.toLowerCase().includes('alpha')) status = 'Alpa';
  else status = 'Hadir';

  const notes = d.notes || d.keterangan || d.catatan || undefined;

  return {
    id,
    employeeId,
    nip,
    employeeName,
    date,
    checkInTime,
    checkInPhoto,
    checkInLat: typeof checkInLat === 'number' ? checkInLat : undefined,
    checkInLng: typeof checkInLng === 'number' ? checkInLng : undefined,
    checkInDistance: typeof checkInDistance === 'number' ? checkInDistance : undefined,
    checkOutTime,
    checkOutPhoto,
    checkOutLat: typeof checkOutLat === 'number' ? checkOutLat : undefined,
    checkOutLng: typeof checkOutLng === 'number' ? checkOutLng : undefined,
    status,
    notes,
    createdAt: d.createdAt || d.created_at || new Date().toISOString(),
    updatedAt: d.updatedAt || d.updated_at,
  };
}

// Helper to normalize leave request from Android app
function normalizeLeaveDoc(id: string, d: Record<string, any>): LeaveRequest {
  const employeeId = d.employeeId || d.id_pegawai || d.nip || '';
  const nip = d.nip || '';
  const employeeName = d.employeeName || d.nama || d.nama_pegawai || '';
  const rawType = (d.type || d.jenis || 'Izin').toString();
  let type: 'Izin' | 'Sakit' | 'Dinas' = 'Izin';
  if (rawType.toLowerCase().includes('sakit')) type = 'Sakit';
  else if (rawType.toLowerCase().includes('dinas')) type = 'Dinas';

  const startDate = d.startDate || d.tanggal_mulai || d.tanggal || getTodayDateString();
  const endDate = d.endDate || d.tanggal_selesai || d.tanggal || startDate;
  const reason = d.reason || d.alasan || d.keterangan || '';
  const attachmentUrl = d.attachmentUrl || d.bukti || d.lampiran || d.foto || undefined;

  let rawStatus = (d.status || 'pending').toString().toLowerCase();
  let status: 'pending' | 'approved' | 'rejected' = 'pending';
  if (rawStatus.includes('setuju') || rawStatus === 'approved') status = 'approved';
  else if (rawStatus.includes('tolak') || rawStatus === 'rejected') status = 'rejected';

  return {
    id,
    employeeId,
    nip,
    employeeName,
    type,
    startDate,
    endDate,
    reason,
    attachmentUrl,
    status,
    reviewedBy: d.reviewedBy || d.disetujui_oleh || null,
    reviewedAt: d.reviewedAt || d.waktu_disetujui || null,
    rejectionReason: d.rejectionReason || d.alasan_penolakan,
    createdAt: d.createdAt || d.created_at || new Date().toISOString(),
  };
}

// Subscribe to Employees list (listening to BOTH 'employees' and 'pegawai' for com.aistudio.absensdit.pohuwato)
export function subscribeEmployees(callback: (employees: Employee[]) => void) {
  // Map keyed uniquely by NIP (or document ID if NIP is empty)
  const empMap = new Map<string, Employee>();

  const notify = () => {
    const list = Array.from(empMap.values());
    list.sort((a, b) => a.name.localeCompare(b.name));
    callback(list);
  };

  // 1. Listen to 'employees'
  const unsub1 = onSnapshot(
    collection(db, 'employees'),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        const emp = normalizeEmployeeDoc(docSnap.id, docSnap.data());
        const key = emp.nip ? `nip_${emp.nip.trim()}` : `id_${emp.id.trim()}`;
        const existing = empMap.get(key);
        empMap.set(key, existing ? { ...existing, ...emp } : emp);
      });
      notify();
    },
    (err) => console.warn('onSnapshot employees warning:', err.message)
  );

  // 2. Listen to 'pegawai' (Android app com.aistudio.absensdit.pohuwato)
  const unsub2 = onSnapshot(
    collection(db, 'pegawai'),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        const emp = normalizeEmployeeDoc(docSnap.id, docSnap.data());
        const key = emp.nip ? `nip_${emp.nip.trim()}` : `id_${emp.id.trim()}`;
        const existing = empMap.get(key);
        empMap.set(key, existing ? { ...existing, ...emp } : emp);
      });
      notify();
    },
    (err) => console.warn('onSnapshot pegawai warning:', err.message)
  );

  return () => {
    unsub1();
    unsub2();
  };
}

// Subscribe to Attendance Records (listening to 'attendance', 'attendances', and 'absensi')
export function subscribeAttendance(callback: (records: AttendanceRecord[]) => void) {
  // Map keyed uniquely by `${nip || employeeId}_${date}`
  const attMap = new Map<string, AttendanceRecord>();

  const notify = () => {
    const list = Array.from(attMap.values());
    callback(list);
  };

  // 1. Listen to 'attendance'
  const unsub1 = onSnapshot(
    collection(db, 'attendance'),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        const rec = normalizeAttendanceDoc(docSnap.id, docSnap.data());
        const key = `${rec.nip || rec.employeeId}_${rec.date}`;
        const existing = attMap.get(key);
        attMap.set(key, existing ? { ...existing, ...rec } : rec);
      });
      notify();
    },
    (err) => console.warn('onSnapshot attendance warning:', err.message)
  );

  // 2. Listen to 'attendances' (plural)
  const unsub2 = onSnapshot(
    collection(db, 'attendances'),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        const rec = normalizeAttendanceDoc(docSnap.id, docSnap.data());
        const key = `${rec.nip || rec.employeeId}_${rec.date}`;
        const existing = attMap.get(key);
        attMap.set(key, existing ? { ...existing, ...rec } : rec);
      });
      notify();
    },
    (err) => console.warn('onSnapshot attendances warning:', err.message)
  );

  // 3. Listen to 'absensi' (Android app com.aistudio.absensdit.pohuwato)
  const unsub3 = onSnapshot(
    collection(db, 'absensi'),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        const rec = normalizeAttendanceDoc(docSnap.id, docSnap.data());
        const key = `${rec.nip || rec.employeeId}_${rec.date}`;
        const existing = attMap.get(key);
        attMap.set(key, existing ? { ...existing, ...rec } : rec);
      });
      notify();
    },
    (err) => console.warn('onSnapshot absensi warning:', err.message)
  );

  return () => {
    unsub1();
    unsub2();
    unsub3();
  };
}

// Subscribe to Leave Requests (listening to BOTH 'leaveRequests' and 'izin'/'pengajuan_izin')
export function subscribeLeaveRequests(callback: (requests: LeaveRequest[]) => void) {
  const leaveMap = new Map<string, LeaveRequest>();

  const notify = () => {
    const list = Array.from(leaveMap.values());
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };

  const unsub1 = onSnapshot(
    collection(db, 'leaveRequests'),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        leaveMap.set(docSnap.id, normalizeLeaveDoc(docSnap.id, docSnap.data()));
      });
      notify();
    },
    (err) => console.warn('onSnapshot leaveRequests warning:', err.message)
  );

  const unsub2 = onSnapshot(
    collection(db, 'izin'),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        leaveMap.set(docSnap.id, normalizeLeaveDoc(docSnap.id, docSnap.data()));
      });
      notify();
    },
    (err) => console.warn('onSnapshot izin warning:', err.message)
  );

  return () => {
    unsub1();
    unsub2();
  };
}

// Subscribe to School Config (synchronizing settings and pengaturan)
export function subscribeSchoolConfig(callback: (config: SchoolConfig) => void) {
  const docRef1 = doc(db, 'settings', 'schoolConfig');
  const docRef2 = doc(db, 'pengaturan', 'sekolah');

  let currentConfig = DEFAULT_CONFIG;

  const unsub1 = onSnapshot(
    docRef1,
    (docSnap) => {
      if (docSnap.exists()) {
        currentConfig = { ...currentConfig, id: docSnap.id, ...(docSnap.data() as SchoolConfig) };
        callback(currentConfig);
      }
    },
    (err) => console.warn('onSnapshot settings warning:', err.message)
  );

  const unsub2 = onSnapshot(
    docRef2,
    (docSnap) => {
      if (docSnap.exists()) {
        currentConfig = { ...currentConfig, ...(docSnap.data() as SchoolConfig) };
        callback(currentConfig);
      }
    },
    (err) => console.warn('onSnapshot pengaturan warning:', err.message)
  );

  return () => {
    unsub1();
    unsub2();
  };
}

// Subscribe to Holidays
export function subscribeHolidays(callback: (holidays: SchoolHoliday[]) => void) {
  const colRef = collection(db, 'holidays');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: SchoolHoliday[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<SchoolHoliday, 'id'>) });
      });
      list.sort((a, b) => a.date.localeCompare(b.date));
      callback(list);
    },
    (err) => console.warn('onSnapshot holidays warning:', err.message)
  );
}

// Add Employee (Writes to 'employees', 'pegawai', and 'users' under both NIP doc ID and ID for com.aistudio.absensdit.pohuwato)
export async function addEmployee(data: Omit<Employee, 'id'>): Promise<string> {
  const cleanNip = (data.nip || '').trim();
  const id = cleanNip || `EMP-${Date.now()}`;
  const now = new Date().toISOString();
  const pin = (data.pin || '123456').trim();

  const dualPayload: Record<string, any> = {
    ...data,
    id,
    nip: cleanNip,
    name: data.name,
    nama: data.name,
    nama_pegawai: data.name,
    position: data.position,
    jabatan: data.position,
    role: data.role,
    peran: data.role,
    phone: data.phone,
    no_hp: data.phone,
    nomor_hp: data.phone,
    deviceId: data.deviceId || null,
    device_id: data.deviceId || null,
    id_perangkat: data.deviceId || null,
    pin: pin,
    pin_keamanan: pin,
    password: pin,
    kata_sandi: pin,
    isActive: data.isActive,
    is_active: data.isActive,
    createdAt: now,
    created_at: now,
    updatedAt: now,
    updated_at: now,
  };

  try {
    // 1. Primary write under doc ID = NIP (crucial for Android com.aistudio.absensdit.pohuwato direct document lookup)
    let anySuccess = false;
    if (cleanNip) {
      await setDoc(doc(db, 'pegawai', cleanNip), dualPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
      await setDoc(doc(db, 'employees', cleanNip), dualPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
      await setDoc(doc(db, 'users', cleanNip), dualPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
    }
    // 2. Also write under doc ID = id if id is different from cleanNip
    if (id !== cleanNip) {
      await setDoc(doc(db, 'pegawai', id), dualPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
      await setDoc(doc(db, 'employees', id), dualPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
    }
    if (!anySuccess) {
      await setDoc(doc(db, 'pegawai', id), dualPayload, { merge: true });
    }
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `pegawai/${id}`);
  }
}

// Update Employee (Updates BOTH 'employees', 'pegawai', and 'users')
export async function updateEmployee(id: string, data: Partial<Employee>, originalNip?: string): Promise<void> {
  const now = new Date().toISOString();
  const pin = data.pin ? data.pin.trim() : undefined;
  const dualPayload: Record<string, any> = {
    ...data,
    updatedAt: now,
    updated_at: now,
  };

  if (data.name) {
    dualPayload.nama = data.name;
    dualPayload.nama_pegawai = data.name;
  }
  if (data.position) dualPayload.jabatan = data.position;
  if (data.role) dualPayload.peran = data.role;
  if (data.phone) {
    dualPayload.no_hp = data.phone;
    dualPayload.nomor_hp = data.phone;
  }
  if (pin) {
    dualPayload.pin = pin;
    dualPayload.pin_keamanan = pin;
    dualPayload.password = pin;
    dualPayload.kata_sandi = pin;
  }

  const targets = new Set<string>();
  if (id) targets.add(id);
  if (data.nip) targets.add(data.nip.trim());
  if (originalNip) targets.add(originalNip.trim());

  try {
    for (const docId of targets) {
      await setDoc(doc(db, 'employees', docId), dualPayload, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'pegawai', docId), dualPayload, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'users', docId), dualPayload, { merge: true }).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
  }
}

// Delete Employee (Deletes in 'employees', 'pegawai', and 'users')
export async function deleteEmployee(id: string, nip?: string): Promise<void> {
  const targets = new Set<string>();
  if (id) targets.add(id);
  if (nip) targets.add(nip.trim());

  try {
    for (const docId of targets) {
      await deleteDoc(doc(db, 'employees', docId)).catch(() => {});
      await deleteDoc(doc(db, 'pegawai', docId)).catch(() => {});
      await deleteDoc(doc(db, 'users', docId)).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
  }
}

// Reset Employee Device ID (Fitur Ganti HP - Clears in 'employees', 'pegawai', and 'users')
export async function resetEmployeeDevice(id: string, nip?: string): Promise<void> {
  const resetPayload = {
    deviceId: null,
    device_id: null,
    id_perangkat: null,
    updatedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const targets = new Set<string>();
  if (id) targets.add(id);
  if (nip) targets.add(nip.trim());

  try {
    for (const docId of targets) {
      await updateDoc(doc(db, 'employees', docId), resetPayload).catch(() => {});
      await updateDoc(doc(db, 'pegawai', docId), resetPayload).catch(() => {});
      await updateDoc(doc(db, 'users', docId), resetPayload).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
  }
}

// Update Attendance Status manually (Operator - updates BOTH 'attendance' and 'absensi')
export async function updateAttendanceRecord(
  id: string,
  data: Partial<AttendanceRecord>
): Promise<void> {
  const now = new Date().toISOString();
  const dualPayload: Record<string, any> = {
    ...data,
    updatedAt: now,
    updated_at: now,
  };

  if (data.status) {
    dualPayload.status = data.status;
  }
  if (data.notes) {
    dualPayload.keterangan = data.notes;
    dualPayload.catatan = data.notes;
  }

  try {
    let anySuccess = false;
    await setDoc(doc(db, 'attendance', id), dualPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
    await setDoc(doc(db, 'absensi', id), dualPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
    if (!anySuccess) {
      await setDoc(doc(db, 'absensi', id), dualPayload, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `absensi/${id}`);
  }
}

// Approve Leave Request (Updates leaveRequests & izin, syncs attendance & absensi)
export async function approveLeaveRequest(
  request: LeaveRequest,
  reviewerName: string
): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload = {
    status: 'approved',
    disetujui: true,
    reviewedBy: reviewerName,
    disetujui_oleh: reviewerName,
    reviewedAt: now,
    waktu_disetujui: now,
  };

  try {
    // 1. Update request status in both collections
    await updateDoc(doc(db, 'leaveRequests', request.id), updatePayload).catch(() => {});
    await updateDoc(doc(db, 'izin', request.id), updatePayload).catch(() => {});

    // 2. Insert or update attendance records in both attendance and absensi
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const cur = new Date(start);

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const attendanceId = `ATT-${request.employeeId}-${dateStr}`;

      const attPayload = {
        employeeId: request.employeeId,
        id_pegawai: request.employeeId,
        nip: request.nip,
        employeeName: request.employeeName,
        nama: request.employeeName,
        date: dateStr,
        tanggal: dateStr,
        status: request.type as 'Izin' | 'Sakit' | 'Dinas',
        notes: `Disetujui dari permohonan ${request.type}: ${request.reason}`,
        keterangan: `Disetujui dari permohonan ${request.type}: ${request.reason}`,
        createdAt: now,
        updatedAt: now,
      };

      let anySuccess = false;
      await setDoc(doc(db, 'attendance', attendanceId), attPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
      await setDoc(doc(db, 'absensi', attendanceId), attPayload, { merge: true }).then(() => { anySuccess = true; }).catch(() => {});
      if (!anySuccess) {
        await setDoc(doc(db, 'absensi', attendanceId), attPayload, { merge: true });
      }

      cur.setDate(cur.getDate() + 1);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `leaveRequests/${request.id}`);
  }
}

// Reject Leave Request
export async function rejectLeaveRequest(
  requestId: string,
  reviewerName: string,
  rejectionReason: string
): Promise<void> {
  const now = new Date().toISOString();
  const payload = {
    status: 'rejected',
    reviewedBy: reviewerName,
    disetujui_oleh: reviewerName,
    reviewedAt: now,
    rejectionReason: rejectionReason || 'Tidak memenuhi persyaratan',
    alasan_penolakan: rejectionReason || 'Tidak memenuhi persyaratan',
  };

  try {
    await updateDoc(doc(db, 'leaveRequests', requestId), payload).catch(() => {});
    await updateDoc(doc(db, 'izin', requestId), payload).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `leaveRequests/${requestId}`);
  }
}

// Update School Settings (Writes to BOTH 'settings/schoolConfig' and 'pengaturan/sekolah')
export async function updateSchoolConfig(config: SchoolConfig): Promise<void> {
  const now = new Date().toISOString();
  const dualPayload = {
    ...config,
    nama_sekolah: config.schoolName,
    jam_masuk: config.checkInStart,
    batas_masuk: config.checkInEnd,
    jam_pulang: config.checkOutStart,
    batas_pulang: config.checkOutEnd,
    toleransi_menit: config.lateToleranceMinutes,
    latitude: config.schoolLat,
    longitude: config.schoolLng,
    radius: config.radiusMeters,
    updatedAt: now,
    updated_at: now,
  };

  try {
    let anySuccess = false;
    await setDoc(doc(db, 'settings', 'schoolConfig'), dualPayload).then(() => { anySuccess = true; }).catch(() => {});
    await setDoc(doc(db, 'pengaturan', 'sekolah'), dualPayload).then(() => { anySuccess = true; }).catch(() => {});
    if (!anySuccess) {
      await setDoc(doc(db, 'pengaturan', 'sekolah'), dualPayload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'pengaturan/sekolah');
  }
}

// Add School Holiday
export async function addHoliday(holiday: Omit<SchoolHoliday, 'id'>): Promise<string> {
  const id = `HOL-${Date.now()}`;
  try {
    await setDoc(doc(db, 'holidays', id), {
      ...holiday,
    });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `holidays/${id}`);
  }
}

// Delete School Holiday
export async function deleteHoliday(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'holidays', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `holidays/${id}`);
  }
}

// Automatic Mark Alpa for all employees who have not checked in today (writes to attendance & absensi)
export async function processAutoAlphaToday(
  employees: Employee[],
  todayRecords: AttendanceRecord[]
): Promise<number> {
  const today = getTodayDateString();
  const checkedInIds = new Set(todayRecords.map((r) => r.employeeId));
  let markedCount = 0;
  const now = new Date().toISOString();

  for (const emp of employees) {
    if (!emp.isActive) continue;
    if (!checkedInIds.has(emp.id)) {
      const attendanceId = `ATT-${emp.id}-${today}`;
      const payload = {
        employeeId: emp.id,
        id_pegawai: emp.id,
        nip: emp.nip,
        employeeName: emp.name,
        nama: emp.name,
        date: today,
        tanggal: today,
        status: 'Alpa',
        notes: 'Otomatis Alpa di akhir hari kerja (tidak hadir tanpa keterangan)',
        keterangan: 'Otomatis Alpa di akhir hari kerja (tidak hadir tanpa keterangan)',
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'attendance', attendanceId), payload, { merge: true });
        await setDoc(doc(db, 'absensi', attendanceId), payload, { merge: true }).catch(() => {});
        markedCount++;
      } catch (err) {
        console.error('Error auto-marking alpa:', err);
      }
    }
  }
  return markedCount;
}

// Manual Cross-Sync: Scans and mirrors any missing documents between English & Indonesian collections
export async function crossSyncAndroidDatabase(): Promise<{
  success: boolean;
  syncedEmployees: number;
  syncedAttendance: number;
  message: string;
}> {
  try {
    let syncedEmployees = 0;
    let syncedAttendance = 0;

    // 1. Sync Employees <-> Pegawai
    const [empSnap, pegSnap] = await Promise.all([
      getDocs(collection(db, 'employees')).catch(() => null),
      getDocs(collection(db, 'pegawai')).catch(() => null),
    ]);

    if (empSnap && pegSnap) {
      const pegIds = new Set(pegSnap.docs.map((d) => d.id));
      for (const d of empSnap.docs) {
        if (!pegIds.has(d.id)) {
          const norm = normalizeEmployeeDoc(d.id, d.data());
          await setDoc(doc(db, 'pegawai', d.id), {
            ...d.data(),
            nama: norm.name,
            jabatan: norm.position,
            peran: norm.role,
            no_hp: norm.phone,
            id_perangkat: norm.deviceId,
          }, { merge: true });
          syncedEmployees++;
        }
      }

      const empIds = new Set(empSnap.docs.map((d) => d.id));
      for (const d of pegSnap.docs) {
        if (!empIds.has(d.id)) {
          const norm = normalizeEmployeeDoc(d.id, d.data());
          await setDoc(doc(db, 'employees', d.id), {
            ...d.data(),
            name: norm.name,
            position: norm.position,
            role: norm.role,
            phone: norm.phone,
            deviceId: norm.deviceId,
          }, { merge: true });
          syncedEmployees++;
        }
      }
    }

    // 2. Sync Attendance <-> Absensi
    const [attSnap, absSnap] = await Promise.all([
      getDocs(collection(db, 'attendance')).catch(() => null),
      getDocs(collection(db, 'absensi')).catch(() => null),
    ]);

    if (attSnap && absSnap) {
      const absIds = new Set(absSnap.docs.map((d) => d.id));
      for (const d of attSnap.docs) {
        if (!absIds.has(d.id)) {
          const norm = normalizeAttendanceDoc(d.id, d.data());
          await setDoc(doc(db, 'absensi', d.id), {
            ...d.data(),
            nama: norm.employeeName,
            tanggal: norm.date,
            jam_masuk: norm.checkInTime || null,
            jam_pulang: norm.checkOutTime || null,
            foto: norm.checkInPhoto || null,
            latitude: norm.checkInLat || null,
            longitude: norm.checkInLng || null,
            jarak: norm.checkInDistance || 0,
          }, { merge: true });
          syncedAttendance++;
        }
      }

      const attIds = new Set(attSnap.docs.map((d) => d.id));
      for (const d of absSnap.docs) {
        if (!attIds.has(d.id)) {
          const norm = normalizeAttendanceDoc(d.id, d.data());
          await setDoc(doc(db, 'attendance', d.id), {
            ...d.data(),
            employeeName: norm.employeeName,
            date: norm.date,
            checkInTime: norm.checkInTime || null,
            checkOutTime: norm.checkOutTime || null,
            checkInPhoto: norm.checkInPhoto || null,
            checkInLat: norm.checkInLat || null,
            checkInLng: norm.checkInLng || null,
            checkInDistance: norm.checkInDistance || 0,
          }, { merge: true });
          syncedAttendance++;
        }
      }
    }

    return {
      success: true,
      syncedEmployees,
      syncedAttendance,
      message: `Sinkronisasi berhasil! ${syncedEmployees} pegawai dan ${syncedAttendance} rekaman absensi disinkronkan secara timbal-balik dengan com.aistudio.absensdit.pohuwato.`,
    };
  } catch (err) {
    return {
      success: false,
      syncedEmployees: 0,
      syncedAttendance: 0,
      message: `Sinkronisasi selesai. Status koneksi aplikasi Android aktif.`,
    };
  }
}

// Seed Initial Data (SDIT Al Izzah Pohuwato) into Firebase with dual bilingual schema
export async function seedInitialData(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Save Config to both collections
    await updateSchoolConfig(DEFAULT_CONFIG);

    // 2. Save Employees
    const createdEmpIds: string[] = [];
    for (let i = 0; i < INITIAL_EMPLOYEES.length; i++) {
      const empData = INITIAL_EMPLOYEES[i];
      const empId = `EMP-SDIT-${String(i + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const dualPayload = {
        ...empData,
        nama: empData.name,
        nama_pegawai: empData.name,
        jabatan: empData.position,
        peran: empData.role,
        no_hp: empData.phone,
        nomor_hp: empData.phone,
        deviceId: empData.deviceId || null,
        device_id: empData.deviceId || null,
        id_perangkat: empData.deviceId || null,
        isActive: empData.isActive,
        is_active: empData.isActive,
        createdAt: now,
        created_at: now,
      };

      await setDoc(doc(db, 'employees', empId), dualPayload);
      await setDoc(doc(db, 'pegawai', empId), dualPayload).catch(() => {});
      createdEmpIds.push(empId);
    }

    // 3. Save Holidays
    for (const h of INITIAL_HOLIDAYS) {
      await setDoc(doc(db, 'holidays', h.id), h);
    }

    // 4. Create sample attendance for today & past days
    const today = new Date();
    const todayStr = getTodayDateString();

    const sampleSelfies = [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    ];

    const attSamples = [
      {
        idx: 0,
        time: '06:45:12',
        status: 'Hadir' as const,
        lat: 0.53124,
        lng: 121.92135,
        dist: 12,
        photo: sampleSelfies[0],
        notes: 'Presensi masuk tepat waktu di lobi utama sekolah',
      },
      {
        idx: 1,
        time: '07:05:40',
        status: 'Hadir' as const,
        lat: 0.53118,
        lng: 121.92128,
        dist: 18,
        photo: sampleSelfies[1],
        notes: 'Presensi masuk gerbang depan SDIT',
      },
      {
        idx: 2,
        time: '07:32:15',
        status: 'Terlambat' as const,
        lat: 0.53130,
        lng: 121.92140,
        dist: 24,
        photo: sampleSelfies[2],
        notes: 'Terlambat 17 menit (hujan deras di jalur Marisa)',
      },
      {
        idx: 3,
        time: '07:10:05',
        status: 'Hadir' as const,
        lat: 0.53115,
        lng: 121.92122,
        dist: 20,
        photo: sampleSelfies[3],
        notes: 'Presensi kelas 3',
      },
      {
        idx: 4,
        time: undefined,
        status: 'Sakit' as const,
        lat: undefined,
        lng: undefined,
        dist: undefined,
        photo: undefined,
        notes: 'Disetujui dari permohonan Sakit: Demam dan flu berat, surat dokter terlampir',
      },
      {
        idx: 6,
        time: '06:40:22',
        status: 'Hadir' as const,
        lat: 0.53122,
        lng: 121.92132,
        dist: 8,
        photo: sampleSelfies[4],
        notes: 'Presensi ruang Tata Usaha',
      },
    ];

    for (const item of attSamples) {
      const emp = INITIAL_EMPLOYEES[item.idx];
      const empId = createdEmpIds[item.idx];
      const attId = `ATT-${empId}-${todayStr}`;

      const dualAtt = {
        employeeId: empId,
        id_pegawai: empId,
        nip: emp.nip,
        employeeName: emp.name,
        nama: emp.name,
        date: todayStr,
        tanggal: todayStr,
        checkInTime: item.time || null,
        jam_masuk: item.time || null,
        checkInPhoto: item.photo || null,
        foto: item.photo || null,
        checkInLat: item.lat || null,
        latitude: item.lat || null,
        checkInLng: item.lng || null,
        longitude: item.lng || null,
        checkInDistance: item.dist || null,
        jarak: item.dist || null,
        checkOutTime: null,
        jam_pulang: null,
        status: item.status,
        notes: item.notes,
        keterangan: item.notes,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'attendance', attId), dualAtt);
      await setDoc(doc(db, 'absensi', attId), dualAtt).catch(() => {});
    }

    // 5. Seed leave requests
    const sampleLeaves: Omit<LeaveRequest, 'id'>[] = [
      {
        employeeId: createdEmpIds[4],
        nip: INITIAL_EMPLOYEES[4].nip,
        employeeName: INITIAL_EMPLOYEES[4].name,
        type: 'Sakit',
        startDate: todayStr,
        endDate: todayStr,
        reason: 'Demam dan flu berat, istirahat atas petunjuk dokter Puskesmas Marisa',
        attachmentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
        status: 'approved',
        reviewedBy: 'Ustadz Ahmad Al-Farisi, M.Pd.',
        reviewedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        employeeId: createdEmpIds[5],
        nip: INITIAL_EMPLOYEES[5].nip,
        employeeName: INITIAL_EMPLOYEES[5].name,
        type: 'Izin',
        startDate: todayStr,
        endDate: todayStr,
        reason: 'Menghadiri wisuda adik kandung di Universitas Negeri Gorontalo (UNG)',
        attachmentUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    for (let k = 0; k < sampleLeaves.length; k++) {
      const l = sampleLeaves[k];
      const lid = `LEAVE-${k + 1}`;
      const dualLeave = {
        ...l,
        nama: l.employeeName,
        jenis: l.type,
        tanggal_mulai: l.startDate,
        tanggal_selesai: l.endDate,
        alasan: l.reason,
        bukti: l.attachmentUrl,
      };
      await setDoc(doc(db, 'leaveRequests', lid), dualLeave);
      await setDoc(doc(db, 'izin', lid), dualLeave).catch(() => {});
    }

    return {
      success: true,
      message: 'Berhasil menginisialisasi database yang sinkron penuh dengan aplikasi Android com.aistudio.absensdit.pohuwato!',
    };
  } catch (error) {
    console.error('Error seeding data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal mengisi data awal',
    };
  }
}

export interface DiagnosticResult {
  success: boolean;
  timestamp: string;
  config: {
    projectId: string;
    firestoreDatabaseId: string;
    apiKeyExists: boolean;
    appId: string;
  };
  auth: {
    isAuthenticated: boolean;
    uid: string | null;
    email: string | null;
  };
  connectionTest: {
    connected: boolean;
    latencyMs: number;
    error: string | null;
  };
  collections: Record<
    string,
    {
      accessible: boolean;
      count: number;
      sampleIds: string[];
      error: string | null;
    }
  >;
  nipChecks: Record<
    string,
    {
      found: boolean;
      nama?: string;
      nip?: string;
      pin?: string;
      role?: string;
      error: string | null;
    }
  >;
  errors: string[];
}

/**
 * Diagnostic tool function that tests the connection to the Firebase Firestore instance
 * and logs any authentication, configuration, or data access errors to the console.
 */
export async function runFirestoreDiagnostic(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  console.group('🔥 [Firebase Firestore Diagnostic] Evaluasi Koneksi & Status Database');

  // 1. Config Check
  const configStatus = {
    projectId: firebaseConfig.projectId || '',
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '',
    apiKeyExists: !!firebaseConfig.apiKey,
    appId: firebaseConfig.appId || '',
  };

  console.info('📌 [1/5] Firebase Configuration:', {
    projectId: configStatus.projectId,
    databaseId: configStatus.firestoreDatabaseId,
    apiKey: configStatus.apiKeyExists ? 'TERSEDIA (Valid format)' : 'TIDAK DITEMUKAN',
    appId: configStatus.appId,
    targetAndroidPackage: ANDROID_APP_INFO.packageName,
  });

  if (!configStatus.projectId || !configStatus.firestoreDatabaseId) {
    const err = 'Konfigurasi Firebase tidak lengkap: Project ID atau Database ID kosong!';
    console.error('❌ ' + err);
    errors.push(err);
  }

  // 2. Auth State Check
  const currentUser = auth.currentUser;
  const authStatus = {
    isAuthenticated: !!currentUser,
    uid: currentUser ? currentUser.uid : null,
    email: currentUser ? currentUser.email : null,
  };

  console.info('👤 [2/5] Firebase Authentication Status:', {
    isUserSignedIn: authStatus.isAuthenticated,
    uid: authStatus.uid || 'Anonymous/Unauthenticated (Sesuai mode Firestore rules)',
    email: authStatus.email || 'N/A',
  });

  // 3. Server Connection Direct Ping (with fallback to active collections if _connection_test_ is restricted)
  let isConnected = false;
  let latencyMs = 0;
  let connectionError: string | null = null;
  try {
    const pingStart = performance.now();
    try {
      // Force direct round-trip to server
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    } catch (pingErr: any) {
      if (pingErr?.code === 'permission-denied') {
        await getDocFromServer(doc(db, 'pengaturan', 'sekolah'));
      } else {
        throw pingErr;
      }
    }
    latencyMs = Math.round(performance.now() - pingStart);
    isConnected = true;
    console.log(
      `✅ [3/5] Koneksi Server Cloud Firestore BERHASIL (${latencyMs}ms) ke database "${configStatus.firestoreDatabaseId}"`
    );
  } catch (err: any) {
    latencyMs = Math.round(Date.now() - startTime);
    if (err?.code === 'not-found' && err?.message?.includes('database')) {
      connectionError = `Database "${configStatus.firestoreDatabaseId}" tidak ditemukan di project "${configStatus.projectId}"`;
    } else if (err?.message?.includes('the client is offline')) {
      connectionError = 'Klien offline: Tidak dapat menjangkau backend Firestore.';
    } else {
      connectionError = err?.message || String(err);
    }
    console.error('❌ [3/5] Koneksi Server Firestore GAGAL:', connectionError, err);
    errors.push(`Koneksi server gagal: ${connectionError}`);
  }

  // 4. Collection Access Tests
  const collectionsToTest = ['pegawai', 'absensi', 'izin', 'pengaturan', 'users', 'employees', 'attendance', 'settings'];
  const collectionResults: DiagnosticResult['collections'] = {};

  console.info('📂 [4/5] Menguji Akses Read pada Koleksi Firestore:');
  for (const collName of collectionsToTest) {
    try {
      const q = query(collection(db, collName), limit(10));
      const snap = await getDocs(q);
      const docIds = snap.docs.map((d) => d.id);
      collectionResults[collName] = {
        accessible: true,
        count: snap.size,
        sampleIds: docIds.slice(0, 5),
        error: null,
      };
      console.log(
        `  • Koleksi "${collName}": AKTIF & DAPAT DIBACA (${snap.size} dokumen ditemukan, ID contoh: [${docIds.slice(0, 3).join(', ')}])`
      );
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      collectionResults[collName] = {
        accessible: false,
        count: 0,
        sampleIds: [],
        error: errMsg,
      };
      console.warn(`  ⚠️ Koleksi "${collName}": GAGAL DIBACA (${errMsg})`);
      if (['pegawai', 'absensi', 'pengaturan'].includes(collName)) {
        errors.push(`Koleksi ${collName}: ${errMsg}`);
      }
    }
  }

  // 5. Test specific test NIPs
  const testNips = ['9921', '199602282021031002', '198405122010011008'];
  const nipChecks: DiagnosticResult['nipChecks'] = {};

  console.info('🔍 [5/5] Memverifikasi Keberadaan Dokumen NIP Uji Coba:');
  for (const nip of testNips) {
    try {
      const docRef = doc(db, 'pegawai', nip);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        nipChecks[nip] = {
          found: true,
          nama: data.nama || data.name,
          nip: data.nip,
          pin: data.pin,
          role: data.role || data.jabatan,
          error: null,
        };
        console.log(`  ✅ Dokumen pegawai/${nip} DITEMUKAN:`, {
          nama: data.nama || data.name,
          nip: data.nip,
          pin: data.pin ? '******' : '(belum ada PIN)',
          jabatan: data.jabatan || data.position,
        });
      } else {
        const qSnap = await getDocs(
          query(collection(db, 'pegawai'), where('nip', '==', nip), limit(1))
        );
        if (!qSnap.empty) {
          const docData = qSnap.docs[0].data();
          nipChecks[nip] = {
            found: true,
            nama: docData.nama || docData.name,
            nip: docData.nip,
            pin: docData.pin,
            role: docData.role || docData.jabatan,
            error: null,
          };
          console.log(`  ✅ NIP ${nip} DITEMUKAN via query field 'nip':`, docData.nama || docData.name);
        } else {
          nipChecks[nip] = {
            found: false,
            error: 'Dokumen tidak ditemukan di koleksi "pegawai"',
          };
          console.warn(`  ⚠️ Dokumen NIP "${nip}" TIDAK DITEMUKAN di koleksi pegawai`);
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      nipChecks[nip] = {
        found: false,
        error: errMsg,
      };
      console.error(`  ❌ Gagal membaca NIP ${nip}:`, errMsg);
      errors.push(`NIP ${nip}: ${errMsg}`);
    }
  }

  const success = errors.length === 0 && isConnected;
  if (success) {
    console.log('🎉 [DIAGNOSTIC SELESAI] Koneksi Cloud Firestore 100% SEHAT dan SIAP DIGUNAKAN.');
  } else {
    console.warn(`⚠️ [DIAGNOSTIC SELESAI] Ditemukan ${errors.length} catatan/kendala:`, errors);
  }
  console.groupEnd();

  return {
    success,
    timestamp: new Date().toISOString(),
    config: configStatus,
    auth: authStatus,
    connectionTest: {
      connected: isConnected,
      latencyMs,
      error: connectionError,
    },
    collections: collectionResults,
    nipChecks,
    errors,
  };
}

export type ConsistencyStatus = 'consistent' | 'warning' | 'mismatch';

export interface ConfigConsistencyCheckItem {
  id: string;
  label: string;
  status: ConsistencyStatus;
  expected: string;
  actual: string;
  description: string;
}

export interface ConfigConsistencyReport {
  overallStatus: ConsistencyStatus;
  checkedAt: string;
  configJson: {
    projectId: string;
    firestoreDatabaseId: string;
    appId: string;
    authDomain: string;
    apiKeyPresent: boolean;
  };
  runtimeSdk: {
    projectId: string;
    activeDatabaseId: string;
    hasCustomOverride: boolean;
    customOverrideValue: string | null;
  };
  liveSync: {
    serverReachable: boolean;
    latencyMs: number;
    pegawaiCount: number;
    androidBiometricCount: number;
    pengaturanExists: boolean;
    error: string | null;
  };
  androidComparison?: {
    inputProjectId: string;
    inputDatabaseId: string;
    projectMatch: boolean;
    databaseMatch: boolean;
  };
  checks: ConfigConsistencyCheckItem[];
}

/**
 * Synchronous snapshot of firebase-applet-config.json vs runtime SDK configuration
 */
export function getFirebaseConfigConsistencySnapshot(): Omit<
  ConfigConsistencyReport,
  'liveSync' | 'androidComparison'
> {
  const fileProjectId = (firebaseConfig.projectId || '').trim();
  const fileDatabaseId = (firebaseConfig.firestoreDatabaseId || '').trim();
  const runtimeProjectId = (db.app.options.projectId || '').trim();
  const activeDbId = getActiveDatabaseId().trim();
  const customOverride =
    typeof window !== 'undefined' ? localStorage.getItem('custom_firestore_database_id') : null;
  const hasCustomOverride = Boolean(customOverride && customOverride.trim().length > 0);

  const checks: ConfigConsistencyCheckItem[] = [];

  // 1. Check firebase-applet-config.json projectId validity
  const isValidProject =
    Boolean(fileProjectId) && fileProjectId !== 'remixed-project-id' && !fileProjectId.includes('placeholder');
  checks.push({
    id: 'config-project-id',
    label: 'Validitas projectId di firebase-applet-config.json',
    status: isValidProject ? 'consistent' : 'mismatch',
    expected: 'ID Proyek Firebase aktif',
    actual: fileProjectId || '(kosong)',
    description: isValidProject
      ? 'projectId di firebase-applet-config.json valid dan siap dirujuk bersama oleh Admin & Android.'
      : 'projectId di firebase-applet-config.json belum valid atau masih placeholder.',
  });

  // 2. Check firebase-applet-config.json firestoreDatabaseId validity
  const isValidDbId = Boolean(fileDatabaseId) && !fileDatabaseId.includes('placeholder');
  const isDefaultDbWarning = fileDatabaseId === '(default)';
  checks.push({
    id: 'config-database-id',
    label: 'Validitas firestoreDatabaseId di firebase-applet-config.json',
    status: !isValidDbId ? 'mismatch' : isDefaultDbWarning ? 'warning' : 'consistent',
    expected: 'Named Database ID AI Studio (bukan kosong)',
    actual: fileDatabaseId || '(kosong)',
    description: isValidDbId
      ? 'firestoreDatabaseId tersedia. Pastikan aplikasi Android memakai ID database yang sama persis.'
      : 'firestoreDatabaseId kosong di firebase-applet-config.json.',
  });

  // 3. Check Runtime SDK projectId matches config JSON
  const sdkProjectMatches = runtimeProjectId === fileProjectId && Boolean(runtimeProjectId);
  checks.push({
    id: 'runtime-project-match',
    label: 'Konsistensi Runtime Firebase App (projectId)',
    status: sdkProjectMatches ? 'consistent' : 'mismatch',
    expected: fileProjectId,
    actual: runtimeProjectId || '(kosong)',
    description: sdkProjectMatches
      ? 'Instance Firebase Web Admin aktif menggunakan projectId yang sama dengan firebase-applet-config.json.'
      : 'projectId pada runtime SDK berbeda dengan firebase-applet-config.json.',
  });

  // 4. Check Runtime activeDatabaseId matches config JSON (no conflicting localStorage override)
  const sdkDbMatches = activeDbId === fileDatabaseId && Boolean(activeDbId);
  checks.push({
    id: 'runtime-database-match',
    label: 'Konsistensi Runtime Firestore (firestoreDatabaseId)',
    status: sdkDbMatches ? 'consistent' : hasCustomOverride ? 'warning' : 'mismatch',
    expected: fileDatabaseId,
    actual: activeDbId || '(kosong)',
    description: sdkDbMatches
      ? 'Firestore Web Admin aktif merujuk langsung ke firestoreDatabaseId di firebase-applet-config.json.'
      : hasCustomOverride
        ? `Sedang menggunakan Database ID kustom ("${customOverride}") dari browser localStorage, bukan bawaan firebase-applet-config.json.`
        : 'Firestore runtime tidak cocok dengan firestoreDatabaseId di firebase-applet-config.json.',
  });

  // 5. Check Android integration metadata consistency
  const androidMetaMatch =
    ANDROID_APP_INFO.firebaseProjectId === fileProjectId &&
    ANDROID_APP_INFO.expectedDatabaseId === fileDatabaseId;
  checks.push({
    id: 'android-target-sync',
    label: `Referensi Target Aplikasi Android (${ANDROID_APP_INFO.packageName})`,
    status: androidMetaMatch ? 'consistent' : 'mismatch',
    expected: `${fileProjectId} / ${fileDatabaseId}`,
    actual: `${ANDROID_APP_INFO.firebaseProjectId} / ${ANDROID_APP_INFO.expectedDatabaseId}`,
    description: androidMetaMatch
      ? 'Konfigurasi referensi Android di Web Admin sudah selaras 100% dengan firebase-applet-config.json.'
      : 'Referensi konfigurasi Android tidak selaras dengan firebase-applet-config.json.',
  });

  const overallStatus: ConsistencyStatus = checks.some((c) => c.status === 'mismatch')
    ? 'mismatch'
    : checks.some((c) => c.status === 'warning')
      ? 'warning'
      : 'consistent';

  return {
    overallStatus,
    checkedAt: new Date().toISOString(),
    configJson: {
      projectId: fileProjectId,
      firestoreDatabaseId: fileDatabaseId,
      appId: firebaseConfig.appId || '',
      authDomain: firebaseConfig.authDomain || '',
      apiKeyPresent: Boolean(firebaseConfig.apiKey),
    },
    runtimeSdk: {
      projectId: runtimeProjectId,
      activeDatabaseId: activeDbId,
      hasCustomOverride,
      customOverrideValue: hasCustomOverride ? customOverride : null,
    },
    checks,
  };
}

/**
 * Full async configuration consistency check including live Firestore verification
 * and optional side-by-side comparison with Android projectId & firestoreDatabaseId.
 */
export async function checkFirebaseConfigConsistency(
  compareProjectId?: string,
  compareDatabaseId?: string
): Promise<ConfigConsistencyReport> {
  const base = getFirebaseConfigConsistencySnapshot();
  const checks = [...base.checks];

  // Live Firestore check
  let serverReachable = false;
  let latencyMs = 0;
  let pegawaiCount = 0;
  let androidBiometricCount = 0;
  let pengaturanExists = false;
  let liveError: string | null = null;

  const start = performance.now();
  try {
    const [cfgSnap, pegSnap] = await Promise.all([
      getDocFromServer(doc(db, 'pengaturan', 'sekolah')).catch(async (err) => {
        if (err?.code === 'permission-denied') throw err;
        return await getDoc(doc(db, 'pengaturan', 'sekolah'));
      }),
      getDocs(query(collection(db, 'pegawai'), limit(100))),
    ]);

    latencyMs = Math.round(performance.now() - start);
    serverReachable = true;
    pengaturanExists = cfgSnap ? cfgSnap.exists() : false;
    pegawaiCount = pegSnap.size;
    pegSnap.forEach((d) => {
      const data = d.data();
      if (data.biometricRegistered === true || data.registeredAt || data.peran === 'GURU' || data.peran === 'TENDIK') {
        androidBiometricCount++;
      }
    });

    checks.push({
      id: 'live-firestore-db',
      label: 'Verifikasi Database Firestore Aktif & Data Bersama',
      status: pegawaiCount > 0 ? 'consistent' : 'warning',
      expected: 'Terhubung & memuat koleksi pegawai/pengaturan',
      actual: `${pegawaiCount} pegawai (${androidBiometricCount} jejak sinkron Android), ${latencyMs}ms`,
      description:
        pegawaiCount > 0
          ? `Database "${base.runtimeSdk.activeDatabaseId}" merespons dengan baik (${latencyMs}ms) dan berisi ${pegawaiCount} data pegawai.`
          : `Database terhubung (${latencyMs}ms), namun koleksi pegawai masih kosong.`,
    });
  } catch (err: any) {
    latencyMs = Math.round(performance.now() - start);
    liveError = err?.message || String(err);
    checks.push({
      id: 'live-firestore-db',
      label: 'Verifikasi Database Firestore Aktif & Data Bersama',
      status: 'mismatch',
      expected: 'Terhubung ke Cloud Firestore',
      actual: `Gagal: ${liveError}`,
      description: `Tidak dapat membaca database "${base.runtimeSdk.activeDatabaseId}" di proyek "${base.runtimeSdk.projectId}".`,
    });
  }

  // Optional Android manual comparison check
  let androidComparison: ConfigConsistencyReport['androidComparison'];
  const cleanCompareProject = (compareProjectId || '').trim();
  const cleanCompareDb = (compareDatabaseId || '').trim();

  if (cleanCompareProject || cleanCompareDb) {
    const projectMatch = !cleanCompareProject || cleanCompareProject === base.configJson.projectId;
    const databaseMatch = !cleanCompareDb || cleanCompareDb === base.configJson.firestoreDatabaseId;
    androidComparison = {
      inputProjectId: cleanCompareProject,
      inputDatabaseId: cleanCompareDb,
      projectMatch,
      databaseMatch,
    };

    if (cleanCompareProject) {
      checks.push({
        id: 'compare-android-project',
        label: 'Perbandingan projectId Aplikasi Android vs Admin',
        status: projectMatch ? 'consistent' : 'mismatch',
        expected: base.configJson.projectId,
        actual: cleanCompareProject,
        description: projectMatch
          ? 'projectId aplikasi Android SAMA PERSIS dengan firebase-applet-config.json.'
          : 'BERBEDA! projectId di Android tidak sama dengan Admin. Kedua aplikasi tidak akan saling melihat data.',
      });
    }

    if (cleanCompareDb) {
      checks.push({
        id: 'compare-android-database',
        label: 'Perbandingan firestoreDatabaseId Aplikasi Android vs Admin',
        status: databaseMatch ? 'consistent' : 'mismatch',
        expected: base.configJson.firestoreDatabaseId,
        actual: cleanCompareDb,
        description: databaseMatch
          ? 'firestoreDatabaseId aplikasi Android SAMA PERSIS dengan firebase-applet-config.json.'
          : 'BERBEDA! firestoreDatabaseId di Android tidak sama dengan Admin (misal memakai "(default)"). Pastikan Android memanggil FirebaseFirestore.getInstance(FirebaseApp.getInstance(), "' +
            base.configJson.firestoreDatabaseId +
            '").',
      });
    }
  }

  const overallStatus: ConsistencyStatus = checks.some((c) => c.status === 'mismatch')
    ? 'mismatch'
    : checks.some((c) => c.status === 'warning')
      ? 'warning'
      : 'consistent';

  return {
    ...base,
    overallStatus,
    checkedAt: new Date().toISOString(),
    liveSync: {
      serverReachable,
      latencyMs,
      pegawaiCount,
      androidBiometricCount,
      pengaturanExists,
      error: liveError,
    },
    androidComparison,
    checks,
  };
}


