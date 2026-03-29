import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { DISTRICT_CATEGORIES } from '@config/districtFields'; 
import { getValue, formatPrice, formatNumber, formatBoolean, formatLevel, renderRating } from '@utils/formatters.jsx';

export default function ComparisonTable({ districts }) {
  const { t } = useTranslation(['db', 'common']);

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
          case 'price': formatter = (v, d) => formatPrice(v, d.country); break;
          case 'rating_10': formatter = (v) => v ? <span className="font-bold text-accent">{renderRating(v)}</span> : '-'; break;
          case 'boolean': formatter = (v) => formatBoolean(v, t, true, { booleanTrue: 'text-success font-bold', booleanFalse: 'text-textSecondary opacity-50' }); break;
          case 'crimeLevel': formatter = (v) => formatNumber(v) + '/10'; break;
          case 'text': formatter = (v) => formatLevel(v, t); break;
          case 'number': default: formatter = (v) => formatNumber(v); break;
        }

        if (field.key === 'avgParkSize' || field.key === 'transportAvgDistance') {
           formatter = (v) => formatNumber(v, ` ${t('common:units.m')}`);
           if (field.key === 'avgParkSize') formatter = (v) => formatNumber(v, ` ${t('common:units.sqm')}`);
        }
        if (field.key === 'bikeLanes') formatter = (v) => formatNumber(v, ` ${t('common:units.km')}`);
        if (field.key === 'greenSpaces') formatter = (v) => formatNumber(v, '%');

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
    <div className="bg-surface rounded-xl shadow-card border border-borderClient overflow-x-auto relative mb-6 md:rounded-lg md:border-x-0">
      <table className="w-full border-separate border-spacing-0 min-w-[600px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface border-r border-b border-borderClient text-left min-w-[140px] max-w-[140px] md:min-w-[200px] md:max-w-[250px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] p-3 md:p-4 align-middle"></th>
            {districts.map((d) => (
              <th key={d.id || d.name} className="p-3 md:p-4 border-b border-borderClient text-center align-middle bg-surface">
                <div className="flex flex-col gap-1 items-center min-w-[140px]">
                  <span className="font-heading font-bold text-[0.95rem] md:text-[1.1rem] text-textMain whitespace-normal">{d.name}</span>
                  <span className="text-[0.8rem] text-textSecondary flex items-center gap-1"><FaMapMarkerAlt /> {d.city}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const rowKey = row.type === 'header' 
              ? `header-${idx}-${row.title}` 
              : `row-${idx}-${row.key}`;

            if (row.type === 'header') {
              return (
                <tr key={rowKey} className="group">
                  <td className="sticky left-0 z-10 bg-body border-r border-b border-borderClient text-left min-w-[140px] max-w-[140px] md:min-w-[200px] md:max-w-[250px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-accent font-heading font-bold uppercase tracking-widest px-4 py-3 text-[0.85rem]">{row.title}</td>
                  {districts.map((d, dIdx) => (
                    <td key={`spacer-${dIdx}`} className="bg-body border-b border-borderClient"></td>
                  ))}
                </tr>
              );
            }

            return (
              <tr key={rowKey} className="group hover:bg-hover transition-colors">
                <td className="sticky left-0 z-10 bg-surface border-r border-b border-borderClient text-left min-w-[140px] max-w-[140px] md:min-w-[200px] md:max-w-[250px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-semibold text-textSecondary text-[0.9rem] p-3 md:p-4 align-middle group-hover:bg-hover transition-colors">{row.label}</td>
                {districts.map((d, dIdx) => {
                  const rawVal = getValue(d, row.key);
                  const displayVal = row.format ? row.format(rawVal, d) : (rawVal ?? '-');
                  return (
                    <td key={`cell-${dIdx}`} className="p-3 md:p-4 border-b border-borderClient text-center align-middle text-[0.85rem] md:text-base">
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ); 
}