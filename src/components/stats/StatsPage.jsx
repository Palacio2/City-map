import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import StatsOverview from './StatsOverview';
import { useStatsData } from './hooks/useStatsData';
import styles from './StatsPage.module.css';

export default function StatsPage() {
  const { t } = useTranslation('stats');
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
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/profile" className={styles.backButton}>
            <FaArrowLeft /> {t('stats_page.back_to_profile')}
          </Link>
          <div className={styles.errorState}>
            <h3>{t('stats_page.error_load')}</h3>
            <p>{error}</p>
            <button onClick={reload} className={styles.retryButton}>
              {t('actions.retry')} 
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> {t('stats_page.back_to_profile')}
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('stats_page.title')}</h1>
          <p className={styles.subtitle}>{t('stats_page.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>{t('loading')}...</div>
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