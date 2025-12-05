import React from 'react';
import styles from '../DistrictDetailsModal.module.css';

const StatCard = ({ icon, title, rating, stats, getRatingColor }) => (
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
      {stats.map((stat, index) => (
        <div className={styles.statRow} key={index}>
          <span>{stat.label}:</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  </div>
);

export default StatCard;
