import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { WorkerCard } from '../../components/customer/WorkerCard';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';

export const NearbyWorkers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const activeCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('search') || '';

  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(activeCategory);
  const [maxDistance, setMaxDistance] = useState(5);
  const [minRating, setMinRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiltersAndWorkers = async () => {
      try {
        setLoading(true);
        const [cats, workerList] = await Promise.all([
          api.getCategories(),
          api.getWorkers({
            category: selectedCategory || undefined,
            searchQuery: searchQuery || undefined,
            maxDistance: maxDistance || undefined,
            minRating: minRating || undefined,
          }),
        ]);
        setCategories(cats);
        setWorkers(workerList);
      } catch (err) {
        console.error('Error fetching workers', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltersAndWorkers();
  }, [selectedCategory, searchQuery, maxDistance, minRating]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout title={t('workers.pageTitle') || 'Nearby Workers'}>
      <div className="space-y-6">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              {t('workers.eyebrow')}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
              {t('workers.heading')}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              {t('workers.subheading')}
            </p>
          </div>

          <div className="w-full md:w-80">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('workers.searchPlaceholder')}
                className="w-full bg-surface border border-outline-variant/70 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              !selectedCategory
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface border border-outline-variant/60 text-on-surface-variant hover:border-primary/50'
            }`}
          >
            {t('workers.allTrades')} ({categories.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface border border-outline-variant/60 text-on-surface-variant hover:border-primary/50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Distance & Rating Filters */}
        <div className="bg-surface border border-outline-variant/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Distance Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant font-medium">{t('workers.distance')}</span>
              {[1, 2, 5, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => setMaxDistance(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    maxDistance === d
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/50'
                  }`}
                >
                  ≤ {d} km
                </button>
              ))}
            </div>

            {/* Rating Chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant font-medium">{t('workers.rating')}</span>
              {[0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-0.5 transition-all cursor-pointer ${
                    minRating === r
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/50'
                  }`}
                >
                  {r === 0 ? t('workers.ratingAny') : `${r}★+`}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-bold text-primary bg-primary-fixed/40 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            {workers.length} {workers.length === 1 ? t('workers.workerFound') : t('workers.workersFound')}
          </span>
        </div>

        {/* Worker Cards Grid */}
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="inline-block w-8 h-8 border-3 border-primary border-r-transparent rounded-full animate-spin mb-3" />
            <p className="font-medium text-xs">{t('workers.finding')}</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="bg-surface border border-outline-variant/70 rounded-3xl p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-outline">
              search_off
            </span>
            <h3 className="font-display text-lg font-bold text-on-surface">
              {t('workers.noResults')}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              {t('workers.noResultsDesc')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
                setMaxDistance(10);
                setMinRating(0);
              }}
              className="mt-2"
            >
              {t('workers.resetFilters')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onNegotiate={(w) => navigate(`/negotiation/${w.id}`)}
                onSelect={(w) => navigate(`/book?worker=${w.id}&category=${w.category || 'electrician'}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

