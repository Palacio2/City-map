import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaMap, FaChartLine, FaClock } from 'react-icons/fa';
import styles from './StatsCards.module.css';

const formatDuration = (seconds, t) => {
  if (!seconds) return `0 ${t('stats_page.hours')} 0 ${t('stats_page.minutes')}`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} ${t('stats_page.hours')} ${minutes} ${t('stats_page.minutes')}`;
};

export default function StatsCards({ stats, onSearchesClick, onSavedClick, onCompareClick, showCompare }) {
  const { t } = useTranslation('stats');

  const cards = [
    { 
      icon: FaSearch, 
      color: 'blue', 
      label: t('stats_page.searches'), 
      value: stats?.viewed_districts_count || stats?.viewedDistricts || 0,
      onClick: onSearchesClick
    },
    { 
      icon: FaMap, 
      color: 'green', 
      label: t('stats_page.saved_districts'), 
      value: stats?.savedDistricts || 0,
      onClick: onSavedClick
    },
    { 
      icon: FaChartLine, 
      color: 'purple', 
      label: t('stats_page.comparisons'), 
      value: stats?.comparisons || 0,
      onClick: onCompareClick,
      hidden: !showCompare
    },
    { 
      icon: FaClock, 
      color: 'orange', 
      label: t('stats_page.time_spent'), 
      value: formatDuration(stats?.total_time_seconds || stats?.totalTime || 0, t),
      onClick: null
    },
  ];

  const visibleCards = cards.filter(card => !card.hidden);

  return (
    <div className={styles.grid}>
      {visibleCards.map((item, index) => (
        <div 
          key={index} 
          className={`${styles.card} ${item.onClick ? styles.clickable : ''}`}
          onClick={item.onClick}
        >
          <div className={`${styles.iconWrapper} ${styles[item.color]}`}>
            <item.icon />
          </div>
          <div className={styles.info}>
            <span className={styles.value}>{item.value}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}