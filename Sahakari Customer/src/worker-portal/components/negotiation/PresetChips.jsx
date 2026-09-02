import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const PresetChips = ({ onSelectAmount, currentInputAmount }) => {
  const { activeLead } = useNegotiation();

  const pending = activeLead.financials.currentPendingOffer || 185;
  const lastWorker = activeLead.financials.workerLastCounter || (pending + 35);

  const presets = [
    {
      label: '+$10',
      value: pending + 10,
      description: `$${(pending + 10).toFixed(0)}`,
    },
    {
      label: '+$20',
      value: pending + 20,
      description: `$${(pending + 20).toFixed(0)}`,
    },
    {
      label: 'Split 50/50',
      value: Math.round(((pending + lastWorker) / 2) * 100) / 100,
      description: `$${((pending + lastWorker) / 2).toFixed(2)}`,
    },
    {
      label: 'Base Rate',
      value: lastWorker,
      description: `$${lastWorker.toFixed(0)}`,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
      <span className="text-[11px] font-bold text-outline uppercase tracking-wider whitespace-nowrap">
        Quick Presets:
      </span>
      {presets.map((p, idx) => {
        const isSelected = parseFloat(currentInputAmount) === p.value;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectAmount(p.value.toString())}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all border
              ${
                isSelected
                  ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-outline-variant'
              }
            `}
          >
            <span>{p.label}</span>
            <span className="font-mono opacity-80 font-bold">({p.description})</span>
          </button>
        );
      })}
    </div>
  );
};
