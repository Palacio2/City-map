import React from 'react';
import styles from './Filters.module.css';

export default function UtilitiesFilters({ filters = {}, onFiltersChange }) {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFiltersChange?.({
      utilities: {
        ...filters.utilities,
        [name]: checked
      }
    });
  };

  const handleQualityChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      utilities: {
        ...filters.utilities,
        quality: value
      }
    });
  };

  const handleMinCostChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      utilities: {
        ...filters.utilities,
        minCost: value ? parseInt(value) : undefined
      }
    });
  };

  const handleMaxCostChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      utilities: {
        ...filters.utilities,
        maxCost: value ? parseInt(value) : undefined
      }
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>💡 Комунальні послуги</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="water" 
            checked={filters.utilities?.water || false}
            onChange={handleCheckboxChange}
          />
          <span>Водопостачання</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="heating" 
            checked={filters.utilities?.heating || false}
            onChange={handleCheckboxChange}
          />
          <span>Опалення</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="electricity" 
            checked={filters.utilities?.electricity || false}
            onChange={handleCheckboxChange}
          />
          <span>Електропостачання</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="gas" 
            checked={filters.utilities?.gas || false}
            onChange={handleCheckboxChange}
          />
          <span>Газопостачання</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="waste" 
            checked={filters.utilities?.waste || false}
            onChange={handleCheckboxChange}
          />
          <span>Вивіз сміття</span>
        </label>
        
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>Якість послуг:</span>
          <select 
            className={styles.select}
            value={filters.utilities?.quality || 'any'}
            onChange={handleQualityChange}
          >
            <option value="any">Будь-яка</option>
            <option value="good">Висока</option>
            <option value="average">Середня</option>
            <option value="poor">Низька</option>
          </select>
        </div>
        
        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Вартість комуналки (грн/м²):</span>
          <div className={styles.doubleRangeContainer}>
            <div className={styles.doubleRangeInputs}>
              <input 
                type="number" 
                placeholder="Від"
                value={filters.utilities?.minCost || ''}
                onChange={handleMinCostChange}
                className={styles.doubleRangeInput}
              />
              <span className={styles.doubleRangeSeparator}>-</span>
              <input 
                type="number" 
                placeholder="До"
                value={filters.utilities?.maxCost || ''}
                onChange={handleMaxCostChange}
                className={styles.doubleRangeInput}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}