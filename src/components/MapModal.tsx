import React from 'react';
import { X, MapPin, School, Navigation, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SchoolConfig } from '../types';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  checkInLat?: number;
  checkInLng?: number;
  checkInDistance?: number;
  employeeName: string;
  checkInTime?: string;
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  config,
  checkInLat,
  checkInLng,
  checkInDistance = 0,
  employeeName,
  checkInTime,
}) => {
  if (!isOpen) return null;

  const schoolLat = config.schoolLat || 0.5312;
  const schoolLng = config.schoolLng || 121.9213;
  const targetLat = checkInLat ?? schoolLat;
  const targetLng = checkInLng ?? schoolLng;
  const radius = config.radiusMeters || 150;
  const isInsideRadius = checkInDistance <= radius;

  // OpenStreetMap embed URL centered between school and employee
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${targetLng - 0.005}%2C${targetLat - 0.004}%2C${targetLng + 0.005}%2C${targetLat + 0.004}&layer=mapnik&marker=${targetLat}%2C${targetLng}`;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${schoolLat},${schoolLng}&destination=${targetLat},${targetLng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Verifikasi Lokasi Presensi GPS
              </h3>
              <p className="text-xs text-slate-500">
                {employeeName} {checkInTime ? `• Waktu: ${checkInTime} WITA` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between text-xs font-semibold ${
            isInsideRadius
              ? 'bg-emerald-100/80 text-emerald-900 border-b border-emerald-200'
              : 'bg-amber-100/80 text-amber-900 border-b border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isInsideRadius ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            )}
            <span>
              {isInsideRadius
                ? `Dalam Radius Presensi (${checkInDistance} meter dari pusat sekolah)`
                : `Di Luar Radius Presensi (${checkInDistance} meter, melebihi batas toleransi ${radius}m)`}
            </span>
          </div>
          <span className="bg-white/80 px-2 py-0.5 rounded-full text-[11px] shadow-2xs font-mono">
            Radius Maks: {radius}m
          </span>
        </div>

        {/* Map View */}
        <div className="relative flex-1 bg-slate-100 min-h-[300px]">
          <iframe
            title="Peta Lokasi Presensi"
            className="w-full h-full min-h-[300px] border-0"
            src={mapEmbedUrl}
          />
          {/* Overlay Coordinates Card */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-md border border-slate-200 text-xs space-y-1 max-w-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <School className="w-3.5 h-3.5" />
              <span>{config.schoolName}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Sekolah: {schoolLat.toFixed(5)}, {schoolLng.toFixed(5)}
            </div>
            <div className="text-[11px] text-slate-700 font-mono">
              Titik Absen: {targetLat.toFixed(5)}, {targetLng.toFixed(5)}
            </div>
          </div>
        </div>

        {/* Footer Info & Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px]">Jarak dari Sekolah</span>
              <span className="font-bold text-slate-800 text-sm">{checkInDistance} meter</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Toleransi Radius</span>
              <span className="font-bold text-slate-800 text-sm">{radius} meter</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Buka Petunjuk Arah di Google Maps</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
