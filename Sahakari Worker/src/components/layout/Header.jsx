import React, { useState } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const Header = ({ onToggleMobileMenu, setActiveNav }) => {
  const {
    workerProfile,
    workerStatus,
    setWorkerStatus,
    darkMode,
    setDarkMode,
    leads,
    setIsCoopDetailsOpen,
  } = useNegotiation();
  const {
    signIn,
    signOut,
    isAuthenticated,
    currentUser,
    authError,
    setAuthError,
    initiateSignUp,
    verifyOtpAndRegister,
    cancelSignUp,
    pendingSignUp,
    otpToastMsg,
  } = useAuth();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Register State
  const [authTab, setAuthTab] = useState('signin'); // 'signin' or 'signup'
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const activeLeadsCount = leads.filter(
    (l) => l.status === 'YOUR_TURN' || l.status === 'CUSTOMER_TURN'
  ).length;

  return (
    <header className="bg-surface-container-highest dark:bg-surface-container-highest w-full sticky top-0 border-b border-outline-variant dark:border-outline-variant z-40 px-4 md:px-6 h-14 md:h-16 flex items-center justify-between shadow-sm">
      {/* Left branding & mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-surface-container text-primary dark:text-primary-fixed"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary flex items-center justify-center text-primary-fixed shadow-sm">
            <span className="material-symbols-outlined text-[22px]">handshake</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg md:text-xl text-primary dark:text-primary-fixed tracking-tight leading-none">
                Sahakari
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-primary-container text-on-primary-container rounded">
                Worker Hub
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-on-surface-variant font-medium leading-none mt-0.5">
              Cooperative Service Network
            </p>
          </div>
        </div>
      </div>

      {/* Middle worker status switcher */}
      <div className="hidden sm:flex items-center bg-surface-container-low border border-outline-variant rounded-full p-1 gap-1">
        <button
          onClick={() => setWorkerStatus('ONLINE')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            workerStatus === 'ONLINE'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Online & Accepting</span>
        </button>
        <button
          onClick={() => setWorkerStatus('BUSY')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            workerStatus === 'BUSY'
              ? 'bg-secondary text-on-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>On Job / Busy</span>
        </button>
      </div>

      {/* Right Action Icons & Profile Card */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Cooperative Fund quick view */}
        <button
          onClick={() => setIsCoopDetailsOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary-fixed/30 hover:bg-primary-fixed/50 border border-primary-fixed-dim rounded-lg text-xs font-semibold text-primary dark:text-primary-fixed transition-colors"
          title="Sahakari Cooperative Dividend Pool"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">
            account_balance
          </span>
          <span>Coop Share: <strong className="font-bold text-on-surface">{workerProfile.sharesValue}</strong></span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-on-surface transition-colors"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined text-[20px]">
            {darkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileDropdownOpen(false);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-on-surface transition-colors relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {activeLeadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeLeadsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-elevation-3 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">notifications_active</span>
                  Notifications
                </span>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-container text-outline"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Notification Items */}
              <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/50">
                {leads.length === 0 && (
                  <div className="p-4 text-center text-xs text-outline">
                    No new notifications
                  </div>
                )}
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      lead.status === 'YOUR_TURN' ? 'bg-secondary/15' :
                      lead.acceptedByWorker ? 'bg-primary/10' : 'bg-amber-500/10'
                    }`}>
                      <span className={`material-symbols-outlined text-[16px] ${
                        lead.status === 'YOUR_TURN' ? 'text-secondary' :
                        lead.acceptedByWorker ? 'text-primary' : 'text-amber-500'
                      }`}>
                        {lead.status === 'YOUR_TURN' ? 'reply' :
                         lead.acceptedByWorker ? 'smart_toy' : 'broadcast_on_personal'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">{lead.title}</p>
                      <p className="text-[10px] text-outline mt-0.5">
                        {lead.status === 'YOUR_TURN' ? '⚡ Your turn to respond' :
                         lead.status === 'CUSTOMER_TURN' ? '⏳ Waiting for customer' :
                         lead.acceptedByWorker ? '🤖 AI negotiating' : '📡 Broadcast bid available'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-primary flex-shrink-0">
                      ${lead.financials.currentPendingOffer.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-outline-variant bg-surface-container-low">
                <p className="text-[10px] text-outline text-center">
                  {activeLeadsCount} lead{activeLeadsCount !== 1 ? 's' : ''} require your attention
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Worker Profile Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileDropdownOpen(!isProfileDropdownOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 bg-surface hover:bg-surface-container border border-outline-variant rounded-full transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-on-surface leading-tight">
                {isAuthenticated ? currentUser?.name : 'Guest'}
              </div>
              <div className="text-[10px] text-on-surface-variant flex items-center justify-end gap-1 font-medium">
                {isAuthenticated
                  ? <><span className="text-amber-500 font-bold">★ {workerProfile.rating}</span><span>• {workerProfile.tier.split(' ')[0]}</span></>
                  : <span className="text-primary font-semibold">Sign In / Register</span>
                }
              </div>
            </div>
            {isAuthenticated ? (
              <img src={workerProfile.avatar} alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover border border-primary/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-outline">person</span>
              </div>
            )}
          </button>

          {/* ── Auth / Profile Popup ── */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-elevation-3 z-50 overflow-hidden">

              {/* ── SIGNED OUT ── */}
              {!isAuthenticated && !pendingSignUp && (
                <div className="p-4 space-y-3">
                  {/* Brand header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-on-primary">handshake</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Sahakari Worker Hub</p>
                        <p className="text-[10px] text-outline">Cooperative Network</p>
                      </div>
                    </div>
                    <button onClick={() => { setIsProfileDropdownOpen(false); setAuthError(''); }} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-surface-container-low rounded-lg p-0.5 gap-0.5">
                    <button
                      onClick={() => { setAuthTab('signin'); setAuthError(''); }}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all ${authTab === 'signin' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >Sign In</button>
                    <button
                      onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all ${authTab === 'signup' ? 'bg-secondary text-on-secondary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >Sign Up</button>
                  </div>

                  {/* ── SIGN IN FORM ── */}
                  {authTab === 'signin' && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const ok = signIn(loginPhone, loginPin);
                      if (ok) { setIsProfileDropdownOpen(false); setLoginPhone(''); setLoginPin(''); }
                    }} className="space-y-2.5">
                      <div className="flex items-center gap-2 border border-outline-variant rounded-lg bg-surface-container-lowest px-2.5 focus-within:border-primary transition-colors">
                        <span className="material-symbols-outlined text-[15px] text-outline flex-shrink-0">badge</span>
                        <input type="text" value={loginPhone}
                          onChange={(e) => { setLoginPhone(e.target.value); setAuthError(''); }}
                          placeholder="Worker ID (e.g. WRK-8821)"
                          className="flex-1 h-8 bg-transparent text-xs text-on-surface placeholder:text-outline/50 focus:outline-none pl-1" />
                      </div>
                      <div className="flex items-center gap-2 border border-outline-variant rounded-lg bg-surface-container-lowest px-2.5 focus-within:border-primary transition-colors">
                        <span className="material-symbols-outlined text-[15px] text-outline flex-shrink-0">lock</span>
                        <input type={showPin ? 'text' : 'password'} value={loginPin}
                          onChange={(e) => { setLoginPin(e.target.value); setAuthError(''); }}
                          placeholder="Password"
                          className="flex-1 h-8 bg-transparent text-xs text-on-surface placeholder:text-outline/50 focus:outline-none tracking-widest pl-1" />
                        <button type="button" onClick={() => setShowPin(!showPin)} className="text-outline hover:text-on-surface flex-shrink-0">
                          <span className="material-symbols-outlined text-[15px]">{showPin ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      {authError && <p className="text-[10px] text-error flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">error</span>{authError}</p>}
                      <button type="submit" className="w-full h-8 bg-primary text-on-primary font-bold text-xs rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">login</span>Sign In
                      </button>
                      <button type="button" onClick={() => { setLoginPhone('WRK-8821'); setLoginPin('1234'); setAuthError(''); }}
                        className="w-full py-1.5 border border-dashed border-primary/40 rounded-lg text-[10px] font-semibold text-primary hover:bg-primary/5 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>Demo: WRK-8821 · Pass: 1234
                      </button>
                    </form>
                  )}

                  {/* ── SIGN UP FORM ── */}
                  {authTab === 'signup' && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      initiateSignUp(signupName, signupEmail, signupPassword);
                    }} className="space-y-2.5">
                      <div className="flex items-center gap-2 border border-outline-variant rounded-lg bg-surface-container-lowest px-2.5 focus-within:border-secondary transition-colors">
                        <span className="material-symbols-outlined text-[15px] text-outline flex-shrink-0">badge</span>
                        <input type="text" value={signupName}
                          onChange={(e) => { setSignupName(e.target.value); setAuthError(''); }}
                          placeholder="Full name"
                          className="flex-1 h-8 bg-transparent text-xs text-on-surface placeholder:text-outline/50 focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2 border border-outline-variant rounded-lg bg-surface-container-lowest px-2.5 focus-within:border-secondary transition-colors">
                        <span className="material-symbols-outlined text-[15px] text-outline flex-shrink-0">email</span>
                        <input type="email" value={signupEmail}
                          onChange={(e) => { setSignupEmail(e.target.value); setAuthError(''); }}
                          placeholder="Email address (OTP will be sent)"
                          className="flex-1 h-8 bg-transparent text-xs text-on-surface placeholder:text-outline/50 focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2 border border-outline-variant rounded-lg bg-surface-container-lowest px-2.5 focus-within:border-secondary transition-colors">
                        <span className="material-symbols-outlined text-[15px] text-outline flex-shrink-0">lock</span>
                        <input type={showSignupPass ? 'text' : 'password'} value={signupPassword}
                          onChange={(e) => { setSignupPassword(e.target.value); setAuthError(''); }}
                          placeholder="Create password (min 6 chars)"
                          className="flex-1 h-8 bg-transparent text-xs text-on-surface placeholder:text-outline/50 focus:outline-none" />
                        <button type="button" onClick={() => setShowSignupPass(!showSignupPass)} className="text-outline hover:text-on-surface flex-shrink-0">
                          <span className="material-symbols-outlined text-[15px]">{showSignupPass ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      {authError && <p className="text-[10px] text-error flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">error</span>{authError}</p>}
                      <button type="submit" className="w-full h-8 bg-secondary text-on-secondary font-bold text-xs rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">mark_email_read</span>Send OTP to Email
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ── OTP VERIFICATION STEP ── */}
              {!isAuthenticated && pendingSignUp && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-secondary">mark_email_read</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Verify Your Email</p>
                        <p className="text-[10px] text-outline truncate max-w-[160px]">{pendingSignUp.email}</p>
                      </div>
                    </div>
                    <button onClick={() => { cancelSignUp(); setAuthError(''); }} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    </button>
                  </div>

                  {/* Simulated OTP reveal box */}
                  {otpToastMsg && (
                    <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-2.5 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">sms</span>
                      <div>
                        <p className="text-[10px] font-bold text-secondary">Simulated Email Delivery</p>
                        <p className="text-[10px] text-on-surface mt-0.5">{otpToastMsg}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const ok = verifyOtpAndRegister(otpInput);
                    if (ok) { setIsProfileDropdownOpen(false); setOtpInput(''); setSignupName(''); setSignupEmail(''); setSignupPassword(''); }
                  }} className="space-y-2.5">
                    <p className="text-[11px] text-on-surface-variant">Enter the 6-digit OTP sent to your email:</p>
                    <div className="flex items-center gap-2 border border-outline-variant rounded-lg bg-surface-container-lowest px-2.5 focus-within:border-secondary transition-colors">
                      <span className="material-symbols-outlined text-[15px] text-outline flex-shrink-0">pin</span>
                      <input type="text" value={otpInput}
                        onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, '')); setAuthError(''); }}
                        placeholder="6-digit OTP"
                        maxLength={6}
                        className="flex-1 h-8 bg-transparent text-sm font-mono font-bold text-on-surface placeholder:text-outline/50 focus:outline-none tracking-widest" />
                    </div>
                    {authError && <p className="text-[10px] text-error flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">error</span>{authError}</p>}
                    <button type="submit" className="w-full h-8 bg-secondary text-on-secondary font-bold text-xs rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">verified</span>Verify & Create Account
                    </button>
                    <button type="button" onClick={() => initiateSignUp(pendingSignUp.name, pendingSignUp.email, pendingSignUp.password)}
                      className="w-full py-1 text-[10px] font-semibold text-outline hover:text-on-surface flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">refresh</span>Resend OTP
                    </button>
                  </form>
                </div>
              )}

              {/* ── SIGNED IN: Profile Card ── */}
              {isAuthenticated && (
                <>
                  <div
                    onClick={() => {
                      if (setActiveNav) {
                        setActiveNav('profile');
                        setIsProfileDropdownOpen(false);
                      }
                    }}
                    className="flex items-center gap-3 p-3 border-b border-outline-variant cursor-pointer hover:bg-surface-container transition-colors"
                  >
                    {workerProfile.avatar ? (
                      <img src={workerProfile.avatar} alt={currentUser?.name || workerProfile.name}
                        className="w-12 h-12 rounded-full object-cover border border-primary flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[26px] text-primary">person</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate">{currentUser?.name || workerProfile.name}</h4>
                      <p className="text-xs text-on-surface-variant truncate">{workerProfile.role || currentUser?.role || 'Cooperative Worker'}</p>
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        <span className="inline-block px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed text-[9px] font-bold rounded">
                          {currentUser?.workerId || workerProfile.workerId || 'WRK-8821'}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 bg-secondary-container text-on-secondary-container text-[9px] font-bold rounded">
                          {currentUser?.coopId || workerProfile.coopId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="py-2 space-y-0.5 text-xs px-1">
                    <div className="flex justify-between py-1 px-2 rounded hover:bg-surface-container">
                      <span className="text-on-surface-variant">Today's Payout</span>
                      <span className="font-bold text-primary font-mono">${workerProfile.todayEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 px-2 rounded hover:bg-surface-container">
                      <span className="text-on-surface-variant">Acceptance Rate</span>
                      <span className="font-bold text-on-surface">{workerProfile.acceptanceRate}</span>
                    </div>
                    <div className="flex justify-between py-1 px-2 rounded hover:bg-surface-container">
                      <span className="text-on-surface-variant">Cooperative Shares</span>
                      <span className="font-bold text-secondary">{workerProfile.sharesHeld} units</span>
                    </div>
                  </div>
                  <div className="p-2 border-t border-outline-variant flex flex-col gap-1">
                    <button onClick={() => { setIsProfileDropdownOpen(false); if (setActiveNav) setActiveNav('profile'); }}
                      className="w-full text-left text-xs font-semibold px-2 py-1.5 rounded text-primary hover:bg-primary-fixed/20 flex items-center justify-between">
                      <span>View & Edit My Profile</span>
                      <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                    </button>
                    <button onClick={() => { setIsProfileDropdownOpen(false); setIsCoopDetailsOpen(true); }}
                      className="w-full text-left text-xs font-semibold px-2 py-1.5 rounded text-secondary hover:bg-secondary-fixed/20 flex items-center justify-between">
                      <span>Coop Member Dividend Report</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                    <button onClick={() => { setIsProfileDropdownOpen(false); signOut(); }}
                      className="w-full text-left text-xs font-semibold px-2 py-1.5 rounded text-error hover:bg-error-container/40 flex items-center justify-between">
                      <span>Sign Out</span>
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

