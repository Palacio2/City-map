import React from 'react';
import styles from './Filters.module.css';
import SubscriptionLock from '../../../pages/subscription/SubscriptionLock'; // Перевірте шлях до файлу

export default function TransportFilters() {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🚍 Транспорт</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input type="checkbox" name="bus_stops" />
          <span>Автобусні зупинки</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="tram_stops" />
          <span>Трамвайні зупинки</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="metro" />
          <span>Станції метро</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="bike_lanes" />
          <span>Велосипедні доріжки</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="parking" />
          <span>Парковки</span>
        </label>
      </div>

      <SubscriptionLock
        feature="transport_realtime"
        message="Детальні фільтри транспорту доступні з підпискою Premium"
      >
        <div className={styles.filterGroup}>
          <div className={styles.rangeFilter}>
            <span className={styles.rangeLabel}>Відстань до транспорту:</span>
            <div className={styles.rangeInputs}>
              <input 
                type="number" 
                placeholder="До" 
                className={styles.rangeInput}
              />
              <span>метрів</span>
            </div>
          </div>
          <div className={styles.ratingFilter}>
            <span className={styles.ratingLabel}>Частота транспорту:</span>
            <select className={styles.select}>
              <option value="any">Будь-яка</option>
              <option value="high">Висока</option>
              <option value="medium">Середня</option>
            </select>
          </div>
        </div>
      </SubscriptionLock>
    </div>
  );
}