import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const SocialFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('social.title')}</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="parks" 
            checked={values.parks || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.parks')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cafes" 
            checked={values.cafes || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.cafes')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="playgrounds" 
            checked={values.playgrounds || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.playgrounds')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="sports" 
            checked={values.sports || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.sports')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="libraries" 
            checked={values.libraries || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.libraries')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cinemas" 
            checked={values.cinemas || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.cinemas')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="theaters" 
            checked={values.theaters || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.theaters')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="museums" 
            checked={values.museums || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.museums')}</span>
        </label>
      </div>
    </div>
  );
});

export default SocialFilters;