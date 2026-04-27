import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStar } from 'react-icons/fa';
import { DynamicDistrictConfig } from '@config/districtFields'; 
import { getValue, formatPrice, formatNumber } from '@utils/formatters';
import { TransformedDistrict } from '@utils/dataTransformers';

const safeStringify = (val: unknown): string => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val.toString();
  return '-';
};

const FormattedRating = ({ value }: { value: unknown }) => {
  if (!value) return <>{'-'}</>;
  return (
    <span className="flex items-center justify-center gap-1 font-bold text-accent">
      {Number(value).toFixed(1)} <FaStar className="text-xs" />
    </span>
  );
};

interface RowDef {
  type?: 'header';
  title?: string;
  label?: string;
  key?: string;
  format?: (v: unknown, d: TransformedDistrict) => React.ReactNode;
}

const buildCategoryRows = (catKey: string, categoryConfig: any, t: any): RowDef[] => {
  const catName = t([`common.categories.${catKey}`, catKey], { defaultValue: catKey });
  const catHeader: RowDef = {
    type: 'header',
    title: catName,
    key: `header-${catKey}`
  };

  const ratingRow: RowDef = {
    label: t(['stats.comparison.rating', 'rating'], { defaultValue: 'Rating' }),
    key: `filterData.${catKey}.rating`,
    format: (val) => <FormattedRating value={val} />
  };

  const fieldRows: RowDef[] = categoryConfig.fields.map((f: any) => {
    const baseKey = f.key || '';
    const withCount = baseKey.endsWith('_count') ? baseKey : `${baseKey}_count`;
    const withoutCount = baseKey.replace('_count', '');

    return {
      label: t([
        `common.fields.${baseKey}`,
        baseKey,
        `common.fields.${withCount}`,
        withCount,
        `common.fields.${withoutCount}`,
        withoutCount
      ], { defaultValue: withoutCount }),
      key: `filterData.${catKey}.fields.${f.key}.value`,
      format: (val: any) => {
        if (val === null || val === undefined) return '-';
        if (f.type === 'boolean') {
            if (typeof val === 'number') return formatNumber(val);
            return val ? t('common.status.yes') : t('common.status.no');
        }
        if (f.type === 'price') return formatPrice(val);
        if (f.type === 'number' || f.type === 'numeric') return formatNumber(val);
        return safeStringify(val);
      }
    };
  });

  return [catHeader, ratingRow, ...fieldRows];
};

interface ComparisonTableProps {
  readonly districts: TransformedDistrict[];
  readonly config: DynamicDistrictConfig | null;
}

export default function ComparisonTable({ districts, config }: ComparisonTableProps) {
  const { t } = useTranslation('db');

  const rows = useMemo(() => {
    if (!districts.length) return [];
    
    const baseRows: RowDef[] = [
      {
        label: t(['common.fields.propertyPricePerSqm', 'propertyPricePerSqm'], { defaultValue: 'propertyPricePerSqm' }),
        key: 'filterData.general.propertyPrice',
        format: (val) => formatPrice(val as string | number | null)
      },
      {
        label: t(['common.fields.average_rent_price', 'average_rent_price'], { defaultValue: 'average_rent_price' }),
        key: 'filterData.general.average_rent_price',
        format: (val) => formatPrice(val as string | number | null)
      },
      {
        label: t(['common.fields.population', 'population'], { defaultValue: 'population' }),
        key: 'filterData.general.population',
        format: (val) => formatNumber(val as string | number | null)
      },
    ];

    if (!config) return baseRows;

    const categoryRows = Object.values(config).flatMap(cat => 
      buildCategoryRows(cat.key, cat, t)
    );

    return [...baseRows, ...categoryRows];
  }, [districts, config, t]);

  if (!districts.length) return null;

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-4">
      <table className="w-full min-w-[600px] border-collapse bg-surface rounded-xl overflow-hidden shadow-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 bg-surface border-r border-b border-borderClient p-4 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[140px] md:w-[200px]"></th>
            {districts.map((d, idx) => (
              <th key={`th-${d.id || idx}`} className="p-4 border-b border-borderClient bg-surface text-center font-heading text-[1rem] md:text-[1.1rem] text-textMain min-w-[150px] md:min-w-[180px] relative">
                {idx > 0 && <div className="absolute left-0 top-4 bottom-4 w-px bg-borderClient/50" />}
                {d.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const rowKey = row.key || `header-${idx}`;
            if (row.type === 'header') {
              return (
                <tr key={rowKey} className="bg-body border-b border-borderClient">
                  <td colSpan={districts.length + 1} className="p-3 md:p-4 text-left font-heading font-bold text-textMain text-[0.95rem] md:text-[1.05rem] uppercase tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    {row.title}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={rowKey} className="group hover:bg-hover transition-colors">
                <td className="sticky left-0 z-10 bg-surface border-r border-b border-borderClient text-left min-w-[140px] max-w-[140px] md:min-w-[200px] md:max-w-[250px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-semibold text-textSecondary text-[0.9rem] p-3 md:p-4 align-middle group-hover:bg-hover transition-colors">
                  {row.label}
                </td>
                {districts.map((d, dIdx) => {
                  const rawVal = row.key ? getValue(d, row.key) : null;
                  const displayVal = row.format ? row.format(rawVal, d) : safeStringify(rawVal);
                  
                  return (
                    <td key={`cell-${String(d.id || d.name)}-${row.key}`} className="border-b border-borderClient p-3 md:p-4 text-center align-middle text-[0.95rem] text-textMain font-medium relative">
                      {dIdx > 0 && <div className="absolute left-0 top-3 bottom-3 w-px bg-borderClient/50" />}
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