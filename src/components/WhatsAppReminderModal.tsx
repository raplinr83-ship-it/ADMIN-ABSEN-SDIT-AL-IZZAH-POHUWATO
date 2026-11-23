import React, { useState } from 'react';
import {
  X,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Employee, SchoolConfig } from '../types';
import {
  formatWhatsAppMessage,
  generateWhatsAppLink,
  sendWhatsAppMessageViaGateway,
  WhatsAppSendResult,
} from '../services/whatsappService';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  unrecordedEmployees: Employee[];
  config: SchoolConfig;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  unrecordedEmployees,
  config,
}) => {
  if (!isOpen) return null;

  const [selectedIds, setSelectedIds] = useState<string[]>(
    unrecordedEmployees.map((e) => e.id)
  );
  const [templateText, setTemplateText] = useState<string>(
    config.whatsappTemplate ||
      "Assalamu'alaikum wr wb, Ustadz/Ustadzah {nama}. Mengingatkan bahwa hingga saat ini Anda belum melakukan presensi di {sekolah}. Batas check-in pukul {jam_batas} WITA. Mohon segera melakukan presensi kehadiran. Syukran."
  );
  const [isSending, setIsSending] = useState<boolean>(false);
  const [results, setResults] = useState<WhatsAppSendResult[]>([]);
  const [hasSent, setHasSent] = useState<boolean>(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === unrecordedEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unrecordedEmployees.map((e) => e.id));
    }
  };

  const handleSendReminders = async () => {
    if (selectedIds.length === 0) return;

    setIsSending(true);
    setResults([]);
    setHasSent(true);

    const targetList = unrecordedEmployees.filter((e) => selectedIds.includes(e.id));
    const newResults: WhatsAppSendResult[] = [];

    for (const emp of targetList) {
      const message = formatWhatsAppMessage(templateText, {
        nama: emp.name,
        nip: emp.nip,
        sekolah: config.schoolName,
        jam_batas: config.checkInEnd || '07:15',
      });

      const result = await sendWhatsAppMessageViaGateway(
        config,
        emp.phone,
        message,
        emp.name
      );
      newResults.push(result);
    }

    setResults(newResults);
    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-800/80">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">Kirim Pengingat WhatsApp Presensi</h3>
              <p className="text-xs text-emerald-200">
                SDIT Al Izzah Pohuwato • Otomatisasi Pesan Pengingat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Unrecorded Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
            <Users className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">
                {unrecordedEmployees.length} Pegawai Belum Presensi Hari Ini
              </span>
              <p className="text-amber-700 mt-0.5">
                Pilih pegawai yang akan dikirimi pesan pengingat melalui WhatsApp Gateway API atau tautan langsung WhatsApp.
              </p>
            </div>
          </div>

          {/* Template Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Format Teks Pesan Pengingat
            </label>
            <textarea
              rows={3}
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
              placeholder="Tulis format pesan..."
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
              <span className="font-semibold text-slate-600">Variabel:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">
                {'{nama}'}
              </code>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">
                {'{sekolah}'}
              </code>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">
                {'{jam_batas}'}
              </code>
            </div>
          </div>

          {/* Recipient Selection Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Pilih Penerima ({selectedIds.length} dari {unrecordedEmployees.length} dipilih)
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {selectedIds.length === unrecordedEmployees.length
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua'}
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {unrecordedEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Alhamdulillah! Semua pegawai sudah melakukan presensi hari ini.
                </div>
              ) : (
                unrecordedEmployees.map((emp) => {
                  const isChecked = selectedIds.includes(emp.id);
                  const previewMsg = formatWhatsAppMessage(templateText, {
                    nama: emp.name,
                    nip: emp.nip,
                    sekolah: config.schoolName,
                    jam_batas: config.checkInEnd || '07:15',
                  });
                  const directLink = generateWhatsAppLink(emp.phone, previewMsg);

                  return (
                    <div
                      key={emp.id}
                      className={`p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(emp.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {emp.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {emp.position} • {emp.phone}
                          </p>
                        </div>
                      </label>

                      {/* Direct WhatsApp Action */}
                      <a
                        href={directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                        title="Buka Chat WhatsApp Langsung"
                      >
                        <span>Chat Langsung</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Execution Results View */}
          {hasSent && (
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hasil Pengiriman Pengingat:</span>
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      {res.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : res.status === 'fallback_link' ? (
                        <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800">{res.recipientName}</span>
                        <p className="text-[11px] text-slate-500">{res.message}</p>
                      </div>
                    </div>
                    {res.waLink && (
                      <a
                        href={res.waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline shrink-0"
                      >
                        Buka WA
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSendReminders}
            disabled={isSending || selectedIds.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengirim Pengingat...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Pengingat ({selectedIds.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
