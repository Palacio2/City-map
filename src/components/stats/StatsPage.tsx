import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft } from 'react-icons/fa';
import { useSubscription } from '@subscription/SubscriptionContext';
import Loader from '@components/loader/Loader';
import StatsOverview from './StatsOverview';
import { useStatsData } from './hooks/useStatsData';

export default function StatsPage() {
  const { t } = useTranslation('db');
  const { isPremium, isRealtor } = useSubscription();
  
  const { 
    stats, 
    weeklyActivity, 
    trackedDistricts, 
    loading, 
    error, 
    reload 
  } = useStatsData(isPremium, isRealtor);

  if (!isPremium) {
    return <Navigate to="/subscription" replace />;
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-body text-textMain py-8 px-4 md:px-8 font-body">
        <div className="max-w-[1200px] mx-auto mb-12 flex flex-col gap-4 animate-fadeIn">
          <Link to="/profile" className="inline-flex items-center gap-2 text-textSecondary font-heading font-semibold text-[0.85rem] tracking-widest uppercase transition-all w-fit hover:text-accent hover:-translate-x-1 decoration-none">
            {/* Змінено ключ */}
            <FaArrowLeft /> {t('page_stats.back_to_profile')}
          </Link>
          <div className="bg-danger/5 border border-danger p-8 rounded-xl text-center max-w-[500px] mx-auto text-textMain animate-fadeIn mt-8">
            {/* Змінено ключ */}
            <h3 className="text-xl font-bold mb-2">{t('page_stats.error_load')}</h3>
            <p className="text-textSecondary mb-6">{error}</p>
            <button onClick={() => reload()} className="px-6 py-3 bg-accent text-white border-none rounded-lg cursor-pointer font-semibold font-heading uppercase tracking-widest transition-all hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-md">
              {/* Змінено ключ */}
              {t('page_stats.retry')} 
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-body text-textMain py-8 px-4 md:px-8 font-body">
      <div className="max-w-[1200px] mx-auto mb-10 flex flex-col gap-4 animate-fadeIn">
        <Link to="/profile" className="inline-flex items-center gap-2 text-textSecondary font-heading font-semibold text-[0.85rem] tracking-widest uppercase transition-all w-fit hover:text-accent hover:-translate-x-1 decoration-none">
          {/* Змінено ключ */}
          <FaArrowLeft /> {t('page_stats.back_to_profile')}
        </Link>
        <div className="mt-2">
          {/* Змінено ключ */}
          <h1 className="font-heading text-3xl md:text-[2.5rem] font-bold text-accent mb-2 inline-block">
            {t('page_stats.title')}
          </h1>
          {/* Змінено ключ */}
          <p className="text-textSecondary text-base max-w-[600px] leading-relaxed">
            {t('page_stats.subtitle')}
          </p>
        </div>
      </div>

      {loading ? (
        <Loader fullScreen text={t('page_stats.loading')} />
      ) : (
        <StatsOverview 
          stats={stats} 
          weeklyActivity={weeklyActivity} 
          trackedDistricts={trackedDistricts || []} 
        />
      )}
    </div>
  );
}