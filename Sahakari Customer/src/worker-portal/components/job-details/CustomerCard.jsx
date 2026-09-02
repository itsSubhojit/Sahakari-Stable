import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { Badge } from '../common/Badge';

export const CustomerCard = () => {
  const { activeLead, addToast } = useNegotiation();
  const customer = activeLead.customer;

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 md:p-5 shadow-elevation-1 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
          Client Information
        </h3>
        <Badge variant="verified" size="sm" icon="lock">
          ESCROW LOCKED
        </Badge>
      </div>

      <div className="flex items-center gap-3.5">
        <img
          src={customer.avatar}
          alt={customer.name}
          className="w-12 h-12 rounded-full object-cover border border-outline-variant shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm text-on-surface truncate">
              {customer.name}
            </h4>
            <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
              verified
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
            <span className="flex items-center text-amber-500 font-bold">
              ★ {customer.rating}
            </span>
            <span>•</span>
            <span>{customer.reviewCount} reviews</span>
            <span>•</span>
            <span>{customer.completedJobs} hires</span>
          </div>

          <p className="text-[11px] text-outline mt-0.5">{customer.joinedDate}</p>
        </div>
      </div>

      {/* Address / Location snippet */}
      <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/60 text-xs space-y-1">
        <div className="flex items-start gap-1.5 text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
            location_on
          </span>
          <span className="font-medium">{activeLead.address}</span>
        </div>
        <p className="text-[11px] text-outline pl-5">
          Access: {activeLead.jobScope.accessInstructions}
        </p>
      </div>

      {/* Quick Action Contact Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() =>
            addToast('Calling Client', `Connecting call to ${customer.name}...`, 'info')
          }
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-md text-xs font-semibold text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
            call
          </span>
          <span>Call Client</span>
        </button>

        <button
          onClick={() =>
            addToast('Secure Channel', 'Cooperative in-app chat is active.', 'info')
          }
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-md text-xs font-semibold text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">
            chat
          </span>
          <span>In-App Chat</span>
        </button>
      </div>
    </div>
  );
};
