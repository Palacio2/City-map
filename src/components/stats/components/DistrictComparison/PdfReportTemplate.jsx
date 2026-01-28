import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPhone, FaGlobe, FaBuilding } from 'react-icons/fa';
import { DISTRICT_CATEGORIES } from '@config/districtFields'; 
import { formatPrice, formatNumber, formatBool, getValue, formatRating } from '@utils/comparisonHelpers.jsx';
import styles from './PdfReportTemplate.module.css';

export default function PdfReportTemplate({ districts, customData, isPremium = true, isRealtor = true }) {
  const { t, i18n } = useTranslation('comparison');

  const sections = useMemo(() => {
    if (!districts?.length) return [];

    const staticSection = {
      title: t('finance_population'),
      rows: [
        { label: `${t('sale_label')} (${t('units.sqm', 'м²')})`, key: 'filterData.utilities.propertyPricePerSqm', format: (v, d) => formatPrice(v, d.country) },
        { label: t('rent_label'), key: 'filterData.general.average_rent_price', format: (v, d) => formatPrice(v, d.country) },
        { label: t('avg_salary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
        { label: t('population'), key: 'filterData.general.population', format: (v) => formatNumber(v) },
        { label: t('population_density'), key: 'filterData.general.populationDensity', format: (v) => formatNumber(v, ` ${t('units.people_sqkm', 'ос/км²')}`) },
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
        .map(field => {
            let formatter;
            switch (field.type) {
                case 'price': formatter = (v, d) => formatPrice(v, d.country); break;
                case 'boolean': formatter = (v) => formatBool(v, false, {}, t); break; 
                case 'rating_10': formatter = (v) => formatRating(v); break;
                case 'crimeLevel': formatter = (v) => formatNumber(v, '/100'); break;
                case 'text': 
                  formatter = (v) => v ? t(`levels.${v.toLowerCase()}`, { defaultValue: v }) : '-'; 
                  break; 
                case 'number': default: formatter = (v) => formatNumber(v); break;
            }

            if (field.key === 'avgParkSize') formatter = (v) => formatNumber(v, ` ${t('units.sqm', 'м²')}`);
            if (field.key === 'transportAvgDistance') formatter = (v) => formatNumber(v, ` ${t('units.m', 'м')}`);
            if (field.key === 'bikeLanes') formatter = (v) => formatNumber(v, ` ${t('units.km', 'км')}`);

            return {
                label: t(field.key), 
                key: `filterData.${category.key}.${field.key}`,
                format: formatter
            };
        });

      if (fields.length === 0) return null;

      return {
        title: t(category.key),
        rows: fields
      };
    }).filter(Boolean);

    return [staticSection, ...dynamicSections];
  }, [districts, t, isPremium, isRealtor]);

  if (!districts?.length) return null;

  return (
    <div id="pdf-report-template" className={styles.reportContainer}>
      <div className={styles.header}>
        <div className={styles.brandSection}>
          <div className={styles.logoPlaceholder} style={customData?.logo ? {background: 'transparent', padding: 0} : {}}>
            {customData?.logo ? (
                <img src={customData.logo} alt="Agency Logo" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
            ) : (
                <FaBuilding /> 
            )}
          </div>
          <div>
            <h1 className={styles.brandName}>{customData?.agencyName || 'GeoAnalyzer'}</h1>
            <p className={styles.reportDate}>{t('pdf_report.analytics_report', 'Analytics Report')} • {new Date().toLocaleDateString(i18n.language)}</p>
          </div>
        </div>
        <div className={styles.reportTitleBlock}>
          <p>{t('results_title')}</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.metricHeader}>{t('metric', 'Показник')}</th>
              {districts.map((d, i) => (
                <th key={d.id || i} className={styles.districtHeader}>
                  <div className={styles.dName}>{d.name}</div>
                  <div className={styles.dCity}>{d.city}, {d.country}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                <tr className={styles.sectionRow}>
                  <td colSpan={districts.length + 1}>
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row, rIdx) => (
                  <tr key={`${sIdx}-${rIdx}`} className={styles.dataRow}>
                    <td className={styles.labelCell}>{row.label}</td>
                    {districts.map((d, dIdx) => {
                      const val = getValue(d, row.key);
                      return (
                        <td key={dIdx} className={styles.valueCell}>
                          {row.format ? row.format(val, d) : (val ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          <span><FaGlobe /> {customData?.website || 'GeoAnalyzer.com'}</span>
          <span><FaPhone /> {customData?.phone || '+380 ...'}</span>
        </div>
        <div className={styles.disclaimer}>
          {t('pdf_report.prepared_by', 'Prepared by')} {customData?.agencyName || 'GeoAnalyzer'}. <br/> 
          {t('pdf_report.valid_as_of', 'Data valid as of')} {new Date().getFullYear()}.
        </div>
      </div>
    </div>
  );
}