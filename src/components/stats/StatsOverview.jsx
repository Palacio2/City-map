import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaMap, FaChartLine, FaClock, FaEye, FaHistory, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './StatsPage.module.css';

const formatDate = (dateString, locale) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(locale, {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });
};

export default function StatsOverview({ stats, weeklyActivity = [], popularDistricts = [] }) {
  const { t, i18n } = useTranslation('stats');
  const navigate = useNavigate();

  const usageStats = useMemo(() => {
    const formatDuration = (seconds) => {
      if (!seconds) return `0 ${t('stats_page.hours')} 0 ${t('stats_page.minutes')}`;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} ${t('stats_page.hours')} ${minutes} ${t('stats_page.minutes')}`;
    };

    return {
      searches: stats?.searches || 0,
      savedDistricts: stats?.savedDistricts || 0,
      comparisons: stats?.comparisons || 0,
      lastActive: stats?.lastActive ? formatDate(stats.lastActive, i18n.language) : t('stats_page.never'),
      totalTime: formatDuration(stats?.totalTime),
      favoriteDistrict: stats?.favoriteDistrict || null
    };
  }, [stats, t, i18n.language]);

  const scale = useMemo(() => {
    if (!weeklyActivity.length) return 1;
    const maxVal = Math.max(
      ...weeklyActivity.map(d => Math.max(d.searches || 0, d.comparisons || 0))
    );
    return maxVal > 0 ? 110 / maxVal : 1;
  }, [weeklyActivity]);

  const handleDistrictNavigate = (district) => {
    if (district?.city && district?.country && district?.name) {
      navigate(`/map/${district.country}/${district.city}?district=${encodeURIComponent(district.name)}`);
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <FaClock className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>{t('stats_page.general_stats')}</h2>
        </div>
        
        <div className={styles.statsGrid}>
          <div 
            className={`${styles.statCard} ${styles.clickableItem}`}
            onClick={() => navigate('/')}
          >
            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
              <FaSearch />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{usageStats.searches}</span>
              <span className={styles.statLabel}>{t('stats_page.searches')}</span>
            </div>
          </div>

          <div 
            className={`${styles.statCard} ${styles.clickableItem}`}
            onClick={() => navigate('/favorites')}
          >
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>
              <FaMap />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{usageStats.savedDistricts}</span>
              <span className={styles.statLabel}>{t('stats_page.saved')}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconOrange}`}>
              <FaChartLine />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{usageStats.comparisons}</span>
              <span className={styles.statLabel}>{t('stats_page.comparisons')}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconLightPurple}`}>
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
          {weeklyActivity.length > 0 ? (
            weeklyActivity.map((day, index) => (
              <div key={index} className={styles.activityDay}>
                <div className={styles.dayName}>{day.day}</div>
                <div className={styles.activityBars}>
                  <div 
                    className={`${styles.activityBar} ${styles.barPurple}`} 
                    style={{ height: `${(day.searches || 0) * scale}px` }}
                    title={`${t('stats_page.searches')}: ${day.searches}`}
                  >
                    <span className={styles.barLabel}>{day.searches}</span>
                  </div>
                  <div 
                    className={`${styles.activityBar} ${styles.barOrange}`} 
                    style={{ height: `${(day.comparisons || 0) * scale}px` }}
                    title={`${t('stats_page.comparisons')}: ${day.comparisons}`}
                  >
                    <span className={styles.barLabel}>{day.comparisons}</span>
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
            <div className={`${styles.legendColor} ${styles.bgPurple}`}></div>
            <span>{t('stats_page.legend_searches')}</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.bgOrange}`}></div>
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
          {popularDistricts.length > 0 ? (
            popularDistricts.map((district, index) => (
              <div 
                key={index} 
                className={`${styles.popularItem} ${styles.clickableItem}`}
                onClick={() => handleDistrictNavigate(district)}
              >
                <div className={styles.districtInfo}>
                  <span className={styles.districtRank}>#{index + 1}</span>
                  <span className={styles.districtName}>
                    {district.name}
                    <span className={styles.districtLocation}>{district.city}, {district.country}</span>
                  </span>
                </div>
                <div className={styles.districtStats}>
                  <span className={styles.searchCount}>
                    {district.count} {t('stats_page.views')}
                  </span>
                  <div className={styles.popularityBarContainer}>
                    <div 
                      className={styles.popularityBar}
                      style={{ 
                        width: `${(district.count / (popularDistricts[0]?.count || 1)) * 100}%` 
                      }}
                    />
                  </div>
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
              <span className={styles.statusTime}>
                {t('stats_page.last_active_at', { time: usageStats.lastActive })}
              </span>
            </div>
          </div>
          
          <div className={styles.favoriteInfo}>
            <span className={styles.favoriteLabel}>{t('stats_page.fav_district')}</span>
            {usageStats.favoriteDistrict ? (
              <span 
                className={`${styles.favoriteValue} ${styles.clickableText}`}
                onClick={() => handleDistrictNavigate(usageStats.favoriteDistrict)}
              >
                {usageStats.favoriteDistrict.name} 
                <FaExternalLinkAlt className={styles.linkIcon} />
              </span>
            ) : (
              <span className={styles.favoriteValue}>{t('stats_page.not_defined')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}