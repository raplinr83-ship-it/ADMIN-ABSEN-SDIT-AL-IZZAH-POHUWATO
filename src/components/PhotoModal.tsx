import React from 'react';
import { X, ExternalLink, User, Calendar, Clock, MapPin } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  details?: {
    employeeName?: string;
    nip?: string;
    time?: string;
    location?: string;
    status?: string;
  };
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  details,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[460px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback placeholder
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80';
              }}
            />
          ) : (
            <div className="text-slate-400 text-sm flex flex-col items-center gap-2 p-8">
              <User className="w-12 h-12 text-slate-500" />
              <span>Tidak ada foto selfie yang dilampirkan</span>
            </div>
          )}
        </div>

        {/* Details Footer */}
        {details && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
            {details.employeeName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nama Pegawai:</span>
                <span className="font-semibold text-slate-800">
                  {details.employeeName} ({details.nip})
                </span>
              </div>
            )}
            {details.time && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Waktu Presensi:</span>
                <span className="font-medium text-emerald-700">{details.time} WITA</span>
              </div>
            )}
            {details.location && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lokasi / Jarak:</span>
                <span className="font-medium text-slate-700">{details.location}</span>
              </div>
            )}
            {details.status && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Kehadiran:</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">
                  {details.status}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
          {imageUrl ? (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 p-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Ukuran Penuh</span>
            </a>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
