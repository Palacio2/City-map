import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './styles/cards.module.css';
import { getRatingColor } from '@utils/ratingUtils';

export default function StatCard({
  title,
  icon,
  rating,
  children
}) {
  const { t } = useTranslation('districts');

  return (
    <div className={styles.statCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>{icon}</span>
          <h3>{title}</h3>
        </div>
        <div className={`${styles.cardRating} ${rating ? styles[getRatingColor(rating)] : ''}`}>
          {rating?.toFixed(1) || t('na')}
        </div>
      </div>
      <div className={styles.cardStats}>
        {children}
      </div>
    </div>
  );
}