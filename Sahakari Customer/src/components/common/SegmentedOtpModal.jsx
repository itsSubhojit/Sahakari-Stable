import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export const SegmentedOtpModal = ({
  isOpen,
  onClose,
  title = "Security OTP Verification",
  subtitle = "Enter the 6-digit code sent to your device",
  targetInfo = "",
  onVerify,
  onResend,
  loading = false,
  error = "",
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // 5-Minute Timer (300 seconds)
  const [timer, setTimer] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimer(300);
      setIsTimerActive(true);
      setIsExpired(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerActive) {
      setIsTimerActive(false);
      setIsExpired(true);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    const char = value.slice(-1);
    if (char && !/^[0-9]$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullOtp = digits.join('');
    if (fullOtp.length !== 6) return;
    onVerify(fullOtp);
  };

  const handleRegenerate = () => {
    setDigits(['', '', '', '', '', '']);
    setTimer(300);
    setIsTimerActive(true);
    setIsExpired(false);
    if (onResend) onResend();
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  };

  const fullOtpString = digits.join('');
  const isComplete = fullOtpString.length === 6;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* Banner with Target Info and Timer */}
        <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-indigo-950 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-indigo-600 text-[22px] flex-shrink-0">
              mark_email_read
            </span>
            <div className="min-w-0">
              <p className="font-bold text-on-surface truncate">{subtitle}</p>
              {targetInfo && (
                <p className="text-[11px] text-indigo-700 font-semibold truncate mt-0.5">
                  To: <strong>{targetInfo}</strong>
                </p>
              )}
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-xl font-mono font-bold text-xs flex items-center gap-1 flex-shrink-0 ${
            isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
          }`}>
            <span className="material-symbols-outlined text-[15px]">
              {isExpired ? 'timer_off' : 'timer'}
            </span>
            <span>{isExpired ? 'EXPIRED' : formatTimer(timer)}</span>
          </div>
        </div>

        {/* Expired Warning or 6-Digit Segmented Box */}
        {isExpired ? (
          <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded-2xl text-xs flex items-center justify-between font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[20px]">error</span>
              <span>OTP expired after 5 minutes.</span>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              🔄 Regenerate OTP
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block text-center">
              Enter 6-Digit Verification Code
            </label>

            {/* Segmented 6 Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-2">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none ${
                    digit
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-outline-variant/80 bg-surface-container-low text-on-surface focus:border-primary focus:bg-surface'
                  }`}
                />
              ))}
            </div>

            <p className="text-[11px] text-center text-on-surface-variant">
              Type or paste the 6-digit code sent to your email
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-error font-semibold text-center bg-red-50 py-1.5 px-3 rounded-xl border border-red-200">
            {error}
          </p>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/60">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!isComplete || isExpired}
            icon="check_circle"
            className="flex-1 font-bold text-xs py-2.5"
          >
            Verify & Save Changes
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="text-xs py-2.5 px-4"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
