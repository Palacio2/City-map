import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DistrictPdfTemplate.module.css';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { 
  formatNumber, 
  formatPrice, 
  formatBoolean, 
  getCrimeLevelText 
} from '@utils/formatters';

const StatRow = ({ label, value, highlight = false, className = '' }) => (
  <div className={`${styles.statRow} ${highlight ? styles.highlight : ''} ${className}`}>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue}>{value}</span>
  </div>
);

const Section = ({ categoryConfig, data, t, formatValue, isRealtor }) => {
  if (!data) return null;

  return (
    <div className={styles.categorySection}>
      <div className={styles.categoryHeader}>
        <span className={styles.categoryIcon}>{categoryConfig.icon}</span>
        <h3 className={styles.categoryTitle}>{t(`categories.${categoryConfig.key}`)}</h3>
        <span className={styles.categoryRating}>
           {(data.rating || data.qualityRating || 0).toFixed(1)}
        </span>
      </div>
      <div className={styles.categoryContent}>
        {categoryConfig.fields.map(field => {
           if (field.isRealtorOnly && !isRealtor) return null;

           const val = data[field.key];
           if (val === null || val === undefined) return null;

           return (
             <StatRow 
               key={field.key}
               label={t(`fields.${field.key}`)}
               value={formatValue(val, field.type)}
             />
           );
        })}
      </div>
    </div>
  );
};

export default function DistrictPdfTemplate({ 
  district, 
  currencyInfo, 
  formatNumber, 
  formatPrice,
  isRealtor 
}) {
  const { t } = useTranslation('districts');

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '-';

    if (type === 'price') return formatPrice(value, currencyInfo);
    
    if (type === 'boolean') {
        return value ? t('enums.yes') : t('enums.no');
    }
    
    if (type === 'crimeLevel') {
        const labelKey = getCrimeLevelText(value);
        return t(labelKey);
    }

    if (type === 'number') return formatNumber(value);

    if (type === 'text') {
        const translationKey = `values.${value}`;
        const translated = t(translationKey);
        return translated !== translationKey ? translated : value;
    }

    return value;
  };

  if (!district) return null;

  const { name, photo_url, filterData } = district;
  const safeCurrencyInfo = currencyInfo || { code: 'UAH', locale: 'uk-UA' };

  const categories = Object.values(DISTRICT_CATEGORIES);
  const midPoint = Math.ceil(categories.length / 2);
  const leftColumn = categories.slice(0, midPoint);
  const rightColumn = categories.slice(midPoint);

  return (
    <div className={styles.pdfContainer}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
           <h1 className={styles.districtName}>{name}</h1>
           <p className={styles.reportDate}>
             {t('pdf.report_date')}: {new Date().toLocaleDateString('uk-UA')}
           </p>
        </div>
        <div className={styles.logo}>
           <span>GeoAnalyzer</span>
        </div>
      </div>

      <div className={styles.heroSection}>
        {photo_url && (
          <div className={styles.mainPhoto} style={{ backgroundImage: `url(${photo_url})` }} />
        )}
        
        {filterData?.general && isRealtor && (
          <div className={styles.quickStatsCard}>
             <h3 className={styles.quickStatsTitle}>{t('pdf.general_info')}</h3>
             <div className={styles.quickStatsList}>
                <StatRow 
                  label={t('details.population')} 
                  value={formatNumber(filterData.general.population)} 
                  highlight 
                />
                <StatRow 
                  label={t('details.salary')} 
                  value={formatPrice(filterData.general.averageSalary, safeCurrencyInfo)} 
                  highlight 
                />
                <StatRow 
                  label={t('details.unemployment')} 
                  value={filterData.general.unemploymentRate ? `${filterData.general.unemploymentRate}%` : '-'} 
                />
                <StatRow 
                  label={t('details.price')} 
                  value={formatPrice(filterData.general.propertyPrice, safeCurrencyInfo)} 
                />
                <StatRow 
                  label={t('pdf.rent')} 
                  value={formatPrice(filterData.general.average_rent_price, safeCurrencyInfo)} 
                />
             </div>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.masonryGrid}>
         <div className={styles.column}>
            {leftColumn.map(cat => (
                <Section 
                    key={cat.key} 
                    categoryConfig={cat} 
                    data={filterData?.[cat.key]} 
                    t={t}
                    formatValue={formatValue}
                    isRealtor={isRealtor}
                />
            ))}
         </div>
         <div className={styles.column}>
            {rightColumn.map(cat => (
                <Section 
                    key={cat.key} 
                    categoryConfig={cat} 
                    data={filterData?.[cat.key]} 
                    t={t}
                    formatValue={formatValue}
                    isRealtor={isRealtor}
                />
            ))}
         </div>
      </div>

      <div className={styles.footer}>
        <p>{t('pdf.generated_auto')} <strong>GeoAnalyzer</strong></p>
      </div>
    </div>
  );
}