import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const TurnBanner = () => {
  const { activeLead } = useNegotiation();

  let bg = 'bg-surface-container-high';
  let textColor = 'text-on-surface';
  let label = 'Awaiting Status';
  let icon = 'hourglass_empty';
  let pulse = false;

  if (!activeLead.acceptedByWorker) {
    bg = 'bg-secondary/20';
    textColor = 'text-secondary-fixed-dim text-secondary font-bold';
    label = '📢 Broadcast Bid • Accept request to open SMS channel & delegate to AI Bot';
    icon = 'contact_mail';
    pulse = true;
  } else if (activeLead.status === 'ACCEPTED') {
    bg = 'bg-primary';
    textColor = 'text-primary-fixed';
    label = '✓ JOB CONFIRMED • Escrow Locked & Dispatched';
    icon = 'check_circle';
  } else if (activeLead.status === 'REJECTED') {
    bg = 'bg-error-container';
    textColor = 'text-on-error-container';
    label = '✕ OFFER CLOSED • Negotiation Finished';
    icon = 'cancel';
  } else {
    if (activeLead.aiMode === 'AUTOPILOT') {
      bg = 'bg-primary-container';
      textColor = 'text-on-primary-container';
      label = activeLead.status === 'YOUR_TURN'
        ? '🤖 AI Autopilot Active • Sending SMS autonomously...'
        : '⏳ AI Autopilot Waiting • Client reviewing SMS...';
      icon = 'smart_toy';
      pulse = activeLead.status === 'YOUR_TURN';
    } else {
      if (activeLead.status === 'YOUR_TURN') {
        bg = 'bg-primary-container';
        textColor = 'text-on-primary-container';
        label = '👥 AI Co-pilot Ready • Approve draft reply or send instructions';
        icon = 'cognition';
        pulse = true;
      } else {
        bg = 'bg-surface-container-high';
        textColor = 'text-on-surface';
        label = '⏳ Waiting for Client • Customer is reviewing AI-generated SMS';
        icon = 'hourglass_top';
      }
    }
  }

  return (
    <div
      className={`${bg} ${textColor} py-2.5 px-4 w-full border-b border-outline-variant flex items-center justify-between shadow-xs transition-colors duration-300 relative z-10`}
    >
      <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
        <span
          className={`material-symbols-outlined text-[18px] ${
            pulse ? 'animate-pulse' : ''
          }`}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>

      <span className="text-[11px] font-semibold opacity-90 hidden sm:inline-block">
        Sahakari Direct Escrow
      </span>
    </div>
  );
};
