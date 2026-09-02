import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { LiveGpsMap } from '../../components/map/LiveGpsMap';
import { GpsTelemetryCard } from '../../components/customer/GpsTelemetryCard';
import { TrackingSimulationBar } from '../../components/customer/TrackingSimulationBar';
import { QuickContactModal } from '../../components/customer/QuickContactModal';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useBooking } from '../../hooks/useBooking';
import { useGpsTracker } from '../../hooks/useGpsTracker';
import { api } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';

export const LiveTracking = () => {
  const { bookingId = 'BK-7892' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { currentBooking } = useBooking();
  const workerId =
    searchParams.get('worker') || currentBooking?.workerId || 'worker-1';

  const [worker, setWorker] = useState(currentBooking?.worker || null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactType, setContactType] = useState('call'); // 'call' or 'chat'
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Load worker data if not in state
  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const data = await api.getWorkerById(workerId);
        setWorker(data);
      } catch (err) {
        console.error('Failed to load worker data for tracking', err);
      }
    };
    fetchWorker();
  }, [workerId]);

  // Initialize live GPS tracking engine
  const {
    workerPosition,
    customerLocation,
    distanceRemainingMeters,
    etaSeconds,
    currentInstruction,
    nextInstruction,
    journeyStatus,
    isPlaying,
    simSpeed,
    setSimSpeed,
    togglePlay,
    resetSimulation,
    jumpToDestination,
    fullPathCoordinates,
    traversedPathCoordinates,
    remainingPathCoordinates,
    requestRealGps,
    isUsingRealGps,
    realGpsError,
  } = useGpsTracker();

  const handleOpenCall = () => {
    setContactType('call');
    setContactModalOpen(true);
  };

  const handleOpenChat = () => {
    setContactType('chat');
    setContactModalOpen(true);
  };

  const handleShareLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  return (
    <Layout title={t('tracking.pageTitle')}>
      <div className="space-y-4">
        {/* Top Header with Live Tracking Badge & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-outline-variant rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/booking/${bookingId}`)}
              className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors flex items-center justify-center cursor-pointer"
              title={t('tracking.backToBooking')}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-primary">
                  {t('tracking.heading')}
                </h2>
                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  {t('tracking.realTime')}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                {t('tracking.bookingId')} <strong className="text-on-surface">{bookingId}</strong> • {t('tracking.service')} {currentBooking?.serviceName || t('tracking.defaultService')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SOS Emergency button */}
            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-red-600">
                emergency
              </span>
              {t('tracking.safetySos')}
            </button>

            {/* Share link button */}
            <button
              type="button"
              onClick={handleShareLink}
              className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold border border-outline-variant flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              {shareToast ? t('tracking.linkCopied') : t('tracking.shareLiveTrip')}
            </button>
          </div>
        </div>

        {/* Responsive Grid: Interactive Map + Status Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Map Viewport (col-span-7 on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <LiveGpsMap
              workerPosition={workerPosition}
              customerLocation={customerLocation}
              workerInfo={worker}
              traversedPath={traversedPathCoordinates}
              remainingPath={remainingPathCoordinates}
              fullPath={fullPathCoordinates}
              height="540px"
              interactive={true}
              autoCenter={true}
            />

            {/* Customer Live GPS Location Bar */}
            <TrackingSimulationBar
              onRequestRealGps={requestRealGps}
              isUsingRealGps={isUsingRealGps}
              realGpsError={realGpsError}
            />
          </div>

          {/* Telemetry & Worker Details (col-span-5 on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            <GpsTelemetryCard
              worker={worker}
              booking={currentBooking}
              etaSeconds={etaSeconds}
              distanceRemainingMeters={distanceRemainingMeters}
              currentInstruction={currentInstruction}
              nextInstruction={nextInstruction}
              journeyStatus={journeyStatus}
              workerPosition={workerPosition}
              onCallWorker={handleOpenCall}
              onChatWorker={handleOpenChat}
              onShareLink={handleShareLink}
            />
          </div>
        </div>
      </div>

      {/* Quick Contact Modal (Call or In-App Message) */}
      <QuickContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        type={contactType}
        worker={worker}
      />

      {/* Emergency SOS Safety Modal */}
      <Modal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        title={t('tracking.sosTitle')}
      >
        <div className="space-y-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-[28px] flex-shrink-0">
              shield_with_heart
            </span>
            <div>
              <h4 className="text-sm font-bold text-red-900">
                {t('tracking.sosHeading')}
              </h4>
              <p className="text-xs text-red-700 mt-1">
                {t('tracking.sosDesc')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <a
              href="tel:112"
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">call</span>
                <span>{t('tracking.emergencyHotline')}</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">{t('tracking.dial')}</span>
            </a>
          </div>

          <Button
            fullWidth
            variant="outline"
            onClick={() => setSosModalOpen(false)}
            className="mt-2"
          >
            {t('tracking.closeSafety')}
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

