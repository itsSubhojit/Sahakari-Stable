import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { SegmentedOtpModal } from '../../components/common/SegmentedOtpModal';
import { PasswordChecklist } from '../../components/common/PasswordChecklist';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { validateEmail, validatePassword } from '../../utils/validation';

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Segmented OTP Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const validatePhone10Digits = (phoneStr) => {
    const digitsOnly = String(phoneStr || '').replace(/[^0-9]/g, '');
    const tenDigits = digitsOnly.length === 12 && digitsOnly.startsWith('91') 
      ? digitsOnly.slice(2) 
      : digitsOnly;

    if (tenDigits.length !== 10) {
      return { valid: false, error: 'Mobile phone must be exactly 10 digits' };
    }
    return { valid: true, formatted: `+91 ${tenDigits}` };
  };

  // Step 1: Send 5-Min OTP to Email & Open Segmented OTP Modal
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    const emailVal = validateEmail(formData.email);
    if (!emailVal.valid) {
      setError(emailVal.error);
      return;
    }
    const passVal = validatePassword(formData.password);
    if (!passVal.valid) {
      setError(passVal.error);
      return;
    }

    const phoneVal = validatePhone10Digits(formData.phone);
    if (!phoneVal.valid) {
      setError(phoneVal.error);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const check = await api.checkUserExists(formData.email.trim());
      if (check.exists) {
        setError('An account with this email address already exists. Please Sign In instead.');
        setLoading(false);
        return;
      }

      await api.sendEmailOtp(formData.email.trim(), formData.name.trim(), 'Account Signup');
      setOtpError('');
      setIsOtpModalOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to send verification OTP to email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit Segmented OTP & Signup & Redirect to Dashboard
  const handleVerifyOtpAndSignup = async (otpCode) => {
    setOtpLoading(true);
    setOtpError('');

    try {
      await api.verifyEmailOtp(formData.email.trim(), otpCode);

      const phoneFormatted = `+91 ${formData.phone.replace(/[^0-9]/g, '').slice(-10)}`;
      const res = await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: phoneFormatted,
        password: formData.password,
        address: formData.address.trim(),
      });

      if (!res?.success) {
        setOtpError(res?.error || 'Failed to create account.');
      } else {
        setIsOtpModalOpen(false);
        navigate('/services'); // Redirect to dashboard!
      }
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.sendEmailOtp(formData.email.trim(), formData.name.trim(), 'Account Signup');
    } catch (err) {
      setOtpError(err.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-fixed shadow-md">
            <span className="material-symbols-outlined text-[32px]">person_add</span>
          </div>
          <h1 className="font-display-lg text-3xl font-bold text-primary">
            Join Sahakari
          </h1>
          <p className="text-body-md text-on-surface-variant text-sm">
            Create your customer profile with 6-digit email verification
          </p>
        </div>

        <Card variant="surface" padding="lg" className="shadow-md">
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Aaditya Dey"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              icon="person"
              required
              autoFocus
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. yourname@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setError('');
              }}
              icon="mail"
              required
            />

            <div>
              <label className="text-label-sm font-semibold text-on-surface-variant block mb-1">
                Mobile Phone Number <span className="text-error">*</span>
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface font-semibold text-xs flex-shrink-0">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) });
                    setError('');
                  }}
                  className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-label-sm font-semibold text-on-surface-variant block mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="e.g. @Admin123"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setError('');
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Password Validation Checklist matching user design mockup */}
              <PasswordChecklist password={formData.password} />
            </div>

            <Input
              label="Locality / Address"
              placeholder="e.g. 123 Safdarjung Enclave, New Delhi"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              icon="location_on"
            />

            {error && <p className="text-xs text-error font-semibold">{error}</p>}

            <Button
              type="submit"
              fullWidth
              variant="primary"
              size="lg"
              loading={loading}
              icon="mark_email_read"
              className="py-3 mt-2 font-bold"
            >
              Get 5-Min OTP on Email
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-outline-variant text-center">
            <p className="text-label-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {/* 6-DIGIT SEGMENTED OTP MODAL FOR SIGNUP */}
      <SegmentedOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        title="Verify Email to Complete Sign Up"
        subtitle="Enter the 6-digit OTP code sent to your email to activate account"
        targetInfo={formData.email.trim()}
        onVerify={handleVerifyOtpAndSignup}
        onResend={handleResendOtp}
        loading={otpLoading}
        error={otpError}
      />
    </div>
  );
};
