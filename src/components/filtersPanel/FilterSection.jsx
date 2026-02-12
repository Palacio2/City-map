import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';
import { 
  FaBus, FaHospital, FaShoppingCart, FaSchool, 
  FaTree, FaBolt, FaShieldAlt, FaChevronDown 
} from 'react-icons/fa';

const ICONS = {
  transport: <FaBus />,
  medicine: <FaHospital />,
  commerce: <FaShoppingCart />,
  education: <FaSchool />,
  social: <FaTree />,
  safety: <FaShieldAlt />,
  utilities: <FaBolt />
};

const FilterSection = memo(({ categoryKey, filters = [], values = {}, onChange }) => {
  const { t } = useTranslation(['filters', 'common']);
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  const handleToggle = () => setIsOpen(!isOpen);

  const activeCount = filters.filter(f => values[f.name]).length;

  return (
    <div className={`${styles.section} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles.sectionHeader} 
        onClick={handleToggle}
        type="button"
      >
        <div className={styles.headerTitle}>
          <span className={styles.sectionIcon}>{ICONS[categoryKey]}</span>
          {t(`common:categories.${categoryKey}`)}
          {activeCount > 0 && (
            <span className={styles.activeBadge}>{activeCount}</span>
          )}
        </div>
        <FaChevronDown className={styles.chevron} />
      </button>

      {isOpen && (
        <div className={styles.filterGroup}>
          {filters.map((filter) => (
            <label className={styles.filterItem} key={filter.name}>
              <input
                type="checkbox"
                name={filter.name}
                checked={values[filter.name] || false}
                onChange={handleCheckboxChange}
              />
              <span>{t(`common:fields.${filter.name}`)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
});

export default FilterSection;