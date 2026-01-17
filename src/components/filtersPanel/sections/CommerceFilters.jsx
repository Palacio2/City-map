import React, { memo } from 'react';
import FilterSection from './FilterSection';

const commerceFilterConfig = {
  title: 'commerce.title',
  filters: [
    { name: 'groceries', label: 'commerce.groceries' },
    { name: 'construction', label: 'commerce.construction' },
    { name: 'clothing', label: 'commerce.clothing' },
    { name: 'postOffices', label: 'commerce.post' },
    { name: 'banks', label: 'commerce.banks' },
    { name: 'beauty', label: 'commerce.beauty' },
  ],
};

const CommerceFilters = memo(({ values, onChange }) => {
  return (
    <FilterSection
      title={commerceFilterConfig.title}
      filters={commerceFilterConfig.filters}
      values={values}
      onChange={onChange}
    />
  );
});

export default CommerceFilters;
