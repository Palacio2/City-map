import React from 'react';
import styles from './Filters.module.css';

export default function SafetyFilters({ filters = {}, onFiltersChange }) {
  const handleCrimeLevelChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      safety: {
        ...filters.safety,
        crimeLevel: value
      }
    });
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFiltersChange?.({
      safety: {
        ...filters.safety,
        [name]: checked
      }
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🛡️ Безпека</h3>
      <div className={styles.filterGroup}>
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>Рівень злочинності:</span>
          <select 
            className={styles.select}
            value={filters.safety?.crimeLevel || 'any'}
            onChange={handleCrimeLevelChange}
          >
            <option value="any">Будь-який</option>
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
          </select>
        </div>
        
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="police" 
            checked={filters.safety?.police || false}
            onChange={handleCheckboxChange}
          />
          <span>Відділки поліції</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cctv" 
            checked={filters.safety?.cctv || false}
            onChange={handleCheckboxChange}
          />
          <span>Камери спостереження</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="lighting" 
            checked={filters.safety?.lighting || false}
            onChange={handleCheckboxChange}
          />
          <span>Нічне освітлення</span>
        </label>
      </div>
    </div>
  );
}