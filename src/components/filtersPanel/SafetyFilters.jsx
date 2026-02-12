import React, { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaChevronDown } from 'react-icons/fa';
import styles from './Filters.module.css';
import { DISTRICT_CATEGORIES } from '@config/districtFields';

const SafetyFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation(['filters', 'common']);
  const config = DISTRICT_CATEGORIES.safety;
  const [isOpen, setIsOpen] = useState(false);

  const checkboxFilters = useMemo(() => {
    return config.fields
      .filter(f => f.key !== 'crimeLevel')
      .map(f => ({
        name: f.key
      }));
  }, [config]);

  const handleCrimeLevelChange = (event) => {
    onChange?.({ crimeLevel: event.target.value });
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  const activeCount = (values.crimeLevel && values.crimeLevel !== 'any' ? 1 : 0) +
    checkboxFilters.filter(f => values[f.name]).length;

  return (
    <div className={`${styles.section} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles.sectionHeader} 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className={styles.headerTitle}>
          <span className={styles.sectionIcon}><FaShieldAlt /></span>
          {t('common:categories.safety')}
          {activeCount > 0 && (
             <span className={styles.activeBadge}>{activeCount}</span>
          )}
        </div>
        <FaChevronDown className={styles.chevron} />
      </button>
      
      {isOpen && (
        <div className={styles.filterGroup}>
          <div className={styles.ratingFilter}>
            <span className={styles.ratingLabel}>
              {t('common:fields.crimeLevel')}
            </span>
            <select 
              className={styles.select}
              value={values.crimeLevel || 'any'}
              onChange={handleCrimeLevelChange}
            >
              <option value="any">{t('filters:filter.options.any')}</option>
              <option value="low">{t('common:enums.low')}</option>
              <option value="medium">{t('common:enums.medium')}</option>
              <option value="high">{t('common:enums.high')}</option>
            </select>
          </div>
          
          {checkboxFilters.map((filter) => (
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

export default SafetyFilters;