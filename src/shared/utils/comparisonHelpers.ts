import React from 'react';
import { TFunction } from 'i18next';
import { DistrictCategory } from '@config/districtFields';
import { extractRating } from '@utils/dataTransformers';
import { formatPrice, formatNumber, getCurrencyInfo } from '@utils/formatters';
import type { RowDef } from '@/shared/types/comparison.types';

export type { RowDef };

export const safeStringify = (val: unknown): string => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val.toString();
  return '-';
};

export const buildCategoryRows = (
  catKey: string,
  categoryConfig: DistrictCategory,
  t: TFunction,
  ratingRenderer?: (val: number | null) => React.ReactNode
): RowDef[] => {
  const catName = t([`common.categories.${catKey}`, catKey], { defaultValue: catKey });
  const catHeader: RowDef = {
    type: 'header',
    title: catName,
    key: `header-${catKey}`
  };

  const ratingRow: RowDef = {
    label: t(['stats.comparison.rating', 'rating'], { defaultValue: 'Rating' }),
    key: `rating_${catKey}`,
    format: (_, d) => {
      const val = extractRating(d, catKey);
      if (ratingRenderer) {
        return ratingRenderer(val);
      }
      return (val !== null && val !== undefined) ? Number(val).toFixed(1) : '-';
    }
  };

  const fieldRows: RowDef[] = (categoryConfig.fields || []).map((f) => {
    const baseKey = (f.key as string) || '';
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
      format: (val: unknown, district) => {
        if (val === null || val === undefined) return '-';
        if (f.type === 'boolean') {
            if (typeof val === 'number') return formatNumber(val);
            return val ? t('common.status.yes') : t('common.status.no');
        }
        if (f.type === 'price') return formatPrice(val, getCurrencyInfo(district.country));
        if (f.type === 'number') return formatNumber(val);
        return safeStringify(val);
      }
    };
  });

  return [catHeader, ratingRow, ...fieldRows];
};
