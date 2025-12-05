import React from 'react';
import styles from './Filters.module.css';

export default function TransportFilters({ filters = {}, onFiltersChange }) {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFiltersChange?.({
      transport: {
        ...filters.transport,
        [name]: checked
      }
    });
  };

  const handleDistanceChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      transport: {
        ...filters.transport,
        maxDistance: value ? parseInt(value) : undefined
      }
    });
  };

  const handleFrequencyChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      transport: {
        ...filters.transport,
        frequency: value
      }
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🚍 Транспорт</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="bus_stops" 
            checked={filters.transport?.bus_stops || false}
            onChange={handleCheckboxChange}
          />
          <span>Автобусні зупинки</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="tram_stops" 
            checked={filters.transport?.tram_stops || false}
            onChange={handleCheckboxChange}
          />
          <span>Трамвайні зупинки</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="metro" 
            checked={filters.transport?.metro || false}
            onChange={handleCheckboxChange}
          />
          <span>Станції метро</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="bike_lanes" 
            checked={filters.transport?.bike_lanes || false}
            onChange={handleCheckboxChange}
          />
          <span>Велосипедні доріжки</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="parking" 
            checked={filters.transport?.parking || false}
            onChange={handleCheckboxChange}
          />
          <span>Парковки</span>
        </label>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Відстань до транспорту:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="До" 
              className={styles.rangeInput}
              value={filters.transport?.maxDistance || ''}
              onChange={handleDistanceChange}
            />
            <span className={styles.rangeUnit}>метрів</span>
          </div>
        </div>
        
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>Частота транспорту:</span>
          <select 
            className={styles.select}
            value={filters.transport?.frequency || 'any'}
            onChange={handleFrequencyChange}
          >
            <option value="any">Будь-яка</option>
            <option value="high">Висока</option>
            <option value="medium">Середня</option>
            <option value="low">Низька</option>
          </select>
        </div>
      </div>
    </div>
  );
}