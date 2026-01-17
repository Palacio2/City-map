import React, { memo } from 'react';
import FilterSection from './FilterSection';

const utilitiesFilterConfig = {
  title: 'utilities.title',
  filters: [
    { name: 'water', label: 'utilities.water' },
    { name: 'heating', label: 'utilities.heating' },
    { name: 'electricity', label: 'utilities.electricity' },
    { name: 'gas', label: 'utilities.gas' },
    { name: 'waste', label: 'utilities.waste' },
  ],
};

const UtilitiesFilters = memo(({ values, onChange }) => {
  return (
    <FilterSection
      title={utilitiesFilterConfig.title}
      filters={utilitiesFilterConfig.filters}
      values={values}
      onChange={onChange}
    />
  );
});

export default UtilitiesFilters;
