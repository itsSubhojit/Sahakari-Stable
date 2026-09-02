import React from 'react';

const placeholders = {
  active_jobs: {
    icon: 'engineering',
    title: 'Dispatched & Active Jobs',
    description: 'Track your currently dispatched jobs, real-time location sharing, and on-site progress updates.',
    color: 'text-primary',
    bg: 'bg-primary/8',
    items: [
      { label: 'REQ-1021 · Pipe Burst Repair', status: 'En Route', eta: '12 min', amount: '$180' },
      { label: 'REQ-0984 · HVAC Filter Replace', status: 'On-Site', eta: 'Active', amount: '$95' },
    ],
  },
  marketplace: {
    icon: 'radar',
    title: 'New Lead Board',
    description: 'Browse open service requests in your area that match your specializations.',
    color: 'text-secondary',
    bg: 'bg-secondary/8',
    items: [
      { label: 'Water Heater Replacement · 3.2km', status: 'Open', eta: 'Posted 4m ago', amount: '$220' },
      { label: 'Toilet Leak Fix · 1.8km', status: 'Open', eta: 'Posted 9m ago', amount: '$80' },
      { label: 'Gas Line Inspection · 5.1km', status: 'Open', eta: 'Posted 15m ago', amount: '$150' },
    ],
  },
  payouts: {
    icon: 'payments',
    title: 'Earnings & Instant Payout',
    description: 'View your earnings history and request instant payouts to your linked UPI or bank account.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/8',
    items: [
      { label: 'Week Ending Aug 30', status: 'Settled', eta: 'Paid to UPI', amount: '$842.50' },
      { label: 'Week Ending Aug 23', status: 'Settled', eta: 'Paid to Bank', amount: '$610.00' },
    ],
  },
  tools: {
    icon: 'home_repair_service',
    title: 'Tool & Parts Inventory',
    description: 'Manage your tool list, track parts usage per job, and request cooperative tool-share pickups.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/8',
    items: [
      { label: 'Pipe Wrench Set (3pc)', status: 'Available', eta: 'In Van', amount: '' },
      { label: 'Copper Fittings (12x)', status: 'Low Stock', eta: 'Reorder', amount: '' },
      { label: 'HVAC Gauge Manifold', status: 'On Loan', eta: 'Return Fri', amount: '' },
    ],
  },
  safety: {
    icon: 'shield',
    title: 'Emergency Protocols',
    description: 'Access Sahakari emergency contacts, safety checklists, and incident reporting tools.',
    color: 'text-red-500',
    bg: 'bg-red-500/8',
    items: [
      { label: 'Gas Leak Protocol', status: 'View', eta: 'Updated Aug 1', amount: '' },
      { label: 'Electrical Hazard Checklist', status: 'View', eta: 'Updated Jul 15', amount: '' },
      { label: 'On-Call Safety Line: 1-800-SAHAKARI', status: '24/7', eta: 'Call Now', amount: '' },
    ],
  },
};

export const WorkspacePlaceholder = ({ navId }) => {
  const config = placeholders[navId];
  if (!config) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-10 gap-6 overflow-y-auto">

      {/* Header */}
      <div className={`w-full max-w-2xl rounded-2xl border border-outline-variant p-6 flex items-start gap-4 shadow-elevation-1 ${config.bg}`}>
        <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center flex-shrink-0 shadow-xs">
          <span className={`material-symbols-outlined text-[28px] ${config.color}`}>{config.icon}</span>
        </div>
        <div>
          <h2 className="text-base font-bold text-on-surface">{config.title}</h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{config.description}</p>
        </div>
      </div>

      {/* Item List */}
      <div className="w-full max-w-2xl flex flex-col gap-3">
        {config.items.map((item, i) => (
          <div
            key={i}
            className="bg-surface border border-outline-variant rounded-xl px-4 py-3 flex items-center justify-between shadow-elevation-1 hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[18px] ${config.color}`}>{config.icon}</span>
              <span className="text-sm font-semibold text-on-surface">{item.label}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] text-outline">{item.eta}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container ${config.color}`}>
                {item.status}
              </span>
              {item.amount && (
                <span className="font-mono text-sm font-bold text-on-surface">{item.amount}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <div className="w-full max-w-2xl border border-dashed border-outline-variant rounded-xl p-5 text-center">
        <span className="material-symbols-outlined text-[28px] text-outline">construction</span>
        <p className="text-xs text-outline mt-2">Full {config.title} interface coming soon in the next release.</p>
      </div>

    </div>
  );
};
