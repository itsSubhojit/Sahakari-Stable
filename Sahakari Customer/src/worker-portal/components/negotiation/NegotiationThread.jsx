import React, { useEffect, useRef } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { MessageBubble } from './MessageBubble';

export const NegotiationThread = () => {
  const { activeLead } = useNegotiation();
  const threadEndRef = useRef(null);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeLead.thread]);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-background">
      {/* Starting negotiation header prompt */}
      <div className="flex items-center justify-center my-2">
        <div className="bg-surface-container border border-outline-variant px-3 py-1 rounded-full text-[11px] font-semibold text-outline">
          Live Cooperative Negotiation Thread Initiated • Encrypted & Logged
        </div>
      </div>

      {/* Message List */}
      {activeLead.thread.map((msg, idx) => {
        const isLatestPending =
          msg.isPending ||
          (idx === activeLead.thread.length - 1 &&
            activeLead.status === 'YOUR_TURN' &&
            msg.sender === 'CUSTOMER');

        return (
          <MessageBubble
            key={msg.id || idx}
            message={msg}
            isLatestPending={isLatestPending}
          />
        );
      })}

      <div ref={threadEndRef} />
    </div>
  );
};
