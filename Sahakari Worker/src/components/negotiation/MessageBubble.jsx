import React from 'react';
import { Badge } from '../common/Badge';

export const MessageBubble = ({ message, isLatestPending }) => {
  const isWorker = message.sender === 'WORKER';

  return (
    <div
      className={`w-full flex flex-col ${
        isWorker ? 'items-end' : 'items-start'
      } transition-all duration-200`}
    >
      {/* Sender & Timestamp Label */}
      <div
        className={`flex items-center gap-2 mb-1 px-1 text-[10px] font-bold tracking-wider uppercase ${
          message.sentByAi
            ? 'text-primary dark:text-primary-fixed'
            : isWorker
            ? 'text-primary dark:text-primary-fixed'
            : 'text-on-surface-variant'
        }`}
      >
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">
            {message.sentByAi ? 'smart_toy' : isWorker ? 'person' : 'person_pin'}
          </span>
          {message.sentByAi ? message.senderName : isWorker ? 'YOU' : message.senderName || 'CUSTOMER'}
        </span>
        <span className="text-outline font-normal">• {message.time}</span>
      </div>

      {/* Message Card Container */}
      <div
        className={`
          relative w-full max-w-[90%] sm:max-w-[82%] md:max-w-[78%] rounded-lg p-2.5 md:p-3 transition-all
          ${
            message.isPending || isLatestPending
              ? 'bg-surface border-2 border-secondary shadow-elevation-2'
              : message.sentByAi
              ? 'bg-primary/5 dark:bg-primary-container/10 border border-primary/40 shadow-elevation-1'
              : isWorker
              ? 'bg-surface-container-low border border-primary-fixed-dim shadow-elevation-1'
              : 'bg-surface border border-outline-variant shadow-elevation-1'
          }
        `}
      >
        {/* Clean Pending Offer Tag Header without collision */}
        {(message.isPending || isLatestPending) && (
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-secondary/30">
            <Badge variant="pending" size="sm" icon="pending_actions">
              PENDING OFFER
            </Badge>
            <span className="text-[10px] font-semibold text-secondary">
              Awaiting response
            </span>
          </div>
        )}

        {/* Message Text */}
        <p className="text-xs text-on-surface leading-snug mb-2">
          {message.text}
        </p>

        {/* Selected Terms (if any) */}
        {message.terms && Object.keys(message.terms).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {message.terms.partsIncluded && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container text-[11px] font-semibold text-on-surface rounded">
                <span className="material-symbols-outlined text-[13px] text-primary">
                  check
                </span>
                Parts Included
              </span>
            )}
            {message.terms.warranty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container text-[11px] font-semibold text-on-surface rounded">
                <span className="material-symbols-outlined text-[13px] text-secondary">
                  verified
                </span>
                90-Day Warranty
              </span>
            )}
            {message.terms.priorityArrival && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container text-[11px] font-semibold text-on-surface rounded">
                <span className="material-symbols-outlined text-[13px] text-error">
                  bolt
                </span>
                Priority 25m Arrival
              </span>
            )}
          </div>
        )}

        {/* Price Display */}
        {message.amount && (
          <div
            className={`flex items-baseline justify-between pt-1.5 border-t ${
              message.isPending
                ? 'border-secondary/20'
                : 'border-outline-variant/60'
            }`}
          >
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              {message.type === 'OFFER'
                ? 'Initial Request'
                : message.type === 'ACCEPT'
                ? 'Agreed Deal'
                : isWorker
                ? 'Your Counter'
                : 'Counter Offer'}
            </span>

            <div
              className={`font-mono text-lg font-bold tracking-tight ${
                isWorker
                  ? 'text-primary dark:text-primary-fixed'
                  : message.isPending
                  ? 'text-secondary'
                  : 'text-on-surface'
              }`}
            >
              ${message.amount.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
