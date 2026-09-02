import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const QuickContactModal = ({
  isOpen,
  onClose,
  type = 'call', // 'call' or 'chat'
  worker,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'worker',
      text: 'Namaste! I am on my way to your location with the required tools.',
      time: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const workerPhone = worker?.phone || '+91 98112 34567';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(workerPhone.replace(/\s+/g, ''));
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'customer',
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Auto-respond worker after 1.5s
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'worker',
          text: 'Got it! Reaching your street in a few minutes.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  const sendPreset = (presetText) => {
    setInputMessage(presetText);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'call' ? 'Service Provider Contact' : 'Quick Message to Worker'}
      maxWidth="max-w-md"
    >
      {type === 'call' ? (
        /* Phone Number Details View (No simulated in-app call) */
        <div className="py-2 space-y-4">
          {/* Worker Info */}
          <div className="flex items-center gap-3.5 bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/60">
            <div className="relative">
              <img
                src={
                  worker?.avatar ||
                  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400'
                }
                alt={worker?.name || 'Worker'}
                className="w-14 h-14 rounded-full object-cover border-2 border-primary"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mt-1">
                <h3 className="text-base font-bold text-on-surface truncate">
                  {worker?.name || 'Rajesh Kumar'}
                </h3>
                <span className="font-bold text-secondary text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                  ★ {worker?.rating || 4.8}
                </span>
              </div>
            </div>
          </div>

          {/* Provider Mobile Number Display Card */}
          <div className="bg-gradient-to-br from-primary/5 via-surface to-secondary/5 border-2 border-primary/30 rounded-2xl p-4 space-y-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block">
              Service Provider Mobile Number
            </span>

            <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-outline-variant shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <span className="font-mono text-lg sm:text-xl font-black text-primary tracking-wider">
                  {workerPhone}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyPhone}
                title="Copy Number"
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedPhone ? 'check' : 'content_copy'}
                </span>
                {copiedPhone ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="text-[11px] text-on-surface-variant">
              You can contact <strong>{worker?.name || 'the service provider'}</strong> for landmark directions, building entry codes, or arrival timing.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <a
              href={`tel:${workerPhone.replace(/\s+/g, '')}`}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">dialer_sip</span>
              Open Phone Dialer
            </a>

            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="px-4"
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        /* In-App Quick Messaging View */
        <div className="space-y-4">
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-outline-variant/60">
            {[
              'I am waiting at Gate 2',
              'Please call when downstairs',
              'Bring spare 16A switch',
              'Lift is working',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendPreset(preset)}
                className="text-[11px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full border border-outline-variant/60 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {chatMessages.map((msg) => {
              const isMe = msg.sender === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[85%] text-xs ${
                      isMe
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/50'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-0.5">
                    {msg.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input box */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type message to worker..."
              className="flex-1 bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            <Button type="submit" variant="primary" size="sm" icon="send">
              Send
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
};

