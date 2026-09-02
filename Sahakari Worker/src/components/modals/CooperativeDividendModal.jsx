import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const CooperativeDividendModal = () => {
  const {
    isCoopDetailsOpen,
    setIsCoopDetailsOpen,
    workerProfile,
  } = useNegotiation();

  return (
    <Modal
      isOpen={isCoopDetailsOpen}
      onClose={() => setIsCoopDetailsOpen(false)}
      title="Sahakari Cooperative Dividend & Benefits"
      subtitle={`Member Account: ${workerProfile.coopId} • ${workerProfile.name}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs text-on-surface">
        {/* Cooperative Stake Banner */}
        <div className="p-4 bg-primary text-on-primary rounded-xl space-y-2 shadow-elevation-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
              Your Ownership Stake
            </span>
            <span className="px-2 py-0.5 bg-primary-container text-on-primary-container font-bold rounded text-[11px]">
              Active Partner
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-bold font-mono text-primary-fixed">
                {workerProfile.sharesValue}
              </div>
              <div className="text-xs text-on-primary-container">
                {workerProfile.sharesHeld} Equity Units Held
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-300">+8.4% YoY</div>
              <div className="text-[10px] text-on-primary-container">
                Quarterly Dividend Yield
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown of the 3% Coop Fee */}
        <div>
          <h4 className="font-bold text-sm text-on-surface mb-2">
            Where Does the 3% Platform Fee Go?
          </h4>
          <div className="space-y-2">
            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  medical_services
                </span>
                <div>
                  <div className="font-bold">1.2% • Worker Health & Injury Shield</div>
                  <div className="text-[11px] text-on-surface-variant">
                    Emergency on-the-job insurance and family hospitalization cover
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  savings
                </span>
                <div>
                  <div className="font-bold">1.0% • Micro-Tool Loans & Dividend Pool</div>
                  <div className="text-[11px] text-on-surface-variant">
                    0% interest equipment upgrade funds distributed back to members
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  dns
                </span>
                <div>
                  <div className="font-bold">0.8% • Open-Source App & Server Hosting</div>
                  <div className="text-[11px] text-on-surface-variant">
                    Running the matching server, GPS dispatch, and SMS gateways
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => setIsCoopDetailsOpen(false)}
          >
            Got It
          </Button>
        </div>
      </div>
    </Modal>
  );
};
