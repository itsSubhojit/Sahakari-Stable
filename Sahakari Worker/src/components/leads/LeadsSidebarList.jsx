import React, { useState } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { Badge } from '../common/Badge';

export const LeadsSidebarList = () => {
  const { leads, activeLeadId, setActiveLeadId } = useNegotiation();
  const [searchQuery, setSearchQuery] = useState('');

  // Suresh Patel matches "Plumbing" and "HVAC & Appliances"
  const isCategoryMatch = (category) => {
    const cat = category.toLowerCase();
    return cat.includes('plumbing') || cat.includes('hvac') || cat.includes('appliance');
  };

  const matchesSearch = (lead) => {
    return (
      lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const incomingBroadcasts = leads.filter(
    (lead) => !lead.acceptedByWorker && matchesSearch(lead)
  );

  const activeAiChats = leads.filter(
    (lead) => lead.acceptedByWorker && matchesSearch(lead)
  );

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-elevation-1 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
          Sahakari SMS Dispatch
        </h3>
        <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Bids
        </span>
      </div>

      {/* Search box */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by skill, ID, or client..."
          className="w-full h-9 pl-8 pr-3 bg-surface-container rounded-md border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
        />
      </div>

      {/* Section 1: Incoming Broadcast Bids (SMS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">
            Incoming SMS Broadcasts ({incomingBroadcasts.length})
          </span>
          {incomingBroadcasts.length > 0 && (
            <span className="w-2.5 h-2.5 bg-error rounded-full animate-ping" />
          )}
        </div>

        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-0.5">
          {incomingBroadcasts.length === 0 ? (
            <div className="p-3 bg-surface-container-low rounded-lg border border-dashed border-outline-variant text-center text-[11px] text-outline">
              No matching incoming SMS bids.
            </div>
          ) : (
            incomingBroadcasts.map((lead) => {
              const isSelected = lead.id === activeLeadId;
              const hasMatch = isCategoryMatch(lead.category);

              return (
                <div
                  key={lead.id}
                  onClick={() => setActiveLeadId(lead.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface-container-high border-secondary shadow-elevation-1'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs text-on-surface truncate">
                          {lead.title}
                        </h4>
                        {hasMatch && (
                          <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded uppercase tracking-wider">
                            Match
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {lead.customer.name} • {lead.distance}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-xs text-secondary">
                        ${lead.financials.customerInitialOffer.toFixed(0)}
                      </div>
                      <div className="text-[9px] text-outline font-semibold">Bid</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/40 text-[9px]">
                    <span className="font-mono text-outline">{lead.id}</span>
                    <span className="font-bold text-secondary-container-on bg-secondary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px] animate-pulse">sms</span>
                      Awaiting Accept
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 2: Active AI Chatbots */}
      <div className="space-y-2">
        <div className="px-1">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">
            Active AI Conversations ({activeAiChats.length})
          </span>
        </div>

        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-0.5">
          {activeAiChats.length === 0 ? (
            <div className="p-3 bg-surface-container-low rounded-lg border border-dashed border-outline-variant text-center text-[11px] text-outline">
              No active AI negotiator sessions.
            </div>
          ) : (
            activeAiChats.map((lead) => {
              const isSelected = lead.id === activeLeadId;
              const isAutopilot = lead.aiMode === 'AUTOPILOT';

              return (
                <div
                  key={lead.id}
                  onClick={() => setActiveLeadId(lead.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface-container-high border-primary shadow-elevation-1'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-on-surface truncate">
                        {lead.title}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {lead.customer.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-xs text-primary dark:text-primary-fixed">
                        ${lead.financials.currentPendingOffer.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/40 text-[9px]">
                    <span className="font-mono text-outline">{lead.id}</span>
                    {lead.status === 'ACCEPTED' ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]">done_all</span>
                        Dispatched
                      </span>
                    ) : lead.status === 'REJECTED' ? (
                      <span className="font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">Closed</span>
                    ) : (
                      <span className={`font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        isAutopilot ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10'
                      }`}>
                        <span className="material-symbols-outlined text-[10px] animate-spin">
                          {isAutopilot ? 'smart_toy' : 'hourglass'}
                        </span>
                        AI: {isAutopilot ? 'Autopilot' : 'Co-pilot'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
