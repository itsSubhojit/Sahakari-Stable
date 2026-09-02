import React, { useState } from 'react';
import { NegotiationProvider, useNegotiation } from './context/NegotiationContext';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { QuickStatsBar } from './components/layout/QuickStatsBar';
import { WorkspacePlaceholder } from './components/layout/WorkspacePlaceholder';
import { ProfileSettings } from './components/layout/ProfileSettings';
import { JobContextHeader } from './components/negotiation/JobContextHeader';
import { TurnBanner } from './components/negotiation/TurnBanner';
import { NegotiationThread } from './components/negotiation/NegotiationThread';
import { CounterActionBar } from './components/negotiation/CounterActionBar';
import { CustomerCard } from './components/job-details/CustomerCard';
import { JobScopeCard } from './components/job-details/JobScopeCard';
import { EarningsCalculator } from './components/job-details/EarningsCalculator';
import { PhotoGalleryLightbox } from './components/job-details/PhotoGalleryLightbox';
import { QuickMessageTemplates } from './components/job-details/QuickMessageTemplates';
import { LeadsSidebarList } from './components/leads/LeadsSidebarList';
import { AcceptJobModal } from './components/modals/AcceptJobModal';
import { RejectOfferModal } from './components/modals/RejectOfferModal';
import { SitePhotosModal } from './components/modals/SitePhotosModal';
import { CooperativeDividendModal } from './components/modals/CooperativeDividendModal';
import { ToastContainer } from './components/common/Toast';

const RIGHT_TABS = [
  { id: 'DETAILS',     label: 'Job Details', icon: 'work' },
  { id: 'CALCULATOR',  label: 'Earnings',    icon: 'payments' },
  { id: 'LEADS',       label: 'AI Leads',    icon: 'radar' },
];

// Nav sections that show the negotiation console
const NEGOTIATION_NAVS = ['negotiations', 'cooperative'];

function WorkerApp() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('negotiations');
  const [rightTab, setRightTab] = useState('DETAILS');
  const { openPhotoLightbox, activeLead } = useNegotiation();

  const isNegotiationView = NEGOTIATION_NAVS.includes(activeNav);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Top Header */}
      <Header onToggleMobileMenu={() => setIsMobileNavOpen(true)} setActiveNav={setActiveNav} />

      {/* Quick Metrics Bar */}
      <QuickStatsBar />

      {/* Main Container Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
        />

        {/* Central Workspace */}
        <div className="flex-1 flex justify-center overflow-y-auto bg-surface-dim/30">
          <div className="w-full max-w-[1280px] flex flex-col lg:flex-row gap-0 lg:gap-6 p-0 lg:p-6 min-h-[calc(100vh-112px)]">

            {/* ── NEGOTIATION VIEW ── */}
            {isNegotiationView && (
              <>
                {/* Left/Center: Chat Console */}
                <main className="flex-1 flex flex-col bg-surface border-x lg:border border-outline-variant lg:rounded-2xl overflow-hidden shadow-elevation-2 h-[550px] lg:h-[620px]">
                  <JobContextHeader
                    onOpenPhotos={() => {
                      if (activeLead?.jobScope?.photos?.[0]) {
                        openPhotoLightbox(activeLead.jobScope.photos[0]);
                      }
                    }}
                  />
                  <TurnBanner />
                  <NegotiationThread />
                  <CounterActionBar />
                </main>

                {/* Right: Tab-switched panels */}
                <aside className="w-full lg:w-[380px] flex flex-col gap-3 p-3 lg:p-0">
                  {/* Tab Switcher */}
                  <div className="flex bg-surface border border-outline-variant rounded-xl p-1 gap-1 shadow-xs flex-shrink-0">
                    {RIGHT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setRightTab(tab.id)}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                          rightTab === tab.id
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex flex-col gap-4">
                    {rightTab === 'DETAILS' && (
                      <>
                        <CustomerCard />
                        <PhotoGalleryLightbox />
                        <JobScopeCard />
                      </>
                    )}
                    {rightTab === 'CALCULATOR' && (
                      <>
                        <EarningsCalculator />
                        <QuickMessageTemplates />
                      </>
                    )}
                    {rightTab === 'LEADS' && (
                      <LeadsSidebarList />
                    )}
                  </div>
                </aside>
              </>
            )}

            {/* ── OTHER NAV VIEWS (placeholder screens or Profile) ── */}
            {!isNegotiationView && (
              <div className="flex-1 flex flex-col bg-surface border-x lg:border border-outline-variant lg:rounded-2xl overflow-hidden shadow-elevation-2">
                {activeNav === 'profile' ? (
                  <ProfileSettings />
                ) : (
                  <WorkspacePlaceholder navId={activeNav} />
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AcceptJobModal />
      <RejectOfferModal />
      <SitePhotosModal />
      <CooperativeDividendModal />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <NegotiationProvider>
      <WorkerApp />
    </NegotiationProvider>
  );
}
