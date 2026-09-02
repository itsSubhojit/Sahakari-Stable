import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const EarningsCalculator = () => {
  const { activeLead, setIsCoopDetailsOpen } = useNegotiation();

  const offer = activeLead.financials.currentPendingOffer || 185;
  const coopFeeRate = activeLead.financials.coopFeePercent || 3.0;
  const coopFeeAmount = offer * (coopFeeRate / 100);
  const netEarnings = offer - coopFeeAmount;

  // Comparison with 20% platform commission
  const standardGigCommission = offer * 0.20;
  const workerSavingsWithSahakari = standardGigCommission - coopFeeAmount;

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 md:p-5 shadow-elevation-1 space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
          Payout & Cooperative Economics
        </h3>
        <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded">
          97% Net Payout
        </span>
      </div>

      {/* Financial Breakdown Table */}
      <div className="space-y-2 text-xs border-y border-outline-variant py-2.5">
        <div className="flex justify-between items-center text-on-surface">
          <span>Gross Agreed Amount</span>
          <span className="font-mono font-bold">${offer.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-on-surface-variant">
          <div className="flex items-center gap-1">
            <span>Coop Contribution ({coopFeeRate}%)</span>
            <button
              onClick={() => setIsCoopDetailsOpen(true)}
              className="text-primary hover:underline"
              title="Learn about Sahakari Dividend Pool"
            >
              <span className="material-symbols-outlined text-[13px]">help</span>
            </button>
          </div>
          <span className="font-mono text-outline">-${coopFeeAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-primary dark:text-primary-fixed pt-1 border-t border-outline-variant/40 font-bold text-sm">
          <span>Net Worker Payout</span>
          <span className="font-mono text-base">${netEarnings.toFixed(2)}</span>
        </div>
      </div>

      {/* Value Comparison Banner */}
      <div className="p-2.5 bg-primary-fixed/20 border border-primary-fixed-dim rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            trending_up
          </span>
          <div>
            <div className="font-bold text-primary dark:text-primary-fixed">
              +${workerSavingsWithSahakari.toFixed(2)} Extra
            </div>
            <div className="text-[10px] text-on-surface-variant">
              vs corporate 20% platform cut
            </div>
          </div>
        </div>

        <span className="text-[10px] font-bold text-primary bg-white/80 dark:bg-black/30 px-2 py-1 rounded">
          Instant UPI / Bank
        </span>
      </div>
    </div>
  );
};
