import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { CategoryCard } from '../../components/customer/CategoryCard';
import { WorkerCard } from '../../components/customer/WorkerCard';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

export const Services = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [featuredWorkers, setFeaturedWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, workers] = await Promise.all([
          api.getCategories(),
          api.getWorkers({ minRating: 4.8 }),
        ]);
        setCategories(cats);
        setFeaturedWorkers(workers.slice(0, 4));
      } catch (err) {
        console.error('Failed to load services', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/book?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/book');
    }
  };

  const handleCategorySelect = (categoryId) => {
    navigate(`/book?category=${categoryId}`);
  };

  return (
    <Layout showBack={false} title="Sahakari">
      <div className="space-y-12">
        {/* ─── HERO SECTION ─── */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[520px] sm:min-h-[580px] md:min-h-[640px] flex flex-col lg:grid lg:grid-cols-2">

          {/* ── LEFT PANEL: Content ── */}
          <div className="relative z-10 bg-gradient-to-br from-[#0f172a] via-[#164e63] to-[#4f46e5] flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14 gap-6">

            {/* Radial ambient glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-violet-300/15 rounded-full blur-2xl pointer-events-none" />

            {/* Live badge */}
            <div className="relative inline-flex items-center gap-2 self-start bg-white/10 backdrop-blur-md border border-cyan-200/20 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-cyan-100 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300" />
              </span>
              {t('hero.badge')}
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                {t('hero.headline')}{' '}
                <span className="relative inline-block">
                  <span className="text-cyan-200">{t('hero.headlineHighlight')}</span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none" preserveAspectRatio="none">
                    <path d="M0 5 Q50 0 100 4 Q150 8 200 3" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </h1>
              <p className="text-sm sm:text-base text-indigo-100/80 max-w-md leading-relaxed font-light">
                {t('hero.subheadline')}
              </p>
            </div>

            {/* Search capsule */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[19px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('hero.searchPlaceholder')}
                  className="w-full bg-white/95 text-slate-900 pl-10 pr-3 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400 shadow-md"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-slate-950 font-bold px-5 py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg whitespace-nowrap cursor-pointer"
              >
                {t('hero.findPros')}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </form>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'hero.tags.electrician', category: 'electrician' },
                { key: 'hero.tags.plumbing', category: 'plumbing' },
                { key: 'hero.tags.acServicing', category: 'ac-repair' },
                { key: 'hero.tags.carpentry', category: 'carpentry' },
              ].map((tag) => (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => navigate(`/book?category=${tag.category}`)}
                  className="bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/15 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {t(tag.key)}
                </button>
              ))}
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
              {[
                { icon: 'verified_user', value: '5,200+', labelKey: 'hero.stats.verifiedPros' },
                { icon: 'star', value: '4.9★', labelKey: 'hero.stats.avgRating' },
                { icon: 'schedule', value: '15 min', labelKey: 'hero.stats.avgResponse' },
              ].map((stat) => (
                <div key={stat.labelKey} className="flex items-center gap-2 bg-white/8 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                  <span className="material-symbols-outlined text-indigo-400 text-[16px]">{stat.icon}</span>
                  <span className="text-[11px] text-white font-bold">{stat.value}</span>
                  <span className="text-[10px] text-indigo-200/70">{t(stat.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL: Hero Image ── */}
          <div className="relative hidden lg:block">
            <img
              src="/hero-bg.jpg"
              alt="Sahakari verified professional at your doorstep"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/80 via-[#164e63]/40 to-transparent pointer-events-none" />

            {/* Floating "Live GPS" chip */}
            <div className="absolute top-6 right-6 bg-white/15 backdrop-blur-md border border-white/20 text-white px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
              </span>
              {t('hero.liveGpsChip')}
            </div>

            {/* Worker trust card */}
            <div className="absolute bottom-6 right-6 left-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-black text-base shadow">
                R
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">{t('hero.workerCard.title')}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-indigo-300 text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  {t('hero.workerCard.badge')} &nbsp;•&nbsp; ★ 4.97 &nbsp;•&nbsp; 6 {t('hero.workerCard.away')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
              >
                {t('hero.workerCard.book')}
              </button>
            </div>
          </div>

          {/* Mobile-only: image strip */}
          <div className="lg:hidden relative h-44 overflow-hidden">
            <img
              src="/hero-bg.jpg"
              alt="Sahakari verified professional"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/90 via-[#164e63]/40 to-transparent" />
          </div>
        </section>

        {/* 4-Pillar Trust Ribbon */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: 'verified_user',
              titleKey: 'trust.idVerified',
              descKey: 'trust.idVerifiedDesc',
              color: 'text-indigo-700 bg-emerald-50 border-indigo-200',
            },
            {
              icon: 'near_me',
              titleKey: 'trust.liveGps',
              descKey: 'trust.liveGpsDesc',
              color: 'text-primary bg-primary-fixed/20 border-primary/20',
            },
            {
              icon: 'lock',
              titleKey: 'trust.escrow',
              descKey: 'trust.escrowDesc',
              color: 'text-amber-800 bg-amber-50 border-amber-200',
            },
            {
              icon: 'handshake',
              titleKey: 'trust.fairPrice',
              descKey: 'trust.fairPriceDesc',
              color: 'text-blue-800 bg-blue-50 border-blue-200',
            },
          ].map((pill, idx) => (
            <div
              key={idx}
              className="bg-surface border border-outline-variant/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${pill.color}`}>
                <span className="material-symbols-outlined text-[20px]">{pill.icon}</span>
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-sm font-bold text-on-surface truncate">
                  {t(pill.titleKey)}
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                  {t(pill.descKey)}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Emergency Dispatch Callout */}
        <section className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">electric_bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-amber-950">
                  {t('emergency.title')}
                </h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {t('emergency.eta')}
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1">
                {t('emergency.desc')} {user?.city || 'New Delhi'}.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/book?category=electrician')}
            className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            {t('emergency.cta')}
          </button>
        </section>

        {/* Popular Service Categories */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-outline-variant/50 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                {t('categories.eyebrow')}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
                {t('categories.heading')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/book')}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 group cursor-pointer"
            >
              <span>{t('categories.viewAll')}</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onClick={() => handleCategorySelect(cat.id)}
              />
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-surface border border-outline-variant/70 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              {t('howItWorks.eyebrow')}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {t('howItWorks.heading')}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t('howItWorks.subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              {
                step: '01',
                titleKey: 'howItWorks.step1Title',
                descKey: 'howItWorks.step1Desc',
                icon: 'person_search',
              },
              {
                step: '02',
                titleKey: 'howItWorks.step2Title',
                descKey: 'howItWorks.step2Desc',
                icon: 'sync_alt',
              },
              {
                step: '03',
                titleKey: 'howItWorks.step3Title',
                descKey: 'howItWorks.step3Desc',
                icon: 'near_me',
              },
            ].map((stepItem, idx) => (
              <div
                key={idx}
                className="bg-surface-container-low/70 border border-outline-variant/60 rounded-2xl p-6 space-y-3 relative group hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">
                      {stepItem.icon}
                    </span>
                  </div>
                  <span className="font-mono text-2xl font-black text-outline-variant group-hover:text-primary/40 transition-colors">
                    {stepItem.step}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-on-surface">
                  {t(stepItem.titleKey)}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t(stepItem.descKey)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};
