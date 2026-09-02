import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const { signIn, authError, setAuthError } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !pin.trim()) {
      setAuthError('Please enter your phone number and PIN.');
      return;
    }
    setIsLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    signIn(phone, pin);
    setIsLoading(false);
  };

  const fillDemo = () => {
    setPhone('9876543210');
    setPin('1234');
    setAuthError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-[36px] text-on-primary">handshake</span>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Sahakari</h1>
          <p className="text-sm text-on-surface-variant mt-1">Worker Hub · Cooperative Network</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-elevation-3 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-on-surface">Sign in to your account</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Enter your registered mobile number and PIN</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="flex items-center gap-2 border border-outline-variant rounded-xl bg-surface-container-lowest px-3 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-outline flex-shrink-0">phone</span>
                <span className="text-xs text-outline flex-shrink-0 pr-1 border-r border-outline-variant/60">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setAuthError(''); }}
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 h-11 bg-transparent text-sm text-on-surface placeholder:text-outline/60 focus:outline-none pl-2"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* PIN Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Worker PIN
              </label>
              <div className="flex items-center gap-2 border border-outline-variant rounded-xl bg-surface-container-lowest px-3 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-outline flex-shrink-0">lock</span>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setAuthError(''); }}
                  placeholder="••••"
                  maxLength={6}
                  className="flex-1 h-11 bg-transparent text-sm text-on-surface placeholder:text-outline/60 focus:outline-none tracking-widest"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPin ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="flex items-center gap-2 bg-error-container/40 border border-error/30 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-[16px] text-error flex-shrink-0">error</span>
                <p className="text-xs text-on-error-container font-medium">{authError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="pt-2 border-t border-outline-variant">
            <p className="text-[10px] text-outline text-center mb-2">Demo credentials for testing</p>
            <button
              onClick={fillDemo}
              className="w-full py-2 border border-dashed border-primary/40 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
              Use Demo: Suresh Patel (PIN: 1234)
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[10px] text-outline mt-5">
          Sahakari Cooperative Worker Platform · Encrypted & Secure
        </p>
      </div>
    </div>
  );
};
