import React from 'react';
import styles from './Filters.module.css';

const FilterSlider = ({ label, value, onChange, min, max, step }) => (
  <div className={styles.sliderContainer}>
    <label className={styles.sliderLabel}>
      {label}: <strong>{value}</strong>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className={styles.slider}
    />
  </div>
);

export default FilterSlider;
