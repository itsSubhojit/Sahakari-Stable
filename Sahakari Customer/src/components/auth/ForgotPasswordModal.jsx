import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { SegmentedOtpModal } from '../common/SegmentedOtpModal';
import { PasswordChecklist } from '../common/PasswordChecklist';
import { validateEmail, validatePassword } from '../../utils/validation';
import { api } from '../../services/api';
import { auth } from '../../services/firebase';
import { updatePassword } from 'firebase/auth';

export const ForgotPasswordModal = ({
  isOpen,
  onClose,
  onBackToLogin,
  onResetSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Modal state for password reset verification
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsOtpModalOpen(false);
    }
  }, [isOpen]);

  const isMatch = password.length > 0 && password === confirmPassword;

  // STEP 1: Handle Submit Reset Password Request -> Checks if Account Exists & Sends OTP to Email
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setErrorMsg(emailVal.error);
      return;
    }

    const passVal = validatePassword(password);
    if (!passVal.valid) {
      setErrorMsg(passVal.error);
      return;
    }

    if (!isMatch) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user account exists in database / auth
      const check = await api.checkUserExists(email.trim());
      if (!check.exists) {
        setErrorMsg('No account found with this email address. Please Sign Up first.');
        setLoading(false);
        return;
      }

      // 2. Send 6-digit OTP to user's email for password reset
      await api.sendEmailOtp(email.trim(), '', 'Account Password Reset');
      setOtpError('');
      setIsOtpModalOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP to email.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-Digit Segmented OTP & Complete Password Reset
  const handleVerifyOtpAndReset = async (otpCode) => {
    setOtpLoading(true);
    setOtpError('');

    try {
      // 1. Verify OTP with Backend
      await api.verifyEmailOtp(email.trim(), otpCode);

      // 2. Call backend password reset endpoint (updates Firebase Admin Auth, Firestore, and sends Security Notification Email)
      await api.resetPassword(email.trim(), password);

      // 3. If client Firebase auth has active user, update client auth password as well
      if (auth.currentUser && auth.currentUser.email === email.trim().toLowerCase()) {
        try {
          await updatePassword(auth.currentUser, password);
        } catch (authErr) {
          console.warn('Client updatePassword notice:', authErr.message);
        }
      }

      setIsOtpModalOpen(false);
      if (onResetSuccess) {
        onResetSuccess(`Password reset successfully for ${email.trim()}! Security alert sent.`);
      }
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.sendEmailOtp(email.trim(), '', 'Account Password Reset');
    } catch (err) {
      setOtpError(err.message || 'Failed to resend OTP.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
        <form onSubmit={handleSubmitRequest} className="space-y-4 py-1 text-center">
          {/* Design Icon Header Box */}
          <div className="w-12 h-12 rounded-2xl border border-outline-variant/80 bg-surface-container-high mx-auto flex items-center justify-center text-primary shadow-xs">
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-on-surface">
              Set new password
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto">
              Your new password must be different to previously used passwords.
            </p>
          </div>

          <div className="space-y-3 text-left pt-2">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg('');
              }}
              icon="mail"
              required
              autoFocus
            />

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="e.g. @Admin123"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary pr-10"
                  required
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

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="e.g. @Admin123"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <PasswordChecklist password={password} />
          </div>

          {errorMsg && (
            <p className="text-xs text-error font-semibold bg-red-50 py-1.5 px-3 rounded-xl border border-red-200 text-left">
              {errorMsg}
            </p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              fullWidth
              variant="primary"
              size="md"
              loading={loading}
              className="py-3 font-bold text-xs bg-primary hover:bg-primary/90"
            >
              Reset password
            </Button>
          </div>

          <div className="pt-2 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-on-surface-variant hover:text-primary font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Back to log in
            </button>
          </div>
        </form>
      </Modal>

      {/* 6-DIGIT SEGMENTED OTP MODAL FOR PASSWORD RESET */}
      <SegmentedOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        title="Reset Password Verification"
        subtitle="Enter the 6-digit OTP code sent to your email to confirm password reset"
        targetInfo={email.trim()}
        onVerify={handleVerifyOtpAndReset}
        onResend={handleResendOtp}
        loading={otpLoading}
        error={otpError}
      />
    </>
  );
};
