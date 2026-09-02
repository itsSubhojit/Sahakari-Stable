import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const QuickStatsBar = () => {
  const { workerProfile, activeLead } = useNegotiation();

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="bg-surface-container-low border-b border-outline-variant px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Metrics pills */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        {/* Today's Net Earnings */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface rounded-md border border-outline-variant">
          <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
            account_balance_wallet
          </span>
          <span className="text-on-surface-variant">Today's Earnings:</span>
          <strong className="font-bold text-on-surface font-mono">
            ${workerProfile.todayEarnings.toFixed(2)}
          </strong>
        </div>

        {/* Jobs Completed Today */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-surface rounded-md border border-outline-variant">
          <span className="material-symbols-outlined text-[16px] text-secondary">
            task_alt
          </span>
          <span className="text-on-surface-variant">Completed:</span>
          <strong className="font-bold text-on-surface">
            {workerProfile.completedJobsToday} jobs
          </strong>
        </div>

        {/* Low Cooperative Platform Fee Notice */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-primary-fixed/40 rounded-md border border-primary-fixed-dim">
          <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
            savings
          </span>
          <span className="text-on-primary-fixed-variant font-medium">
            Only 3% Coop Fee (Keep 97% of Gross)
          </span>
        </div>
      </div>

      {/* SLA Timer & Escrow Guarantee */}
      <div className="flex items-center gap-3">
        {activeLead.status === 'YOUR_TURN' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-error-container/60 text-on-error-container rounded-md border border-error/30 font-semibold">
            <span className="material-symbols-outlined text-[16px] text-error animate-pulse">
              timer
            </span>
            <span>Response SLA:</span>
            <span className="font-mono font-bold">
              {formatSeconds(activeLead.slaSecondsRemaining)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
            lock
          </span>
          <span className="hidden sm:inline">Escrow Guaranteed</span>
        </div>
      </div>
    </div>
  );
};
