import React, { useState, useEffect } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { Button } from '../common/Button';

export const CounterActionBar = () => {
  const {
    activeLead,
    setIsAcceptModalOpen,
    setIsRejectModalOpen,
    acceptLeadBroadcast,
    setLeadAiMode,
    updateLeadAiDraft,
    sendAiSms,
  } = useNegotiation();

  const [draftText, setDraftText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [manualMessage, setManualMessage] = useState('');

  // Sync state with active lead's draft
  useEffect(() => {
    if (activeLead) {
      setDraftText(activeLead.aiDraft || '');
    }
  }, [activeLead?.aiDraft, activeLead?.id]);

  if (!activeLead) return null;

  const isCompleted = activeLead.status === 'ACCEPTED' || activeLead.status === 'REJECTED';

  if (isCompleted) {
    return (
      <div className="bg-surface-container-high border-t border-outline-variant p-5 text-center">
        <p className="text-sm font-semibold text-on-surface flex items-center justify-center gap-2">
          {activeLead.status === 'ACCEPTED' ? (
            <>
              <span className="material-symbols-outlined text-emerald-500 text-[20px] animate-bounce">
                check_circle
              </span>
              <span>Job Accepted & Dispatched! Sahakari safety escrow activated.</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-error text-[20px]">
                cancel
              </span>
              <span>Negotiation concluded for this lead.</span>
            </>
          )}
        </p>
      </div>
    );
  }

  // --- STATE 1: NOT ACCEPTED YET (Broadcast Bid) ---
  if (!activeLead.acceptedByWorker) {
    return (
      <div className="bg-surface-container-lowest border-t border-outline-variant p-5 md:p-6 flex flex-col gap-4 shadow-elevation-3 relative z-20">
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
          <span className="material-symbols-outlined text-amber-500 text-[22px] animate-pulse">
            broadcast_on_personal
          </span>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Incoming SMS Broadcast Request</h3>
            <p className="text-[11px] text-outline">Available to matching specialists in your region</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-3.5 rounded-lg border border-outline-variant/60">
          <div>
            <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Initial Bid</span>
            <span className="font-mono text-base font-bold text-secondary-fixed-dim">
              ${activeLead.financials.customerInitialOffer.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Distance</span>
            <span className="text-sm font-bold text-on-surface">
              {activeLead.distance}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Category</span>
            <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded inline-block mt-0.5">
              {activeLead.category}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Coop Fee</span>
            <span className="text-xs font-bold text-on-surface">
              {activeLead.financials.coopFeePercent}%
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="primary"
            size="touch"
            onClick={() => acceptLeadBroadcast(activeLead.id)}
            icon="check"
            className="flex-1 text-sm font-bold tracking-wide py-3 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            ACCEPT REQUEST & ACTIVATE AI BOT
          </Button>

          <Button
            variant="outline"
            size="touch"
            onClick={() => setIsRejectModalOpen(true)}
            icon="close"
            className="w-full sm:w-40 text-xs font-bold border-error text-error hover:bg-error/5"
          >
            DECLINE REQUEST
          </Button>
        </div>
      </div>
    );
  }

  // --- STATE 2: ACCEPTED BY WORKER (AI Command Console) ---
  const handleRedraft = (e) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    // Simulate AI regenerating the draft based on instruction
    const currentPrice = activeLead.financials.currentPendingOffer;
    const newPrice = currentPrice + 10;
    const updatedText = `Hi ${activeLead.customer.name}! Suresh here via AI agent. ${instruction}. Let's settle at $${newPrice.toFixed(2)} with standard parts included.`;

    updateLeadAiDraft(activeLead.id, updatedText);
    setInstruction('');
  };

  const handleSendManualSms = (e) => {
    e.preventDefault();
    if (!manualMessage.trim()) return;

    // Treat manual message as a worker SMS (non-AI style, or AI Off)
    sendAiSms(activeLead.id, manualMessage);
    setManualMessage('');
  };

  return (
    <div className="bg-surface border-t border-outline-variant p-3 md:p-4 flex flex-col gap-3 shadow-elevation-3 relative z-20">
      
      {/* AI Mode Selector Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">settings_accessibility</span>
            AI Negotiation Control Mode
          </span>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
            Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1 rounded-lg border border-outline-variant/60">
          <button
            onClick={() => setLeadAiMode(activeLead.id, 'AUTOPILOT')}
            className={`py-2 px-1 text-center rounded flex flex-col items-center justify-center gap-1 transition-all ${
              activeLead.aiMode === 'AUTOPILOT'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="text-[11px] font-bold">Autopilot</span>
          </button>

          <button
            onClick={() => setLeadAiMode(activeLead.id, 'COPILOT')}
            className={`py-2 px-1 text-center rounded flex flex-col items-center justify-center gap-1 transition-all ${
              activeLead.aiMode === 'COPILOT'
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">cognition</span>
            <span className="text-[11px] font-bold">Co-pilot</span>
          </button>

          <button
            onClick={() => setLeadAiMode(activeLead.id, 'OFF')}
            className={`py-2 px-1 text-center rounded flex flex-col items-center justify-center gap-1 transition-all ${
              activeLead.aiMode === 'OFF'
                ? 'bg-surface-container-highest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">cancel_presentation</span>
            <span className="text-[11px] font-bold">AI Off</span>
          </button>
        </div>
      </div>

      {/* Dynamic Mode UI Panels */}
      <div className="bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/60">
        
        {/* AUTOPILOT MODE UI */}
        {activeLead.aiMode === 'AUTOPILOT' && (
          <div className="flex flex-col items-center justify-center py-3 text-center space-y-1">
            <span className="material-symbols-outlined text-[26px] text-primary animate-spin">
              autorenew
            </span>
            <div className="text-[11px] font-bold text-on-surface">
              Autopilot Mode Active 🤖
            </div>
            <p className="text-[10px] text-outline max-w-[280px]">
              AI is currently negotiating with {activeLead.customer.name} autonomously.
            </p>
          </div>
        )}

        {/* CO-PILOT MODE UI */}
        {activeLead.aiMode === 'COPILOT' && (
          <div className="space-y-2">
            {activeLead.status === 'CUSTOMER_TURN' ? (
              <div className="flex flex-col items-center justify-center py-3 text-center">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping mb-1.5" />
                <span className="text-[11px] font-bold text-on-surface">Waiting for Client Response</span>
                <p className="text-[10px] text-outline">
                  AI is monitoring the SMS line.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">reviews</span>
                    Recommended SMS Draft
                  </span>
                  <span className="text-[9px] text-outline font-medium">Editable</span>
                </div>

                {/* Draft TextArea */}
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Recommended SMS draft..."
                  rows={2}
                  className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary transition-all leading-normal"
                />

                {/* Custom Redraft Instructions */}
                <form onSubmit={handleRedraft} className="flex gap-1.5">
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Tell AI to change/add something..."
                    className="flex-1 h-8 px-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-[10px] text-on-surface focus:outline-none focus:border-secondary"
                  />
                  <button
                    type="submit"
                    className="h-8 px-2.5 bg-secondary/15 hover:bg-secondary/25 border border-secondary/35 rounded-lg text-[10px] font-bold text-secondary flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                    Re-draft
                  </button>
                </form>

                {/* Primary Action Trigger */}
                <div className="pt-0.5">
                  <Button
                    variant="primary"
                    size="touch"
                    onClick={() => sendAiSms(activeLead.id, draftText)}
                    icon="send"
                    className="w-full text-xs font-bold tracking-wide py-2 bg-secondary text-on-secondary hover:opacity-95"
                  >
                    APPROVE & SEND SMS
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI OFF / MANUAL MODE UI */}
        {activeLead.aiMode === 'OFF' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">send</span>
                Send Manual SMS Offer
              </span>
            </div>

            <form onSubmit={handleSendManualSms} className="flex gap-2">
              <input
                type="text"
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                placeholder="Type manual SMS message here..."
                className="flex-1 h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
              />
              <button
                type="submit"
                disabled={!manualMessage.trim()}
                className="h-9 px-4 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[14px]">send</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Global Lock/Cancel Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="touch"
          onClick={() => setIsAcceptModalOpen(true)}
          icon="lock"
          className="flex-1 text-xs font-bold tracking-wider text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/5 py-2"
        >
          ACCEPT DEAL (${activeLead.financials.currentPendingOffer.toFixed(0)})
        </Button>

        <Button
          variant="outline"
          size="touch"
          onClick={() => setIsRejectModalOpen(true)}
          icon="close"
          className="w-20 sm:w-24 text-xs font-bold border-outline-variant text-outline hover:bg-outline-variant/10 py-2"
        >
          CLOSE
        </Button>
      </div>
    </div>
  );
};
