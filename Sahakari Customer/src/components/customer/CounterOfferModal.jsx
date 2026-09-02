import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { formatCurrency } from '../../utils/formatters';

export const CounterOfferModal = ({
  isOpen,
  onClose,
  currentPrice = 1500,
  onSubmitOffer,
}) => {
  const aiEstimate = Math.round(currentPrice * 0.88);
  const [offerAmount, setOfferAmount] = useState(aiEstimate);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const quickBids = [
    { label: 'AI Fair', multiplier: 1 },
    { label: '5% Less', multiplier: 0.95 },
    { label: '10% Less', multiplier: 0.90 },
    { label: '15% Less', multiplier: 0.85 },
  ];

  const handleQuickSelect = (multiplier) => {
    const val = Math.round(currentPrice * multiplier);
    setOfferAmount(val);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = Number(offerAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > currentPrice) {
      setError('Bid should not be higher than the current quote');
      return;
    }
    if (amount < currentPrice * 0.5) {
      setError('Bid is too low for the service. Try a value closer to the AI estimate.');
      return;
    }

    onSubmitOffer(amount, note || 'I am sending this bid based on the AI fair-price estimate.');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place Your Bid"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-center justify-between">
          <div>
            <span className="text-label-sm text-on-surface-variant block">
              AI Estimated Fair Price
            </span>
            <span className="text-headline-sm font-bold text-on-surface">
              {formatCurrency(aiEstimate)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-label-sm text-on-surface-variant block">
              Your Bid
            </span>
            <span className="text-headline-sm font-bold text-primary">
              {formatCurrency(offerAmount || 0)}
            </span>
          </div>
        </div>

        <div className="text-xs text-on-surface-variant bg-primary-fixed/20 border border-primary/20 rounded-lg p-3">
          This works like a cab fare bid: send your price, wait for provider response, and lower it if needed until it matches a fair deal.
        </div>

        <div>
          <label className="text-label-sm font-semibold text-on-surface-variant block mb-2">
            Quick Bid Suggestions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickBids.map((item) => {
              const calcVal = Math.round(currentPrice * item.multiplier);
              const isSelected = offerAmount === calcVal;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleQuickSelect(item.multiplier)}
                  className={`py-2 px-2 rounded-lg text-label-sm font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {item.label}
                  <span className="block text-[11px] font-normal opacity-90">
                    ₹{calcVal}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Input
            label="Enter Your Bid Amount (₹)"
            type="number"
            value={offerAmount}
            onChange={(e) => {
              setOfferAmount(e.target.value);
              setError('');
            }}
            placeholder="e.g. 1400"
            error={error}
            icon="currency_rupee"
          />
        </div>

        <div>
          <Input
            label="Optional Message"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Based on standard job size and materials"
            icon="edit_note"
          />
        </div>

        <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-3">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon="send"
          >
            Send Bid
          </Button>
        </div>
      </form>
    </Modal>
  );
};

