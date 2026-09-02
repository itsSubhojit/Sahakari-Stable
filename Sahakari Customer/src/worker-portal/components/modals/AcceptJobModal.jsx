import React, { useState } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const AcceptJobModal = () => {
  const {
    activeLead,
    isAcceptModalOpen,
    setIsAcceptModalOpen,
    acceptOffer,
  } = useNegotiation();

  const [eta, setEta] = useState(25);
  const [checklist, setChecklist] = useState({
    toolsPacked: true,
    safetyGearReady: true,
    routeConfirmed: true,
  });

  const offerAmount = activeLead.financials.currentPendingOffer || 185;
  const netEarnings = offerAmount * (1 - (activeLead.financials.coopFeePercent || 3) / 100);

  const handleConfirm = () => {
    acceptOffer(eta);
    setIsAcceptModalOpen(false);
  };

  return (
    <Modal
      isOpen={isAcceptModalOpen}
      onClose={() => setIsAcceptModalOpen(false)}
      title="Accept Job & Lock Escrow"
      subtitle={`Request ${activeLead.id} • ${activeLead.title}`}
    >
      <div className="space-y-4">
        {/* Deal Summary Box */}
        <div className="p-4 bg-primary-fixed/20 border border-primary-fixed-dim rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase">
              Agreed Contract Price
            </span>
            <div className="text-2xl font-bold font-mono text-primary dark:text-primary-fixed">
              ${offerAmount.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-on-surface-variant uppercase">
              Instant Net Payout
            </span>
            <div className="text-xl font-bold font-mono text-on-surface">
              ${netEarnings.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Arrival ETA Selection */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-2">
            Select Your Estimated Arrival Time (ETA)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 25, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setEta(mins)}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                  eta === mins
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface'
                }`}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
        </div>

        {/* Dispatch Checklist */}
        <div className="space-y-2 pt-2 border-t border-outline-variant">
          <label className="block text-xs font-bold text-on-surface">
            Worker Readiness Checklist
          </label>
          <div className="space-y-1.5 text-xs text-on-surface">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.toolsPacked}
                onChange={(e) =>
                  setChecklist({ ...checklist, toolsPacked: e.target.checked })
                }
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
              />
              <span>Necessary tools and sealants packed in vehicle</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.safetyGearReady}
                onChange={(e) =>
                  setChecklist({
                    ...checklist,
                    safetyGearReady: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
              />
              <span>Cooperative PPE and safety gear ready</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.routeConfirmed}
                onChange={(e) =>
                  setChecklist({
                    ...checklist,
                    routeConfirmed: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
              />
              <span>Address location checked ({activeLead.distance})</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-3">
          <Button
            variant="outline"
            onClick={() => setIsAcceptModalOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            icon="verified"
            className="flex-2"
          >
            Confirm & Dispatch (${offerAmount.toFixed(2)})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
