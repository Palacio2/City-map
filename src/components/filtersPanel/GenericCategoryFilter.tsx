import { memo, useMemo } from 'react';
import FilterSection from './FilterSection';
import { DistrictCategory } from '@config/districtFields';
import { FilterValue } from './filterLogic';

interface GenericCategoryFilterProps {
  readonly categoryConfig: DistrictCategory;
  readonly values: Record<string, FilterValue>;
  readonly onChange: (section: string, data: Record<string, FilterValue>) => void;
  readonly isFree: boolean;
  readonly isRealtor: boolean;
}

const GenericCategoryFilter = memo(({ 
  categoryConfig, 
  values, 
  onChange, 
  isFree, 
  isRealtor 
}: GenericCategoryFilterProps) => {

  const filtersForSection = useMemo(() => {
    if (!categoryConfig || !categoryConfig.fields) return [];

    return categoryConfig.fields
      .map(f => {
        const isLocked = (isFree && f.isPremiumField) || (f.isRealtorOnly && !isRealtor);
        return { 
          name: f.key,
          type: f.type,
          disabled: isLocked,
          locked: isLocked
        };
      });
  }, [categoryConfig, isFree, isRealtor]);

  if (!categoryConfig) return null;

  return (
    <FilterSection 
      categoryConfig={categoryConfig} 
      filters={filtersForSection} 
      values={values} 
      onChange={onChange} 
    />
  );
});

GenericCategoryFilter.displayName = 'GenericCategoryFilter';
export default GenericCategoryFilter;