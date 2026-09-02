import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export const PasswordConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error = "",
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    onConfirm(password);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Password Confirmation" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-on-surface">
          <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0">
            lock_reset
          </span>
          <div>
            <p className="font-bold text-on-surface text-xs">Security Check Required</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              Please enter your account password to confirm identity before updating profile details.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-on-surface-variant block mb-1">
            Account Password <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary pr-10"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-error font-semibold bg-red-50 p-2 rounded-xl border border-red-200 text-center">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/60">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!password.trim()}
            icon="check_circle"
            className="flex-1 font-bold text-xs py-2.5"
          >
            Confirm & Save Profile
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
