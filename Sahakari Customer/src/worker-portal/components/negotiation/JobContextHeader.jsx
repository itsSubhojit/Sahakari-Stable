import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { Badge } from '../common/Badge';

export const JobContextHeader = ({ onOpenPhotos }) => {
  const { activeLead } = useNegotiation();

  return (
    <div className="bg-surface border-b border-outline-variant p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary dark:text-primary-fixed flex-shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[22px]">
            {activeLead.categoryIcon || 'build'}
          </span>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-base md:text-lg text-on-surface leading-snug">
              {activeLead.title}
            </h2>
            <Badge variant="verified" size="sm" icon="verified">
              VERIFIED
            </Badge>
            {activeLead.urgency === 'EMERGENCY' && (
              <Badge variant="emergency" size="sm" icon="e911_emergency">
                EMERGENCY
              </Badge>
            )}
            {activeLead.acceptedByWorker ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                activeLead.aiMode === 'AUTOPILOT'
                  ? 'bg-primary-container text-on-primary-container border border-primary/20'
                  : 'bg-secondary/15 text-secondary border border-secondary/20'
              }`}>
                <span className="material-symbols-outlined text-[12px] animate-pulse">smart_toy</span>
                AI {activeLead.aiMode === 'AUTOPILOT' ? 'Autopilot' : 'Co-pilot'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px] animate-pulse">broadcast_on_personal</span>
                Broadcast Bid
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-on-surface-variant">
            <span className="font-mono font-semibold text-primary dark:text-primary-fixed">
              {activeLead.id}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px]">near_me</span>
              {activeLead.distance}
            </span>
            <span>•</span>
            <span className="truncate max-w-[200px] md:max-w-none text-outline">
              {activeLead.address}
            </span>
          </div>
        </div>
      </div>

      {/* Quick context tools */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {activeLead.jobScope.photos.length > 0 && (
          <button
            onClick={onOpenPhotos}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-md text-xs font-semibold text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              photo_camera
            </span>
            <span>{activeLead.jobScope.photos.length} Site Photo</span>
          </button>
        )}

        <button
          onClick={() => alert(`Directions loaded for: ${activeLead.address}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-md text-xs font-semibold text-on-surface transition-colors"
          title="Open Map Navigation"
        >
          <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
            directions
          </span>
          <span className="hidden md:inline">Route</span>
        </button>
      </div>
    </div>
  );
};
