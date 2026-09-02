import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validation';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Forgot Password Modal State
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setError(emailVal.error);
      return;
    }
    const passVal = validatePassword(password);
    if (!passVal.valid) {
      setError(passVal.error);
      return;
    }

    setError('');
    setLoading(true);

    const check = await api.checkUserExists(email.trim());
    if (!check.exists) {
      setError('No account found with this email address. Please Sign Up first.');
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    setLoading(false);

    if (result?.success) {
      navigate('/services');
    } else {
      setError(result?.error || 'Invalid credentials.');
    }
  };

  const handleQuickDemoLogin = () => {
    login('customer@sahakari.in', 'Password123');
    navigate('/services');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-md overflow-hidden border border-[#0D3A2A]/10 bg-[#0D3A2A]">
            <img src="/favicon.svg" alt="Sahakari logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display-lg text-3xl font-bold text-primary">
            Sahakari
          </h1>
          <p className="text-body-md text-on-surface-variant text-sm">
            Fair Pricing • Direct Bargaining • Verified Doorstep Pros
          </p>
        </div>

        <Card variant="surface" padding="lg" className="shadow-md">
          {resetSuccessMsg && (
            <div className="mb-4 bg-indigo-50 border border-indigo-300 text-indigo-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-indigo-600">
                check_circle
              </span>
              <span>{resetSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. yourname@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              icon="mail"
              required
              autoFocus
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-label-md font-medium text-on-surface-variant block">
                  Password
                </label>

                {/* DEDICATED FORGOT PASSWORD LINK */}
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordModalOpen(true)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary pr-10"
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

            {error && <p className="text-xs text-error font-semibold">{error}</p>}

            <Button
              type="submit"
              fullWidth
              variant="primary"
              size="lg"
              loading={loading}
              className="py-3 mt-2 font-bold text-xs"
            >
              Sign In to Sahakari
            </Button>
          </form>

          {/* Demo 1-Click Login Option */}
          <div className="mt-6 pt-4 border-t border-outline-variant text-center space-y-3">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full bg-primary-fixed text-on-primary-fixed py-2.5 px-4 rounded-lg font-semibold text-label-md hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              1-Click Demo Login (Evaluator mode)
            </button>

            <p className="text-label-sm text-on-surface-variant">
              Don't have an account?{' '}
              <Link to="/signup" className="text-secondary font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {/* DEDICATED FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onBackToLogin={() => setIsForgotPasswordModalOpen(false)}
        onResetSuccess={(msg) => {
          setIsForgotPasswordModalOpen(false);
          setResetSuccessMsg(msg);
          setTimeout(() => setResetSuccessMsg(''), 5000);
        }}
      />
    </div>
  );
};
