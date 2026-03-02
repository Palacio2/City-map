import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPhone, FaGlobe, FaBuilding, FaQuoteLeft, FaMapMarkerAlt } from 'react-icons/fa';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { getValue, formatPrice, formatNumber, formatBoolean, formatLevel } from '@utils/formatters.jsx';
import styles from './PdfReportTemplate.module.css';

const LOW_IS_BETTER = [
  'filterData.utilities.propertyPricePerSqm',
  'filterData.general.average_rent_price',
  'filterData.general.unemploymentRate',
  'filterData.safety.crimeLevel',
  'filterData.utilities.costPerSqm'
];

const getBestValue = (key, districts) => {
  const values = districts.map(d => getValue(d, key)).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return null;
  return LOW_IS_BETTER.includes(key) ? Math.min(...values) : Math.max(...values);
};

export default function PdfReportTemplate({ districts, customData, isPremium = true, isRealtor = true }) {
  const { t, i18n } = useTranslation(['comparison', 'common']);
  const { logo, agencyName = 'GeoAnalyzer', website = '', phone = '', comments } = customData || {};

  const sections = useMemo(() => {
    if (!districts?.length) return [];
    
    const staticSection = {
      title: t('common:categories.finance_population'),
      rows: [
        { label: t('common:fields.propertyPricePerSqm'), key: 'filterData.utilities.propertyPricePerSqm', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.average_rent_price'), key: 'filterData.general.average_rent_price', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.averageSalary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.population'), key: 'filterData.general.population', format: (v) => formatNumber(v) },
        { label: t('common:fields.unemploymentRate'), key: 'filterData.general.unemploymentRate', format: (v) => formatNumber(v, '%') },
      ]
    };

    const dynamicSections = Object.values(DISTRICT_CATEGORIES).map(category => {
      if (category.isPremium && !isPremium) return null;
      
      const fields = category.fields
        .filter(f => !f.isRealtorOnly || isRealtor)
        .map(f => {
          // Створюємо форматер аналогічно до ComparisonTable, щоб не було NaN
          let formatter = (v) => formatNumber(v);
          
          if (f.type === 'boolean') {
            formatter = (v) => formatBoolean(v, t, false);
          } else if (f.type === 'text') {
            formatter = (v) => formatLevel(v, t);
          } else if (f.key === 'greenSpaces') {
            formatter = (v) => formatNumber(v, '%');
          } else if (f.key === 'bikeLanes') {
            formatter = (v) => formatNumber(v, ` ${t('common:units.km')}`);
          } else if (f.key === 'avgParkSize' || f.key === 'transportAvgDistance') {
            const unit = f.key === 'avgParkSize' ? t('common:units.sqm') : t('common:units.m');
            formatter = (v) => formatNumber(v, ` ${unit}`);
          }

          return {
            label: t(`common:fields.${f.key}`),
            key: `filterData.${category.key}.${f.key}`,
            format: formatter
          };
        });
        
      return fields.length ? { title: t(`common:categories.${category.key}`), rows: fields } : null;
    }).filter(Boolean);

    return [staticSection, ...dynamicSections];
  }, [districts, t, isPremium, isRealtor]);

  if (!districts?.length) return null;

  return (
    <div id="pdf-report-template" className={styles.reportContainer}>
      <div className={styles.header}>
        <div className={styles.brandSection}>
          <div className={`${styles.logoPlaceholder} ${logo ? styles.hasLogo : ''}`}>
            {logo ? <img src={logo} alt="Logo" className={styles.logoImage} /> : <FaBuilding />}
          </div>
          <div>
            <h1 className={styles.brandName}>{agencyName}</h1>
            <p className={styles.reportDate}>{new Date().toLocaleDateString(i18n.language)}</p>
          </div>
        </div>
        <div className={styles.reportTitleBlock}><p>{t('pdf_report.analytics_report')}</p></div>
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
                  <div className={styles.dCity}><FaMapMarkerAlt style={{fontSize: '8px'}}/> {d.city}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sIdx) => (
              <React.Fragment key={`pdf-sec-${sIdx}`}>
                <tr className={styles.sectionRow}>
                  <td colSpan={districts.length + 1}>{section.title}</td>
                </tr>
                {section.rows.map((row, rIdx) => {
                  const bestValue = getBestValue(row.key, districts);
                  return (
                    <tr key={`pdf-row-${sIdx}-${rIdx}`} className={styles.dataRow}>
                      <td className={styles.labelCell}>{row.label}</td>
                      {districts.map((d, dIdx) => {
                        const rawVal = getValue(d, row.key);
                        const isWinner = typeof rawVal === 'number' && !isNaN(rawVal) && rawVal === bestValue;
                        return (
                          <td key={`pdf-cell-${dIdx}`} className={`${styles.valueCell} ${isWinner ? styles.winnerCell : ''}`}>
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
          {t('pdf_report.prepared_by')} <strong>{agencyName}</strong>. {new Date().getFullYear()}.
        </div>
      </div>
    </div>
  );
}