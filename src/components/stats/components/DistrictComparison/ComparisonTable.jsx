import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt } from 'react-icons/fa';
// 👇 ВАЖЛИВО: Підключення конфігурації
import { DISTRICT_CATEGORIES } from '@config/districtFields'; 
import { formatPrice, formatNumber, formatRating, formatBool, formatLevel, getValue } from '@utils/comparisonHelpers.jsx';
import styles from './ComparisonTable.module.css';

export default function ComparisonTable({ districts }) {
  const { t } = useTranslation('comparison');

  if (!districts?.length) return null;

  const rows = useMemo(() => {
    // 1. Статична секція (загальні дані, які завжди повинні бути першими)
    const generalSection = [
      { type: 'header', title: t('finance_population') },
      { label: `${t('sale_label')} (${t('units.sqm', 'м²')})`, key: 'filterData.utilities.propertyPricePerSqm', format: (v, d) => formatPrice(v, d.country) },
      { label: t('rent_label'), key: 'filterData.general.average_rent_price', format: (v, d) => formatPrice(v, d.country) },
      { label: t('avg_salary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
      { label: t('population'), key: 'filterData.general.population', format: (v) => formatNumber(v) },
      { label: t('population_density'), key: 'filterData.general.populationDensity', format: (v) => formatNumber(v, ` ${t('units.people_sqkm', 'ос/км²')}`) },
      { label: t('unemployment'), key: 'filterData.general.unemploymentRate', format: (v) => formatNumber(v, '%') },
    ];

    // 2. Динамічні секції з districtFields.js
    const dynamicSections = Object.values(DISTRICT_CATEGORIES).flatMap(category => {
      const headerRow = { type: 'header', title: t(category.key) }; 
      
      const fieldRows = category.fields.map(field => {
        let formatter;
        
        switch (field.type) {
          case 'price':
            formatter = (v, d) => formatPrice(v, d.country);
            break;
          case 'rating_10':
            formatter = (v) => v ? <span className={styles.rating}>{formatRating(v)}</span> : '-';
            break;
          case 'boolean':
            formatter = (v) => formatBool(v, true, styles);
            break;
          case 'crimeLevel':
            formatter = (v) => formatNumber(v, '/100');
            break;
          case 'text':
            formatter = (v) => formatLevel(v, t);
            break;
          case 'number':
          default:
            formatter = (v) => formatNumber(v);
            break;
        }

        // Перевизначення одиниць виміру для специфічних полів
        if (field.key === 'avgParkSize' || field.key === 'transportAvgDistance') {
           formatter = (v) => formatNumber(v, ` ${t('units.m', 'м')}`);
           if (field.key === 'avgParkSize') formatter = (v) => formatNumber(v, ` ${t('units.sqm', 'м²')}`);
        }
        if (field.key === 'bikeLanes') {
           formatter = (v) => formatNumber(v, ` ${t('units.km', 'км')}`);
        }
        if (field.key === 'greenSpaces') {
           formatter = (v) => formatNumber(v, '%');
        }

        return {
          label: t(field.key), // Ключ перекладу береться з назви поля (напр. "schools")
          key: `filterData.${category.key}.${field.key}`,
          format: formatter
        };
      });

      return [headerRow, ...fieldRows];
    });

    return [...generalSection, ...dynamicSections];
  }, [districts, t]);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.metricCol}></th>
            {districts.map((d, i) => (
              <th key={d.id || i} className={styles.districtCol}>
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
                  <td colSpan={districts.length + 1}>{row.title}</td>
                </tr>
              );
            }
            return (
              <tr key={`r-${rowIdx}`} className={styles.dataRow}>
                <td className={styles.metricName}>{row.label}</td>
                {districts.map((d, colIdx) => {
                  const rawVal = getValue(d, row.key);
                  const displayVal = row.format ? row.format(rawVal, d) : (rawVal ?? '-');
                  return <td key={colIdx}>{displayVal}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}