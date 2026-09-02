import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const Sidebar = ({ isMobileOpen, onCloseMobile, activeNav, setActiveNav }) => {
  const { leads, activeLeadId, setActiveLeadId, workerProfile, setIsCoopDetailsOpen } = useNegotiation();

  const navItems = [
    {
      id: 'negotiations',
      label: 'Live Negotiations',
      icon: 'forum',
      badge: leads.length,
      badgeColor: 'bg-secondary text-on-secondary',
    },
    {
      id: 'active_jobs',
      label: 'Dispatched & Active Jobs',
      icon: 'engineering',
      badge: '2',
      badgeColor: 'bg-primary text-on-primary',
    },
    {
      id: 'marketplace',
      label: 'New Lead Board',
      icon: 'radar',
      badge: '14 new',
      badgeColor: 'bg-surface-container-high text-on-surface',
    },
    {
      id: 'payouts',
      label: 'Earnings & Instant Payout',
      icon: 'payments',
      badge: null,
    },
    {
      id: 'cooperative',
      label: 'Cooperative Shares & Fund',
      icon: 'account_balance',
      badge: '+8.4% div',
      badgeColor: 'bg-primary-fixed text-on-primary-fixed-variant',
      onClick: () => setIsCoopDetailsOpen(true),
    },
    {
      id: 'tools',
      label: 'Tool & Parts Inventory',
      icon: 'home_repair_service',
      badge: null,
    },
    {
      id: 'safety',
      label: 'Emergency Protocols',
      icon: 'shield',
      badge: null,
    },
    {
      id: 'profile',
      label: 'My Profile & Details',
      icon: 'manage_accounts',
      badge: 'Edit',
      badgeColor: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container (280px desktop width from DESIGN.md) */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-[280px] min-w-[280px] max-w-[280px]
          bg-surface-container-low dark:bg-surface-container-low
          border-r border-outline-variant
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 flex flex-col gap-6 overflow-y-auto">
          {/* Cooperative Member Badge */}
          <div className="bg-surface-container-highest/80 border border-outline-variant rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-on-surface truncate">
                {workerProfile.tier}
              </div>
              <div className="text-[11px] text-on-surface-variant">
                ID: {workerProfile.coopId}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold text-outline uppercase tracking-wider">
              Workspace
            </div>
            {navItems.map((item) => {
              const isActive = item.id === activeNav;
              return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav?.(item.id);
                  if (item.onClick) item.onClick();
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all
                  ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface hover:bg-surface-container hover:text-primary'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      isActive ? 'bg-primary-container text-on-primary-container' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
              );
            })}
          </div>

          {/* Active Negotiations Quick List in Sidebar */}
          <div className="space-y-2 pt-2 border-t border-outline-variant">
            <div className="px-3 text-[11px] font-bold text-outline uppercase tracking-wider flex justify-between items-center">
              <span>Active Threads</span>
              <span className="text-xs text-secondary font-mono font-bold">
                {leads.length}
              </span>
            </div>
            <div className="space-y-1">
              {leads.map((lead) => {
                const isCurrent = lead.id === activeLeadId;
                return (
                  <button
                    key={lead.id}
                    onClick={() => {
                      setActiveLeadId(lead.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`
                      w-full text-left p-2.5 rounded-lg text-xs transition-all border
                      ${
                        isCurrent
                          ? 'bg-surface border-primary text-on-surface shadow-elevation-1'
                          : 'bg-transparent border-transparent hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="truncate">{lead.title}</span>
                      <span className="font-bold text-primary font-mono text-[11px]">
                        ${lead.financials.currentPendingOffer.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-outline mt-1">
                      <span>{lead.id}</span>
                      <span
                        className={`font-semibold ${
                          lead.status === 'YOUR_TURN'
                            ? 'text-secondary'
                            : lead.status === 'ACCEPTED'
                            ? 'text-emerald-600'
                            : 'text-outline'
                        }`}
                      >
                        {lead.status === 'YOUR_TURN'
                          ? 'Your Turn'
                          : lead.status === 'CUSTOMER_TURN'
                          ? 'Waiting'
                          : lead.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cooperative Safety & Emergency Support Banner */}
        <div className="p-4 border-t border-outline-variant bg-surface-container">
          <div className="p-3 bg-secondary-container/40 border border-secondary-container rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">sos</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-on-secondary-container">
                Coop On-Call Safety
              </div>
              <div className="text-[10px] text-on-surface-variant">
                1-800-SAHAKARI (24/7)
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
