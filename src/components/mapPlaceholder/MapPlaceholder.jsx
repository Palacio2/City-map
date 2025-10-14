import React from 'react';
import styles from './MapPlaceholder.module.css';

export default function MapPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <div className={styles.mapContainer}>
        <div className={styles.icon}>🗺️</div>
        <h3>Мапа районів</h3>
        <p>Оберіть фільтри для відображення даних на мапі</p>
        <p className={styles.note}>Або переконайтеся, що для міста додані райони з SVG даними</p>
      </div>
    </div>
  );
}