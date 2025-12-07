import React from 'react';
import styles from './styles/cards.module.css';
import { getRatingColor } from '../../../utils/ratingUtils';

export default function StatCard({ 
  title, 
  icon, 
  rating, 
  children 
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>{icon}</span>
          <h3>{title}</h3>
        </div>
        <div className={`${styles.cardRating} ${getRatingColor(rating)}`}>
          {rating?.toFixed(1) || 'н/д'}
        </div>
      </div>
      <div className={styles.cardStats}>
        {children}
      </div>
    </div>
  );
}