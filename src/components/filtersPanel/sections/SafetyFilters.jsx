import React from 'react';
import styles from './Filters.module.css';
import SubscriptionLock from '../../../pages/subscription/SubscriptionLock'; // Перевірте шлях до файлу

export default function SafetyFilters() {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🛡️ Безпека</h3>
      <SubscriptionLock 
        feature="safety_analysis"
        message="Детальний аналіз безпеки доступний з підпискою Pro"
      >
        <div className={styles.filterGroup}>
          <label className={styles.filterItem}>
            <span>Рівень злочинності:</span>
            <select className={styles.select}>
              <option value="any">Будь-який</option>
              <option value="low">Низький</option>
              <option value="medium">Середній</option>
              <option value="high">Високий</option>
            </select>
          </label>
          <label className={styles.filterItem}>
            <input type="checkbox" name="police" />
            <span>Відділки поліції</span>
          </label>
        </div>
      </SubscriptionLock>
    </div>
  );
}