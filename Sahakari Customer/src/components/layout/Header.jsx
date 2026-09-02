import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { Avatar } from '../common/Avatar';

export const Header = ({ showBack = true, title = 'Sahakari' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, lang, setLang, languages } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeSpinning, setThemeSpinning] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  const handleThemeToggle = () => {
    setThemeSpinning(true);
    toggleTheme();
    setTimeout(() => setThemeSpinning(false), 460);
  };

  const isHome = location.pathname === '/' || location.pathname === '/services';

  const navLinks = [
    {
      to: '/services',
      labelKey: 'nav.services',
      activeMatch: (p) => p === '/' || p === '/services',
    },
    {
      to: '/book',
      labelKey: 'nav.bookService',
      activeMatch: (p) => p.startsWith('/book'),
    },
    {
      to: '/tracking/BK-7892',
      labelKey: 'nav.liveTrack',
      isLive: true,
      activeMatch: (p) => p.startsWith('/tracking'),
    },
    {
      to: '/booking/BK-7892',
      labelKey: 'nav.bookings',
      activeMatch: (p) => p.startsWith('/booking'),
    },
  ];

  const handleSearchClick = () => {
    navigate('/services');
  };

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/services');
    } else {
      openAuthModal('signup');
    }
  };

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/60 backdrop-blur-xl border-b border-outline-variant/30 text-on-surface transition-all duration-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {(!isHome && showBack) && (
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-high/60 transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            )}

            <div
              onClick={() => navigate('/services')}
              className="cursor-pointer flex items-center gap-2.5 group select-none"
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#0D3A2A]/10 shadow-sm group-hover:scale-105 transition-transform duration-200">
                <img src="/favicon.svg" alt="Sahakari logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-primary">
                {title}
              </span>
            </div>
          </div>

          {/* Center-Right: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-8">
            {navLinks.map((link) => {
              const isActive = link.activeMatch(location.pathname);
              return (
                <NavLink
                  key={link.labelKey}
                  to={link.to}
                  className={`text-[13px] transition-all duration-150 flex items-center gap-1.5 py-1 ${
                    isActive
                      ? 'text-primary font-bold border-b-2 border-primary -mb-[2px]'
                      : 'text-on-surface-variant hover:text-primary font-medium'
                  }`}
                >
                  <span>{t(link.labelKey)}</span>
                  {link.isLive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Log in / Profile */}
            {isAuthenticated && user ? (
              <button
                type="button"
                onClick={() => openAuthModal('profile')}
                className="text-[13px] font-medium text-on-surface hover:text-primary flex items-center gap-2 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    size="sm"
                    className="w-6 h-6 rounded-full overflow-hidden border border-outline-variant"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full border border-surface" />
                </div>
                <span className="hidden sm:inline font-semibold">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="text-[13px] font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                {t('header.login')}
              </button>
            )}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={handleThemeToggle}
              title={isDark ? t('header.switchToLight') : t('header.switchToDark')}
              aria-label={isDark ? t('header.switchToLight') : t('header.switchToDark')}
              className="text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-surface-container-high/60 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${themeSpinning ? 'animate-theme-spin' : ''}`}
              >
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Worker Portal Switcher */}
            <NavLink
              to="/worker"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px]">engineering</span>
              <span>Worker Hub</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </NavLink>

            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                title="Change language"
                aria-label="Change language"
                className="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant hover:text-primary bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 px-2.5 py-1.5 rounded-full transition-all cursor-pointer select-none"
              >
                <span className="text-[14px] leading-none">{currentLang.flag}</span>
                <span className="hidden sm:inline uppercase tracking-wide">{currentLang.code}</span>
                <span className="material-symbols-outlined text-[14px]">
                  {langMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-surface/95 backdrop-blur-xl border border-outline-variant/60 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {languages.map((lng) => (
                    <button
                      key={lng.code}
                      type="button"
                      onClick={() => {
                        setLang(lng.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                        lang === lng.code
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="text-lg leading-none">{lng.flag}</span>
                      <div className="text-left">
                        <div className="font-semibold text-[13px] leading-tight">{lng.native}</div>
                        <div className="text-[11px] text-on-surface-variant leading-tight">{lng.label}</div>
                      </div>
                      {lang === lng.code && (
                        <span className="material-symbols-outlined text-[16px] ml-auto text-primary">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Icon */}
            <button
              type="button"
              onClick={handleSearchClick}
              title="Search verified workers & services"
              className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-high/60 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>

            {/* Hamburger Menu (Mobile) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              title="Toggle Menu"
              className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-high/60 transition-colors flex items-center justify-center cursor-pointer lg:hidden"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 bg-surface/95 backdrop-blur-2xl border-b border-outline-variant/60 p-5 space-y-4 lg:hidden animate-in slide-in-from-top-2 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = link.activeMatch(location.pathname);
              return (
                <NavLink
                  key={link.labelKey}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{t(link.labelKey)}</span>
                    {link.isLive && (
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-300">
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">
                    chevron_right
                  </span>
                </NavLink>
              );
            })}

            <NavLink
              to="/worker"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm transition-all bg-primary/10 text-primary font-bold border border-primary/25"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">engineering</span>
                <span>Worker Hub & Console</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </NavLink>
          </div>

          <div className="pt-3 border-t border-outline-variant/60 flex flex-col gap-2">
            {/* Language Switcher (Mobile) */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-1">
                Language / भाषा / ভাষা
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {languages.map((lng) => (
                  <button
                    key={lng.code}
                    type="button"
                    onClick={() => {
                      setLang(lng.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-0.5 transition-all border cursor-pointer ${
                      lang === lng.code
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="text-base leading-none">{lng.flag}</span>
                    <span className="text-[10px] leading-tight">{lng.native}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle (Mobile) */}
            <button
              type="button"
              onClick={handleThemeToggle}
              className="w-full py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center justify-center gap-2 border border-outline-variant/50"
            >
              <span className={`material-symbols-outlined text-[18px] ${themeSpinning ? 'animate-theme-spin' : ''}`}>
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              {isDark ? t('header.lightMode') : t('header.darkMode')}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal(isAuthenticated ? 'profile' : 'signin');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center justify-center gap-2 border border-outline-variant/50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isAuthenticated ? 'account_circle' : 'login'}
              </span>
              {isAuthenticated ? t('header.myProfile') : t('header.login')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
