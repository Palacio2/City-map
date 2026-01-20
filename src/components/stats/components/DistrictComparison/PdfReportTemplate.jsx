import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaBuilding, FaPhone, FaGlobe } from 'react-icons/fa';
import styles from './PdfReportTemplate.module.css';

export default function PdfReportTemplate({ districts, customData }) {
  const { t } = useTranslation('comparison');

  if (!districts || districts.length === 0) return null;

  const getCurrencyCode = (countryName) => {
    if (!countryName) return 'USD';
    const lower = countryName.toLowerCase().trim();
    if (['ukraine', 'україна', 'ua'].includes(lower)) return 'UAH';
    if (['poland', 'polska', 'pl'].includes(lower)) return 'PLN';
    if (['uk', 'united kingdom'].includes(lower)) return 'GBP';
    return 'USD';
  };

  const formatPrice = (val, country) => {
    if (!val) return '-';
    try {
      return new Intl.NumberFormat('uk-UA', { 
        style: 'currency', currency: getCurrencyCode(country), maximumFractionDigits: 0 
      }).format(val);
    } catch { return `${val}`; }
  };

  const formatNumber = (val, unit = '') => (val !== null && val !== undefined) ? `${val}${unit}` : '-';
  const formatRating = (val) => val ? `${val}/10` : '-';
  const formatBool = (val) => val === true ? 'Так' : (val === false ? 'Ні' : '-');
  
  const getValue = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

  const sections = [
    {
      title: t('finance_population'),
      rows: [
        { label: t('rent_label'), key: 'filterData.general.rentalPrice', format: (v, d) => formatPrice(v, d.country) },
        { label: `${t('sale_label')} (m²)`, key: 'filterData.general.salePriceSqm', format: (v, d) => formatPrice(v, d.country) },
        { label: t('avg_salary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
        { label: t('population_density'), key: 'filterData.general.populationDensity', format: (v) => formatNumber(v, ' ос/км²') },
      ]
    },
    {
      title: t('education'),
      rows: [
        { label: t('rating'), key: 'filterData.education.rating', format: formatRating },
        { label: t('schools'), key: 'filterData.education.schools' },
        { label: t('kindergartens'), key: 'filterData.education.kindergartens' },
      ]
    },
    {
      title: t('safety'),
      rows: [
        { label: t('rating'), key: 'filterData.safety.rating', format: formatRating },
        { label: t('crime_level'), key: 'filterData.safety.crimeLevel', format: (v) => formatNumber(v, '/100') },
        { label: t('lighting'), key: 'filterData.safety.streetLighting', format: formatRating },
      ]
    },
    {
      title: t('transport'),
      rows: [
        { label: t('rating'), key: 'filterData.transport.rating', format: formatRating },
        { label: t('metro'), key: 'filterData.transport.metroStations' },
        { label: t('transport_dist'), key: 'filterData.transport.averageDistance', format: (v) => formatNumber(v, ' м') },
      ]
    },
    {
      title: t('social'),
      rows: [
        { label: t('rating'), key: 'filterData.social.rating', format: formatRating },
        { label: t('parks'), key: 'filterData.social.parks' },
        { label: t('cafes'), key: 'filterData.social.cafesRestaurants' },
      ]
    },
    {
      title: t('utilities'),
      rows: [
        { label: t('util_cost'), key: 'filterData.utilities.costPerSqm', format: (v, d) => formatPrice(v, d.country) + '/м²' },
        { label: t('heating'), key: 'filterData.utilities.hasHeating', format: formatBool },
      ]
    }
  ];

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
            <h1 className={styles.brandName}>{customData?.agencyName || 'PropLens Analytics'}</h1>
            <p className={styles.reportDate}>Analytics Report • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className={styles.reportTitleBlock}>
          <h2>{t('subtitle')}</h2>
          <p>{t('results_title')}</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.metricHeader}>{t('metric', 'Показник')}</th>
              {districts.map((d, i) => (
                <th key={i} className={styles.districtHeader}>
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
                          {row.format ? row.format(val, d) : (val || '-')}
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
          <span><FaGlobe /> {customData?.website || 'proplens.com'}</span>
          <span><FaPhone /> {customData?.phone || '+380 ...'}</span>
        </div>
        <div className={styles.disclaimer}>
          Prepared by {customData?.agencyName || 'PropLens'}. <br/> 
          Data valid as of {new Date().getFullYear()}.
        </div>
      </div>
    </div>
  );
}