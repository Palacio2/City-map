import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPhone, FaGlobe, FaBuilding, FaQuoteLeft, FaMapMarkerAlt } from 'react-icons/fa';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { getValue, formatPrice, formatNumber, formatBoolean, formatLevel } from '@utils/formatters.jsx';
import styles from './PdfReportTemplate.module.css';

const DEFAULTS = {
  AGENCY_NAME: 'GeoAnalyzer',
  WEBSITE: 'GeoAnalyzer.com',
  PHONE: '+380 00 000 0000',
  LOGO_ALT: 'Agency Logo'
};

const LOW_IS_BETTER = [
  'filterData.utilities.propertyPricePerSqm',
  'filterData.general.average_rent_price',
  'filterData.general.unemploymentRate',
  'filterData.safety.crimeLevel',
  'filterData.utilities.costPerSqm'
];

const getFieldFormatter = (field, t) => {
  if (field.key === 'avgParkSize') return (v) => formatNumber(v, ` ${t('common:units.sqm')}`);
  if (field.key === 'transportAvgDistance') return (v) => formatNumber(v, ` ${t('common:units.m')}`);
  if (field.key === 'bikeLanes') return (v) => formatNumber(v, ` ${t('common:units.km')}`);

  switch (field.type) {
    case 'price': return (v, d) => formatPrice(v, d.country);
    case 'boolean': return (v) => formatBoolean(v, t, false);
    case 'rating_10': return (v) => v ? v.toFixed(1) : '-';
    case 'crimeLevel': return (v) => formatNumber(v) + '/10';
    case 'text': return (v) => formatLevel(v, t);
    case 'number': 
    default: return (v) => formatNumber(v);
  }
};

const getBestValue = (key, districts) => {
  const values = districts
    .map(d => getValue(d, key))
    .filter(v => typeof v === 'number' && !isNaN(v));

  if (values.length === 0) return null;

  if (LOW_IS_BETTER.includes(key)) {
    return Math.min(...values);
  }
  return Math.max(...values);
};

export default function PdfReportTemplate({ districts, customData, isPremium = true, isRealtor = true }) {
  const { t, i18n } = useTranslation(['comparison', 'common']);

  const sections = useMemo(() => {
    if (!districts?.length) return [];

    const staticSection = {
      title: t('common:categories.finance_population'),
      rows: [
        { label: `${t('common:fields.propertyPricePerSqm')} (${t('common:units.sqm')})`, key: 'filterData.utilities.propertyPricePerSqm', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.average_rent_price'), key: 'filterData.general.average_rent_price', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.averageSalary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.population'), key: 'filterData.general.population', format: (v) => formatNumber(v) },
        { label: t('common:fields.unemploymentRate'), key: 'filterData.general.unemploymentRate', format: (v) => formatNumber(v, '%') },
      ]
    };

    const dynamicSections = Object.values(DISTRICT_CATEGORIES).map(category => {
      if (category.isPremium && !isPremium) return null;

      const fields = category.fields
        .filter(field => {
          if (field.isPremiumField && !isPremium) return false;
          if (field.isRealtorOnly && !isRealtor) return false;
          return true;
        })
        .map(field => ({
          label: t(`common:fields.${field.key}`),
          key: `filterData.${category.key}.${field.key}`,
          format: getFieldFormatter(field, t)
        }));

      if (fields.length === 0) return null;

      return { title: t(`common:categories.${category.key}`), rows: fields };
    }).filter(Boolean);

    return [staticSection, ...dynamicSections];
  }, [districts, t, isPremium, isRealtor]);

  if (!districts?.length) return null;

  const { 
    logo, 
    agencyName = DEFAULTS.AGENCY_NAME, 
    website = DEFAULTS.WEBSITE, 
    phone = DEFAULTS.PHONE, 
    comments 
  } = customData || {};

  return (
    <div id="pdf-report-template" className={styles.reportContainer}>
      <div className={styles.header}>
        <div className={styles.brandSection}>
          <div className={`${styles.logoPlaceholder} ${logo ? styles.hasLogo : ''}`}>
            {logo ? (
              <img src={logo} alt={DEFAULTS.LOGO_ALT} className={styles.logoImage} />
            ) : (
              <FaBuilding />
            )}
          </div>
          <div>
            <h1 className={styles.brandName}>{agencyName}</h1>
            <p className={styles.reportDate}>{new Date().toLocaleDateString(i18n.language)}</p>
          </div>
        </div>
        <div className={styles.reportTitleBlock}>
          <p>{t('results_title')}</p>
        </div>
      </div>

      {comments && (
        <div className={styles.commentsSection}>
          <h3><FaQuoteLeft size={12} /> {t('pdf_report.analyst_notes')}</h3>
          <p>{comments}</p>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.metricHeader}>{t('metric')}</th>
              {districts.map((d, i) => (
                <th key={d.id || i} className={styles.districtHeader}>
                  <div className={styles.dName}>{d.name}</div>
                  <div className={styles.dCity}>
                     <FaMapMarkerAlt style={{fontSize: '8px', marginRight: '3px'}}/> 
                     {d.city}, {d.country}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                <tr className={styles.sectionRow}>
                  <td colSpan={districts.length + 1}>{section.title}</td>
                </tr>
                {section.rows.map((row, rIdx) => {
                  const bestValue = getBestValue(row.key, districts);
                  
                  return (
                    <tr key={`${sIdx}-${rIdx}`} className={styles.dataRow}>
                      <td className={styles.labelCell}>{row.label}</td>
                      {districts.map((d, dIdx) => {
                        const rawVal = getValue(d, row.key);
                        const isWinner = typeof rawVal === 'number' && rawVal === bestValue;
                        
                        return (
                          <td key={dIdx} className={`${styles.valueCell} ${isWinner ? styles.winnerCell : ''}`}>
                            {row.format ? row.format(rawVal, d) : (rawVal ?? '-')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          {website && <span><FaGlobe /> {website}</span>}
          {phone && <span><FaPhone /> {phone}</span>}
        </div>
        <div className={styles.disclaimer}>
          {t('pdf_report.prepared_by')} <strong>{agencyName}</strong>. <br/>
          {t('pdf_report.valid_as_of')} {new Date().getFullYear()}.
        </div>
      </div>
    </div>
  );
}