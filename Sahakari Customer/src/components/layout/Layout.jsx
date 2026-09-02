import React from 'react';
import { Header } from './Header';
import { BottomNavbar } from './BottomNavbar';
import { AuthModal } from '../auth/AuthModal';

export const Layout = ({ children, showBack = true, title = 'Sahakari' }) => {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans">
      <Header showBack={showBack} title={title} />
      
      {/* Main content padding to account for fixed Header (pt-16) and mobile BottomNavbar (pb-20 md:pb-8) */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-margin-mobile md:px-margin-desktop pt-20 pb-24 md:pb-12">
        {children}
      </main>

      <BottomNavbar />
      <AuthModal />
    </div>
  );
};
