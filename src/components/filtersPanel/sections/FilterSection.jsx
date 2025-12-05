import React, { useState } from 'react';
import styles from './Filters.module.css';

const FilterSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.filterSection}>
      <button className={styles.sectionHeader} onClick={() => setIsOpen(!isOpen)}>
        <h4 className={styles.sectionTitle}>{title}</h4>
        <span className={`${styles.chevron} ${isOpen ? styles.open : ''}`}></span>
      </button>
      {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
};

export default FilterSection;
