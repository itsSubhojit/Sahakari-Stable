import React, { useState } from 'react';
import { formatCurrency, formatDistance } from '../../utils/formatters';

export const GpsTelemetryCard = ({
  worker,
  booking,
  etaSeconds,
  distanceRemainingMeters,
  currentInstruction,
  nextInstruction,
  journeyStatus,
  workerPosition,
  onCallWorker,
  onChatWorker,
  onShareLink,
}) => {
  const [copiedOtp, setCopiedOtp] = useState(false);
  const otpCode = booking?.serviceOtp || '4829';

  // Format ETA into minutes and seconds
  const minutes = Math.floor(etaSeconds / 60);
  const seconds = etaSeconds % 60;
  const formattedEta =
    minutes > 0
      ? `${minutes} min ${seconds > 0 ? `${seconds}s` : ''}`
      : `${seconds}s`;

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(otpCode);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Status message and color configurations
  const getStatusBadge = () => {
    switch (journeyStatus) {
      case 'ARRIVED':
        return {
          label: 'WORKER HAS ARRIVED',
          bg: 'bg-[#d8f3e5] text-[#003822] border-[#a1dfbe]',
          icon: 'check_circle',
        };
      case 'NEARBY':
        return {
          label: 'ARRIVING SHORTLY (< 300m)',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: 'near_me',
        };
      case 'ON_THE_WAY':
      default:
        return {
          label: 'EN ROUTE TO YOUR HOME',
          bg: 'bg-primary-fixed text-on-primary-fixed border-primary/20',
          icon: 'navigation',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="space-y-4">
      {/* ETA & Turn Instruction Hero Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
        {/* Status Pill & Live indicator */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${statusBadge.bg}`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {statusBadge.icon}
            </span>
            {statusBadge.label}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            GPS Precision ±3m
          </div>
        </div>

        {/* Big ETA Display */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-label-sm text-on-surface-variant block font-medium">
              Estimated Arrival
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight flex items-baseline gap-2">
              {journeyStatus === 'ARRIVED' ? 'Arrived Now' : formattedEta}
              {journeyStatus !== 'ARRIVED' && (
                <span className="text-sm font-semibold text-on-surface-variant">
                  ({(distanceRemainingMeters / 1000).toFixed(1)} km away)
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-label-sm text-on-surface-variant block">Vehicle Speed</span>
            <span className="text-xl font-bold text-on-surface">
              {workerPosition?.speed || 0} <span className="text-xs font-normal">km/h</span>
            </span>
          </div>
        </div>

        {/* Turn-by-Turn Instruction Banner */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">turn_right</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface line-clamp-1">
              {currentInstruction}
            </p>
            {nextInstruction && (
              <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                Next: {nextInstruction}
              </p>
            )}
          </div>
        </div>

        {/* 4-Step Journey Progress Bar */}
        <div className="pt-2">
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-semibold mb-1.5">
            <span className="text-primary">Dispatched</span>
            <span
              className={
                journeyStatus !== 'DISPATCHED'
                  ? 'text-primary'
                  : 'text-on-surface-variant'
              }
            >
              On The Way
            </span>
            <span
              className={
                journeyStatus === 'NEARBY' || journeyStatus === 'ARRIVED'
                  ? 'text-primary'
                  : 'text-on-surface-variant'
              }
            >
              Nearby
            </span>
            <span
              className={
                journeyStatus === 'ARRIVED'
                  ? 'text-indigo-700 font-bold'
                  : 'text-on-surface-variant'
              }
            >
              At Doorstep
            </span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                journeyStatus === 'ARRIVED'
                  ? 'w-full bg-indigo-600'
                  : journeyStatus === 'NEARBY'
                  ? 'w-3/4 bg-primary'
                  : 'w-1/2 bg-primary'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Security Start OTP Card (SIH Trust & Escrow Feature) */}
      <div className="bg-gradient-to-br from-primary/5 via-surface to-secondary/5 border-2 border-primary/30 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              key
            </span>
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                Service Start OTP
              </h4>
              <p className="text-[11px] text-on-surface-variant">
                Only share when {worker?.name || 'the worker'} arrives in person
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-surface border-2 border-primary font-mono text-xl font-black px-3.5 py-1 rounded-xl text-primary tracking-widest shadow-inner">
              {otpCode}
            </div>
            <button
              type="button"
              onClick={handleCopyOtp}
              title="Copy OTP"
              className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copiedOtp ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Provider Details & Quick Actions Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  worker?.avatar ||
                  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400'
                }
                alt={worker?.name || 'Worker'}
                className="w-13 h-13 rounded-full object-cover border-2 border-surface-container-high shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white"></span>
            </div>

            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-1.5">
                {worker?.name || 'Rajesh Kumar'}
                <span className="material-symbols-outlined text-primary text-[18px]">
                  verified
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {worker?.title || 'Certified Electrician'}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-on-surface-variant">
                <span className="font-bold text-secondary flex items-center gap-0.5">
                  ★ {worker?.rating || 4.8} ({worker?.reviewsCount || 142})
                </span>
                <span>•</span>
                <span>Electric Scooter (DL-03-EB-4921)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Contact Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/50">
          <button
            type="button"
            onClick={onCallWorker}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            Call
          </button>

          <button
            type="button"
            onClick={onChatWorker}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold border border-outline-variant transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Message
          </button>

          <button
            type="button"
            onClick={onShareLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold border border-outline-variant transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            Share
          </button>
        </div>
      </div>

      {/* Telemetry Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-container-low border border-outline-variant/50 p-2.5 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
            Device Battery
          </span>
          <span className="text-xs font-bold text-on-surface flex items-center justify-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[14px] text-indigo-600">
              battery_charging_full
            </span>
            {workerPosition?.battery || 84}%
          </span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/50 p-2.5 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
            GPS Satellites
          </span>
          <span className="text-xs font-bold text-on-surface flex items-center justify-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[14px] text-primary">
              satellite_alt
            </span>
            14 Active (5G)
          </span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/50 p-2.5 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
            Agreed Rate
          </span>
          <span className="text-xs font-bold text-primary flex items-center justify-center gap-1 mt-0.5">
            {formatCurrency(booking?.agreedPrice || 1500)}
          </span>
        </div>
      </div>
    </div>
  );
};

