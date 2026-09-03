import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

export const BottomNavbar = () => {
  const location = useLocation();
  const { openAuthModal, isAuthenticated, isAuthModalOpen } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    {
      to: '/services',
      labelKey: 'nav.services',
      icon: 'grid_view',
      activeMatch: (p) => p === '/' || p === '/services',
    },
    {
      to: '/book',
      labelKey: 'nav.bookService',
      icon: 'edit_document',
      activeMatch: (p) => p === '/book',
    },
    {
      to: '/tracking',
      labelKey: 'nav.liveTrack',
      icon: 'near_me',
      isLive: true,
      activeMatch: (p) => p.startsWith('/tracking'),
    },
    {
      to: '/booking',
      labelKey: 'nav.bookings',
      icon: 'calendar_month',
      activeMatch: (p) => p.startsWith('/booking'),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 max-w-lg mx-auto z-50 bg-surface/80 backdrop-blur-2xl border border-outline-variant/60 rounded-2xl shadow-xl flex justify-around items-center h-16 px-1.5 transition-all text-on-surface">
      {navItems.map((item) => {
        const isActive = item.activeMatch(location.pathname);

        return (
          <NavLink
            key={item.labelKey}
            to={item.to}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 flex-1 py-1.5 rounded-xl ${
              isActive
                ? 'text-primary font-bold bg-primary/10'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`material-symbols-outlined text-[21px] ${
                  isActive ? 'fill text-primary scale-105' : ''
                }`}
              >
                {item.icon}
              </span>
              {item.isLive && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight truncate">
              {t(item.labelKey)}
            </span>
          </NavLink>
        );
      })}

      {/* Profile / Log In Action Button (Opens Auth Modal) */}
      <button
        type="button"
        onClick={() => openAuthModal(isAuthenticated ? 'profile' : 'signin')}
        className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 flex-1 py-1.5 rounded-xl cursor-pointer ${
          isAuthModalOpen
            ? 'text-primary font-bold bg-primary/10'
            : 'text-on-surface-variant hover:text-primary'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[21px] ${
            isAuthModalOpen ? 'fill text-primary scale-105' : ''
          }`}
        >
          {isAuthenticated ? 'account_circle' : 'login'}
        </span>
        <span className="text-[10px] font-semibold mt-0.5 tracking-tight truncate">
          {isAuthenticated ? t('header.myProfile') : t('header.login')}
        </span>
      </button>
    </nav>
  );
};
