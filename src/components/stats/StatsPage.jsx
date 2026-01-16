import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import { fetchDashboardData } from '../api/statsApi';
import StatsOverview from './StatsOverview';
import styles from './StatsPage.module.css';

export default function StatsPage() {
  const { t } = useTranslation('stats');
  const { isPremium } = useSubscription();
  
  const [stats, setStats] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [popularDistricts, setPopularDistricts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isPremium) {
      loadAllStats();
    }
  }, [isPremium]);

  const loadAllStats = async () => {
    try {
      setError(null);
      const data = await fetchDashboardData();
      
      setStats(data.stats);
      setWeeklyActivity(Array.isArray(data.weeklyActivity) ? data.weeklyActivity : []);
      setPopularDistricts(Array.isArray(data.popularDistricts) ? data.popularDistricts : []);
    } catch (err) {
      setError(err.message || t('stats_page.error_unknown'));
    }
  };

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
            <button onClick={loadAllStats} className={styles.retryButton}>
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

      <StatsOverview 
        stats={stats}
        weeklyActivity={weeklyActivity}
        popularDistricts={popularDistricts}
      />
    </div>
  );
}