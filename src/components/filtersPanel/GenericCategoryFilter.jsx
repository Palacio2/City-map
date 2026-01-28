import React, { memo, useMemo } from 'react';
import FilterSection from './FilterSection';
import { DISTRICT_CATEGORIES } from '@config/districtFields';

const GenericCategoryFilter = memo(({ categoryKey, values, onChange, isFree, isRealtor }) => {
  const config = DISTRICT_CATEGORIES[categoryKey];

  const filters = useMemo(() => {
    if (!config) return [];
    
    return config.fields
      .filter(f => {
        if (isFree && f.isPremiumField) return false;
        if (f.isRealtorOnly && !isRealtor) return false;
        return true;
      })
      .map(f => ({
        name: f.key
      }));
  }, [config, isFree, isRealtor]);

  if (!config) return null;

  return (
    <FilterSection
      categoryKey={categoryKey}
      filters={filters}
      values={values}
      onChange={onChange}
    />
  );
});

export default GenericCategoryFilter;