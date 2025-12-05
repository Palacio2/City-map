import React from 'react';
import styles from './Filters.module.css';

export default function CommerceFilters({ filters = {}, onFiltersChange }) {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFiltersChange?.({
      commerce: {
        ...filters.commerce,
        [name]: checked
      }
    });
  };

  const handleDensityChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      commerce: {
        ...filters.commerce,
        density: value
      }
    });
  };

  const handleMinStoresChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      commerce: {
        ...filters.commerce,
        minGroceryStores: value ? parseInt(value) : undefined
      }
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🛒 Комерція та послуги</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="groceries" 
            checked={filters.commerce?.groceries || false}
            onChange={handleCheckboxChange}
          />
          <span>Продуктові магазини</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="construction" 
            checked={filters.commerce?.construction || false}
            onChange={handleCheckboxChange}
          />
          <span>Будівельні магазини</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="clothing" 
            checked={filters.commerce?.clothing || false}
            onChange={handleCheckboxChange}
          />
          <span>Магазини одягу</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="postOffices" 
            checked={filters.commerce?.postOffices || false}
            onChange={handleCheckboxChange}
          />
          <span>Поштові відділення</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="banks" 
            checked={filters.commerce?.banks || false}
            onChange={handleCheckboxChange}
          />
          <span>Банки та банкомати</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="beauty" 
            checked={filters.commerce?.beauty || false}
            onChange={handleCheckboxChange}
          />
          <span>Салони краси</span>
        </label>
        
        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. продуктових магазинів:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.commerce?.minGroceryStores || ''}
              onChange={handleMinStoresChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>шт.</span>
          </div>
        </div>

        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>Щільність магазинів:</span>
          <select 
            className={styles.select}
            value={filters.commerce?.density || 'any'}
            onChange={handleDensityChange}
          >
            <option value="any">Будь-яка</option>
            <option value="high">Висока</option>
            <option value="medium">Середня</option>
            <option value="low">Низька</option>
          </select>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. рейтинг комерції:</span>
          <div className={styles.rangeContainer}>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.5"
              value={filters.commerce?.minRating || 0}
              onChange={(e) => onFiltersChange?.({
                commerce: {
                  ...filters.commerce,
                  minRating: parseFloat(e.target.value)
                }
              })}
              className={styles.rangeSlider}
            />
            <span className={styles.rangeValue}>
              {filters.commerce?.minRating || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}