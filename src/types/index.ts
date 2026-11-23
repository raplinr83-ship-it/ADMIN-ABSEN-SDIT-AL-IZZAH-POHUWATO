export type AdminRole = 'Kepala Sekolah' | 'Operator';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  nip?: string;
  avatar?: string;
}

export type EmployeeRole = 'Guru' | 'TU';

export interface Employee {
  id: string;
  nip: string;
  name: string;
  position: string;
  role: EmployeeRole;
  phone: string;
  pin?: string;
  deviceId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Dinas' | 'Alpa';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  nip: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm:ss
  checkInPhoto?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkInDistance?: number; // meters from school
  checkOutTime?: string; // HH:mm:ss
  checkOutPhoto?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LeaveType = 'Izin' | 'Sakit' | 'Dinas';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  nip: string;
  employeeName: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string;
  createdAt: string;
}

export interface SchoolHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: 'Nasional' | 'Sekolah' | 'Cuti Bersama';
}

export interface SchoolConfig {
  id?: string;
  schoolName: string;
  npsn: string;
  checkInStart: string; // "06:30"
  checkInEnd: string; // "07:15"
  lateToleranceMinutes: number; // e.g. 15
  checkOutStart: string; // "14:00"
  checkOutEnd: string; // "16:30"
  autoAlpaTime: string; // "17:00"
  schoolLat: number; // 0.53120 (Pohuwato)
  schoolLng: number; // 121.92130
  radiusMeters: number; // 150
  whatsappApiUrl: string;
  whatsappApiKey: string;
  whatsappSenderNumber: string;
  whatsappTemplate: string;
  headmasterName: string;
  headmasterNip: string;
  operatorName: string;
  operatorNip: string;
  updatedAt?: string;
}

export interface DailySummary {
  totalEmployees: number;
  present: number;
  late: number;
  leaveOrSick: number;
  notYetCheckedIn: number;
  alpha: number;
}

export interface EmployeeMonthlyRecap {
  employeeId: string;
  nip: string;
  name: string;
  position: string;
  role: EmployeeRole;
  phone: string;
  presentCount: number; // Tepat waktu
  lateCount: number; // Terlambat
  leaveCount: number; // Izin
  sickCount: number; // Sakit
  dutyCount: number; // Dinas
  alphaCount: number; // Alpa
  totalWorkDays: number;
  attendancePercentage: number;
}
