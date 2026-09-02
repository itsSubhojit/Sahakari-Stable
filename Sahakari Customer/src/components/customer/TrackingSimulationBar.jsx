import React from 'react';

export const TrackingSimulationBar = ({
  onRequestRealGps,
  isUsingRealGps,
  realGpsError,
}) => {
  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              {isUsingRealGps ? 'my_location' : 'location_on'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                My Live GPS Location
              </h4>
              {isUsingRealGps && (
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isUsingRealGps
                ? 'Your device GPS coordinates are active and synced on the map'
                : 'Click to detect and place your current real-time GPS location on the map'}
            </p>
          </div>
        </div>

        {/* Real GPS Trigger Button */}
        <button
          type="button"
          onClick={onRequestRealGps}
          title="Use your phone or device live GPS position"
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0 ${
            isUsingRealGps
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-primary hover:bg-primary/90 text-on-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isUsingRealGps ? 'check_circle' : 'my_location'}
          </span>
          {isUsingRealGps ? 'My Live GPS Active' : 'Use My Live GPS'}
        </button>
      </div>

      {realGpsError && (
        <div className="text-[11px] bg-red-50 text-red-700 p-2 rounded-lg border border-red-200">
          Location Notice: {realGpsError}
        </div>
      )}
    </div>
  );
};

