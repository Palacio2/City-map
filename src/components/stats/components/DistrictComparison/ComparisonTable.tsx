import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStar } from 'react-icons/fa';
import { DynamicDistrictConfig } from '@config/districtFields'; 
import { getValue, formatPrice, formatNumber, getCurrencyInfo } from '@utils/formatters';
import { extractBaseVal, extractRating, TransformedDistrict } from '@utils/dataTransformers';
import { buildCategoryRows, safeStringify, RowDef } from '@utils/comparisonHelpers';

const FormattedRating = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return <>{'-'}</>;
  return (
    <span className="flex items-center justify-center gap-1 font-bold text-accent">
      {Number(value).toFixed(1)} <FaStar className="text-xs" />
    </span>
  );
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
        key: 'average_sale_price_sqm',
        format: (_, d) => formatPrice(extractBaseVal(d, 'average_sale_price_sqm'), getCurrencyInfo(d.country))
      },
      {
        label: t(['common.fields.average_rent_price', 'average_rent_price'], { defaultValue: 'average_rent_price' }),
        key: 'average_rent_price',
        format: (_, d) => formatPrice(extractBaseVal(d, 'average_rent_price'), getCurrencyInfo(d.country))
      },
      {
        label: t(['common.fields.population', 'population'], { defaultValue: 'population' }),
        key: 'population',
        format: (_, d) => formatNumber(extractBaseVal(d, 'population'))
      },
    ];

    if (!config) return baseRows;

    const categoryRows = Object.values(config).flatMap(cat => 
      buildCategoryRows(cat.key, cat, t, val => <FormattedRating value={val} />)
    );

    return [...baseRows, ...categoryRows];
  }, [districts, config, t]);

  if (!districts.length) return null;

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-4 rounded-xl border border-borderClient dark:border-white/10 shadow-xs bg-surface">
      <table className="w-full min-w-[600px] border-collapse bg-transparent overflow-hidden">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 bg-surface border-r border-b border-borderClient dark:border-white/10 p-4 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[140px] md:w-[200px]"></th>
            {districts.map((d, idx) => (
              <th key={`th-${d.id || idx}`} className="p-4 border-b border-borderClient dark:border-white/10 bg-surface text-center font-heading text-[1rem] md:text-[1.1rem] text-textMain min-w-[150px] md:min-w-[180px] relative">
                {idx > 0 && <div className="absolute left-0 top-4 bottom-4 w-px bg-borderClient/50 dark:bg-white/10" />}
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
                <tr key={rowKey} className="bg-body dark:bg-black/20 border-b border-borderClient dark:border-white/10">
                  <td colSpan={districts.length + 1} className="p-3 md:p-4 text-left font-heading font-bold text-textMain text-[0.95rem] md:text-[1.05rem] uppercase tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    {row.title}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={rowKey} className="group hover:bg-hover dark:hover:bg-white/5 transition-colors">
                <td className="sticky left-0 z-10 bg-surface border-r border-b border-borderClient dark:border-white/10 text-left min-w-[140px] max-w-[140px] md:min-w-[200px] md:max-w-[250px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-semibold text-textSecondary text-[0.9rem] p-3 md:p-4 align-middle group-hover:bg-hover dark:group-hover:bg-[#2a2d35] transition-colors">
                  {row.label}
                </td>
                {districts.map((d, dIdx) => {
                  let rawVal = null;
                  if (['average_sale_price_sqm', 'average_rent_price', 'population'].includes(row.key || '')) {
                      rawVal = extractBaseVal(d, row.key!);
                  } else if (row.key?.startsWith('rating_')) {
                      rawVal = extractRating(d, row.key.replace('rating_', ''));
                  } else {
                      rawVal = row.key ? getValue(d, row.key) : null;
                  }
                  
                  const displayVal = row.format ? row.format(rawVal, d) : safeStringify(rawVal);
                  
                  return (
                    <td key={`cell-${String(d.id || d.name)}-${row.key}`} className="border-b border-borderClient dark:border-white/10 p-3 md:p-4 text-center align-middle text-[0.95rem] text-textMain font-medium relative group-hover:bg-hover dark:group-hover:bg-white/5 transition-colors">
                      {dIdx > 0 && <div className="absolute left-0 top-3 bottom-3 w-px bg-borderClient/50 dark:bg-white/10" />}
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
