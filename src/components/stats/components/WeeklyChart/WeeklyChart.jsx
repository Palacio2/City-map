import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHistory } from 'react-icons/fa';
import styles from './WeeklyChart.module.css';

export default function WeeklyChart({ data = [] }) {
  const { t, i18n } = useTranslation('stats');

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => {
      const dateObj = new Date(item.date);
      const dayLabel = dateObj.toLocaleDateString(i18n.language || 'uk-UA', { weekday: 'short' });
      
      return {
        ...item,
        dayLabel
      };
    });
  }, [data, i18n.language]);

  const scale = useMemo(() => {
    if (!chartData.length) return 1;
    const maxVal = Math.max(
      ...chartData.map(d => Math.max(d.searches || 0, d.comparisons || 0))
    );
    return maxVal > 0 ? 100 / maxVal : 1;
  }, [chartData]);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
           <div className={styles.iconWrapper}>
             <FaHistory className={styles.icon} />
           </div>
           <h2 className={styles.title}>{t('stats_page.weekly_activity')}</h2>
        </div>
      </div>

      <div className={styles.weeklyActivity}>
        {chartData.length > 0 ? (
          chartData.map((day, index) => (
            <div key={index} className={styles.activityDay}>
              <div className={styles.dayName}>{day.dayLabel}</div>
              
              <div className={styles.activityBars}>
                <div 
                  className={`${styles.activityBar} ${styles.barPrimary}`} 
                  style={{ height: `${Math.max((day.searches || 0) * scale, 6)}%` }}
                >
                  <div className={styles.tooltip}>
                    {t('stats_page.searches')}: {day.searches}
                  </div>
                </div>

                <div 
                  className={`${styles.activityBar} ${styles.barSecondary}`} 
                  style={{ height: `${Math.max((day.comparisons || 0) * scale, 6)}%` }}
                >
                  <div className={styles.tooltip}>
                    {t('stats_page.comparisons')}: {day.comparisons}
                  </div>
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
          <div className={`${styles.legendColor} ${styles.bgPrimary}`}></div>
          <span>{t('stats_page.legend_searches')}</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.bgSecondary}`}></div>
          <span>{t('stats_page.legend_comparisons')}</span>
        </div>
      </div>
    </div>
  );
}