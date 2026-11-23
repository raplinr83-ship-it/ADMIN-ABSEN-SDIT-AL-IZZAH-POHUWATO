import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Calendar,
  AlertTriangle,
  User,
  ExternalLink,
  ShieldAlert,
  X,
  FileText,
} from 'lucide-react';
import { LeaveRequest, AdminRole, AdminUser } from '../types';
import { approveLeaveRequest, rejectLeaveRequest } from '../services/dataService';

interface LeaveApprovalViewProps {
  leaveRequests: LeaveRequest[];
  role: AdminRole;
  currentUser: AdminUser;
  onViewPhoto: (imageUrl: string, title: string, details?: any) => void;
}

export const LeaveApprovalView: React.FC<LeaveApprovalViewProps> = ({
  leaveRequests,
  role,
  currentUser,
  onViewPhoto,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionAlert, setActionAlert] = useState<string>('');

  // Reject modal state
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const isOperator = role === 'Operator';

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'rejected').length;

  const filteredRequests = leaveRequests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const handleApprove = async (req: LeaveRequest) => {
    if (!isOperator) return;
    if (!confirm(`Setujui pengajuan ${req.type} untuk ${req.employeeName}?`)) return;

    setIsProcessing(true);
    try {
      await approveLeaveRequest(req, currentUser.name);
      setActionAlert(
        `Alhamdulillah, pengajuan ${req.type} oleh ${req.employeeName} berhasil disetujui dan telah disinkronkan ke rekap presensi.`
      );
      setTimeout(() => setActionAlert(''), 6000);
    } catch (err) {
      alert('Gagal menyetujui pengajuan: ' + (err instanceof Error ? err.message : 'Kesalahan'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest || !isOperator) return;

    setIsProcessing(true);
    try {
      await rejectLeaveRequest(
        rejectingRequest.id,
        currentUser.name,
        rejectionReason.trim() || 'Tidak memenuhi kriteria / persyaratan surat'
      );
      setActionAlert(`Pengajuan ${rejectingRequest.type} oleh ${rejectingRequest.employeeName} ditolak.`);
      setRejectingRequest(null);
      setRejectionReason('');
      setTimeout(() => setActionAlert(''), 6000);
    } catch (err) {
      alert('Gagal menolak pengajuan: ' + (err instanceof Error ? err.message : 'Kesalahan'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Persetujuan Izin / Sakit / Dinas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifikasi bukti lampiran surat dokter/dinas dan persetujuan status presensi pegawai
          </p>
        </div>

        {!isOperator && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Mode Lihat Saja (Kepala Sekolah)</span>
          </div>
        )}
      </div>

      {actionAlert && (
        <div className="p-3.5 bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionAlert}</span>
          </div>
          <button onClick={() => setActionAlert('')} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 max-w-md">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Disetujui ({approvedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Ditolak ({rejectedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua
        </button>
      </div>

      {/* Leave Requests Grid */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">
              Tidak ada permohonan izin pada kategori ini
            </p>
            <p>Daftar permohonan izin dari guru dan staf akan muncul di sini secara real-time.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        req.type === 'Sakit'
                          ? 'bg-red-100 text-red-800'
                          : req.type === 'Izin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {req.type}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPending
                        ? 'Menunggu Verifikasi'
                        : isApproved
                        ? 'Disetujui'
                        : 'Ditolak'}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      ID: {req.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800">
                    {req.employeeName}{' '}
                    <span className="text-xs font-normal text-slate-500 font-mono">
                      (NIP: {req.nip})
                    </span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Periode: <strong className="text-slate-800">{req.startDate}</strong> s/d{' '}
                        <strong className="text-slate-800">{req.endDate}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    <strong className="text-slate-800 block text-[11px] mb-0.5">
                      Alasan Pengajuan:
                    </strong>
                    {req.reason}
                  </p>

                  {/* Review Notes */}
                  {req.reviewedBy && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Diverifikasi oleh: <strong className="text-slate-700">{req.reviewedBy}</strong></span>
                      {req.rejectionReason && (
                        <span className="text-rose-600">({req.rejectionReason})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Actions: Proof Viewer & Approval Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5 shrink-0">
                  {req.attachmentUrl ? (
                    <button
                      onClick={() =>
                        onViewPhoto(
                          req.attachmentUrl!,
                          `Bukti Dokumen ${req.type} - ${req.employeeName}`,
                          {
                            employeeName: req.employeeName,
                            nip: req.nip,
                            location: req.reason,
                            status: req.type,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors w-full sm:w-auto justify-center"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lihat Bukti Lampiran</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Tidak ada lampiran berkas
                    </span>
                  )}

                  {isOperator && isPending && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setRejectingRequest(req)}
                        disabled={isProcessing}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={isProcessing}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Setujui</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50">
              <h3 className="text-sm font-bold text-rose-800">
                Tolak Pengajuan {rejectingRequest.type}
              </h3>
              <button
                onClick={() => setRejectingRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menolak pengajuan {rejectingRequest.type} dari{' '}
                <strong className="text-slate-800">{rejectingRequest.employeeName}</strong>?
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan:
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Lampiran surat dokter belum memenuhi format, atau surat tugas belum ditandatangani..."
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 rounded-xl shadow-xs"
                >
                  {isProcessing ? 'Memproses...' : 'Tolak Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
