import React from 'react';
import styles from './Filters.module.css';

export default function SocialFilters() {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🌳 Соціальна інфраструктура</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input type="checkbox" name="parks" />
          <span>Парки та сквери</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="cafes" />
          <span>Кафе та ресторани</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="playgrounds" />
          <span>Дитячі майданчики</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="sports" />
          <span>Спортивні майданчики</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="libraries" />
          <span>Бібліотеки</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="cinemas" />
          <span>Кінотеатри</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="theaters" />
          <span>Театри</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="museums" />
          <span>Музеї</span>
        </label>
      </div>
    </div>
  );
}