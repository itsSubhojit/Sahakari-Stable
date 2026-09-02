import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

export const NegotiationChat = ({
  messages = [],
  onSendCounter,
  onOpenOfferModal,
  isSending = false,
  compact = false,
}) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (onSendCounter) {
      // If user typed a number like 1200 or message
      const numberMatch = inputText.match(/\d+/);
      const parsedAmount = numberMatch ? parseInt(numberMatch[0], 10) : null;
      onSendCounter(parsedAmount || 1200, inputText);
    }
    setInputText('');
  };

  return (
    <Card
      variant="surface"
      padding="none"
      className="flex flex-col h-full overflow-hidden shadow-sm"
    >
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            chat
          </span>
          <h4 className="font-label-md text-on-surface-variant font-bold uppercase tracking-wider">
            Negotiation Room
          </h4>
        </div>
        <span className="text-[11px] bg-primary-fixed text-on-primary-fixed font-bold px-2 py-0.5 rounded-full">
          Live
        </span>
      </div>

      {/* Messages stream */}
      <div
        className={`p-4 space-y-4 overflow-y-auto ${
          compact ? 'max-h-[260px]' : 'min-h-[300px] max-h-[420px]'
        }`}
      >
        {messages.map((msg) => {
          const isCustomer = msg.sender === 'customer';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isCustomer ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3 rounded-xl max-w-[85%] text-body-md shadow-xs ${
                  isCustomer
                    ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                    : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/50'
                }`}
              >
                {msg.amount && (
                  <div
                    className={`text-label-sm font-bold mb-1 px-2 py-0.5 rounded inline-block ${
                      isCustomer
                        ? 'bg-primary/40 text-primary-fixed'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {msg.type === 'offer'
                      ? `Proposed Offer: ${formatCurrency(msg.amount)}`
                      : msg.type === 'accepted'
                      ? `Deal Accepted: ${formatCurrency(msg.amount)}`
                      : `Counter Offer: ${formatCurrency(msg.amount)}`}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              <span className="text-label-sm text-on-surface-variant mt-1 text-[11px]">
                {msg.senderName || (isCustomer ? 'You' : 'Worker')} • {msg.time}
              </span>
            </div>
          );
        })}

        {isSending && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="bg-surface-container-high text-on-surface p-3 rounded-xl rounded-tl-none text-body-md flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-label-sm text-on-surface-variant">
                Worker is reviewing your offer...
              </span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input controls */}
      <div className="p-3 border-t border-outline-variant bg-surface-container-low space-y-2">
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or price (e.g. ₹1200)..."
            className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            icon="send"
            disabled={!inputText.trim()}
          />
        </form>

        <Button
          fullWidth
          variant="primary-container"
          onClick={onOpenOfferModal}
          icon="payments"
          className="text-label-md py-2.5"
        >
          Make Counter Offer
        </Button>
      </div>
    </Card>
  );
};

