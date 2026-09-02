import React, { useState } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const RejectOfferModal = () => {
  const {
    activeLead,
    isRejectModalOpen,
    setIsRejectModalOpen,
    rejectOffer,
  } = useNegotiation();

  const [selectedReason, setSelectedReason] = useState(
    'Schedule conflict with an existing emergency call'
  );
  const [customNote, setCustomNote] = useState('');

  const reasons = [
    'Schedule conflict with an existing emergency call',
    'Distance is too far for current transit route',
    'Job requires specialized scaffolding/parts not in stock',
    'Offered budget does not cover necessary certified materials',
    'Other reason',
  ];

  const handleReject = () => {
    const finalReason =
      selectedReason === 'Other reason' && customNote.trim()
        ? customNote
        : selectedReason;
    rejectOffer(finalReason);
    setIsRejectModalOpen(false);
  };

  return (
    <Modal
      isOpen={isRejectModalOpen}
      onClose={() => setIsRejectModalOpen(false)}
      title="Decline Offer / Lead"
      subtitle={`Lead ${activeLead.id} will be released back to the Sahakari cooperative board`}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-on-surface mb-2">
            Select Reason for Declining
          </label>
          <div className="space-y-2">
            {reasons.map((reason, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedReason === reason
                    ? 'bg-error-container/30 border-error text-on-surface font-semibold'
                    : 'bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface'
                }`}
              >
                <input
                  type="radio"
                  name="declineReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-0.5 text-error focus:ring-error accent-error"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedReason === 'Other reason' && (
          <div>
            <textarea
              rows="3"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Provide brief context for the cooperative record..."
              className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-error"
            />
          </div>
        )}

        <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant text-[11px] text-outline">
          Note: Declining politely does not penalize your Sahakari Tier 1 ranking if done within the response SLA window.
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={() => setIsRejectModalOpen(false)}
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            variant="error"
            onClick={handleReject}
            icon="cancel"
            className="flex-1"
          >
            Confirm Decline
          </Button>
        </div>
      </div>
    </Modal>
  );
};
