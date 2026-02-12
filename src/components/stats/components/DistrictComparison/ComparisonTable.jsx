import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { DISTRICT_CATEGORIES } from '@config/districtFields'; 
import { getValue } from '@utils/comparisonHelpers.jsx';
import { formatPrice, formatNumber, formatBoolean, formatLevel, renderRating } from '@utils/formatters.jsx';
import styles from './ComparisonTable.module.css';

export default function ComparisonTable({ districts }) {
  const { t } = useTranslation(['comparison', 'common']);

  const rows = useMemo(() => {
    if (!districts?.length) return [];

    const generalSection = [
      { type: 'header', title: t('common:categories.finance_population') },
      { label: `${t('common:fields.propertyPricePerSqm')} (${t('common:units.sqm')})`, key: 'filterData.utilities.propertyPricePerSqm', format: (v, d) => formatPrice(v, d.country) },
      { label: t('common:fields.average_rent_price'), key: 'filterData.general.average_rent_price', format: (v, d) => formatPrice(v, d.country) },
      { label: t('common:fields.averageSalary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
      { label: t('common:fields.population'), key: 'filterData.general.population', format: (v) => formatNumber(v) },
      { label: t('common:fields.unemploymentRate'), key: 'filterData.general.unemploymentRate', format: (v) => formatNumber(v) + '%' },
    ];

    const dynamicSections = Object.values(DISTRICT_CATEGORIES).flatMap(category => {
      const headerRow = { type: 'header', title: t(`common:categories.${category.key}`) }; 
      
      const fieldRows = category.fields.map(field => {
        let formatter;
        
        switch (field.type) {
          case 'price':
            formatter = (v, d) => formatPrice(v, d.country);
            break;
          case 'rating_10':
            formatter = (v) => v ? <span className={styles.rating}>{renderRating(v)}</span> : '-';
            break;
          case 'boolean':
            formatter = (v) => formatBoolean(v, t, true, styles);
            break;
          case 'crimeLevel':
            formatter = (v) => formatNumber(v) + '/10';
            break;
          case 'text':
            formatter = (v) => formatLevel(v, t);
            break;
          case 'number':
          default:
            formatter = (v) => formatNumber(v);
            break;
        }

        if (field.key === 'avgParkSize' || field.key === 'transportAvgDistance') {
           formatter = (v) => formatNumber(v, ` ${t('common:units.m')}`);
           if (field.key === 'avgParkSize') formatter = (v) => formatNumber(v, ` ${t('common:units.sqm')}`);
        }
        if (field.key === 'bikeLanes') {
           formatter = (v) => formatNumber(v, ` ${t('common:units.km')}`);
        }
        if (field.key === 'greenSpaces') {
           formatter = (v) => formatNumber(v, '%');
        }

        return {
          label: t(`common:fields.${field.key}`),
          key: `filterData.${category.key}.${field.key}`,
          format: formatter
        };
      });

      return [headerRow, ...fieldRows];
    });

    return [...generalSection, ...dynamicSections];
  }, [districts, t]);

  if (!districts?.length) return null;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.th} ${styles.firstCol}`}></th>
            {districts.map((d, i) => (
              <th key={d.id || i} className={styles.th}>
                <div className={styles.districtHeader}>
                  <span className={styles.dName}>{d.name}</span>
                  <span className={styles.dCity}><FaMapMarkerAlt /> {d.city}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            if (row.type === 'header') {
              return (
                <tr key={`h-${rowIdx}`} className={styles.sectionHeader}>
                  <td className={`${styles.td} ${styles.firstCol}`}>{row.title}</td>
                  {districts.map((_, i) => <td key={i} className={styles.headerSpacer}></td>)}
                </tr>
              );
            }
            return (
              <tr key={`r-${rowIdx}`} className={styles.dataRow}>
                <td className={`${styles.td} ${styles.firstCol} ${styles.metricName}`}>{row.label}</td>
                {districts.map((d, colIdx) => {
                  const rawVal = getValue(d, row.key);
                  const displayVal = row.format ? row.format(rawVal, d) : (rawVal ?? '-');
                  return <td key={colIdx} className={styles.td}>{displayVal}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}