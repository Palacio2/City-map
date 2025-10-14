import React from 'react';
import styles from './Filters.module.css';

export default function UtilitiesFilters() {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>💡 Комунальні послуги</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input type="checkbox" name="water" />
          <span>Водопостачання</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="heating" />
          <span>Опалення</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="electricity" />
          <span>Електропостачання</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="gas" />
          <span>Газопостачання</span>
        </label>
        <label className={styles.filterItem}>
          <input type="checkbox" name="waste" />
          <span>Вивіз сміття</span>
        </label>
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>Якість послуг:</span>
          <select className={styles.select}>
            <option value="any">Будь-яка</option>
            <option value="good">Висока</option>
            <option value="average">Середня</option>
            <option value="poor">Низька</option>
          </select>
        </div>
        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Вартість комуналки:</span>
          <div className={styles.rangeInputs}>
            <input 
              type="number" 
              placeholder="Від" 
              className={styles.rangeInput}
            />
            <span>-</span>
            <input 
              type="number" 
              placeholder="До" 
              className={styles.rangeInput}
            />
            <span>грн/м²</span>
          </div>
        </div>
      </div>
    </div>
  );
}