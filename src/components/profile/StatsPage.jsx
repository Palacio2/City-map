import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaMap, FaChartLine, FaClock, FaArrowLeft, FaEye, FaHistory } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import { fetchUserStats, fetchWeeklyActivity, fetchPopularDistricts } from '../api/statsApi';
import styles from './StatsPage.module.css';

export default function StatsPage() {
  const { t } = useTranslation('profile');
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const [stats, setStats] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [popularDistricts, setPopularDistricts] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isPremium) {
      loadAllStats();
    }
  }, [isPremium]);

  const loadAllStats = async () => {
    try {
      setStatsLoading(true);
      setError(null);
      
      const [userStats, weeklyData, popularData] = await Promise.all([
        fetchUserStats(),
        fetchWeeklyActivity(),
        fetchPopularDistricts()
      ]);
      
      setStats(userStats);
      setWeeklyActivity(Array.isArray(weeklyData) ? weeklyData : []);
      setPopularDistricts(Array.isArray(popularData) ? popularData : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  if (subscriptionLoading || statsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('billing_page.loading')}</div>
      </div>
    );
  }

  if (!isPremium) {
    return <Navigate to="/subscription" replace />;
  }

  const usageStats = stats || {
    searches: 0,
    savedDistricts: 0,
    comparisons: 0,
    lastActive: t('stats_page.never'),
    totalTime: '0 год 0 хв',
    favoriteDistrict: t('stats_page.not_defined')
  };

  const safeWeeklyActivity = Array.isArray(weeklyActivity) ? weeklyActivity : [];
  
  const maxSearches = Math.max(...safeWeeklyActivity.map(day => day.searches || 0));
  const maxComparisons = Math.max(...safeWeeklyActivity.map(day => day.comparisons || 0));
  const maxValue = Math.max(maxSearches, maxComparisons, 1);
  const scale = 110 / maxValue;

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/profile" className={styles.backButton}>
            <FaArrowLeft /> {t('actions.back_to_profile')}
          </Link>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>{t('stats_page.title')}</h1>
            <p className={styles.subtitle}>{t('stats_page.subtitle')}</p>
          </div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.errorState}>
              <h3>{t('stats_page.error_load')}</h3>
              <p>{error}</p>
              <button onClick={loadAllStats} className={styles.retryButton}>
                {t('actions.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> {t('actions.back_to_profile')}
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('stats_page.title')}</h1>
          <p className={styles.subtitle}>{t('stats_page.subtitle')}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaClock className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>{t('stats_page.general_stats')}</h2>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <FaSearch />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{usageStats.searches}</span>
                <span className={styles.statLabel}>{t('stats_page.searches')}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
                <FaMap />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{usageStats.savedDistricts}</span>
                <span className={styles.statLabel}>{t('stats_page.saved')}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' }}>
                <FaChartLine />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{usageStats.comparisons}</span>
                <span className={styles.statLabel}>{t('stats_page.comparisons')}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)' }}>
                <FaClock />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statText}>{usageStats.totalTime}</span>
                <span className={styles.statLabel}>{t('stats_page.time')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaHistory className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>{t('stats_page.weekly_activity')}</h2>
          </div>
          
          <div className={styles.weeklyActivity}>
            {safeWeeklyActivity.length > 0 ? (
              safeWeeklyActivity.map((day, index) => (
                <div key={index} className={styles.activityDay}>
                  <div className={styles.dayName}>{day.day || '...'}</div>
                  <div className={styles.activityBars}>
                    <div 
                      className={styles.activityBar} 
                      style={{ 
                        height: `${(day.searches || 0) * scale}px`,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                      title={`${day.searches || 0}`}
                    >
                      <span className={styles.barLabel}>{day.searches || 0}</span>
                    </div>
                    <div 
                      className={styles.activityBar} 
                      style={{ 
                        height: `${(day.comparisons || 0) * scale}px`,
                        background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)'
                      }}
                      title={`${day.comparisons || 0}`}
                    >
                      <span className={styles.barLabel}>{day.comparisons || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>{t('stats_page.no_weekly_data')}</p>
              </div>
            )}
          </div>
          
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ background: '#667eea' }}></div>
              <span>{t('stats_page.legend_searches')}</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ background: '#ed8936' }}></div>
              <span>{t('stats_page.legend_comparisons')}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaEye className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>{t('stats_page.popular_districts')}</h2>
          </div>
          
          <div className={styles.popularList}>
            {Array.isArray(popularDistricts) && popularDistricts.length > 0 ? (
              popularDistricts.map((district, index) => (
                <div key={index} className={styles.popularItem}>
                  <div className={styles.districtInfo}>
                    <span className={styles.districtRank}>#{index + 1}</span>
                    <span className={styles.districtName}>{district.name || district.district || 'Unknown'}</span>
                  </div>
                  <div className={styles.districtStats}>
                    <span className={styles.searchCount}>{district.count || 0} {t('stats_page.views')}</span>
                    <div 
                      className={styles.popularityBar}
                      style={{ 
                        width: `${((district.count || 0) / (popularDistricts[0]?.count || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>{t('stats_page.no_popular_data')}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaClock className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>{t('stats_page.last_activity')}</h2>
          </div>
          
          <div className={styles.lastActivity}>
            <div className={styles.activityStatus}>
              <div className={styles.statusIndicator}></div>
              <div className={styles.statusInfo}>
                <span className={styles.statusText}>{t('stats_page.online')}</span>
                <span className={styles.statusTime}>{t('stats_page.last_active_at', { time: usageStats.lastActive })}</span>
              </div>
            </div>
            
            <div className={styles.favoriteInfo}>
              <span className={styles.favoriteLabel}>{t('stats_page.fav_district')}</span>
              <span className={styles.favoriteValue}>{usageStats.favoriteDistrict || t('stats_page.not_defined')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}