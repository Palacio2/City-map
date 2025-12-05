import React from 'react';
import styles from './Filters.module.css';

const FilterCheckbox = ({ label, checked, onChange }) => (
  <label className={styles.checkboxLabel}>
    <input type="checkbox" checked={checked} onChange={onChange} className={styles.checkbox} />
    <span className={styles.checkboxCustom}></span>
    {label}
  </label>
);

export default FilterCheckbox;
