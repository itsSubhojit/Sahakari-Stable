import React from 'react';
import { quickMessageCanned } from '../../data/mockLeads';
import { useNegotiation } from '../../context/NegotiationContext';

export const QuickMessageTemplates = () => {
  const { addToast } = useNegotiation();

  const copyTemplate = (text) => {
    navigator.clipboard?.writeText(text);
    addToast('Template Copied', 'Message copied to clipboard and ready to send.', 'info');
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 md:p-5 shadow-elevation-1 space-y-3">
      <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
        Quick Worker Message Canned Snippets
      </h3>

      <div className="space-y-1.5">
        {quickMessageCanned.map((msg, i) => (
          <button
            key={i}
            onClick={() => copyTemplate(msg)}
            className="w-full text-left p-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 rounded-lg text-xs text-on-surface transition-colors flex items-center justify-between group"
          >
            <span className="truncate pr-2 font-medium">"{msg}"</span>
            <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors flex-shrink-0">
              content_copy
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
