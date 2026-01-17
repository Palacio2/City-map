import React, { memo } from 'react';
import FilterSection from './FilterSection';

const educationFilterConfig = {
  title: 'education.title',
  filters: [
    { name: 'kindergartens', label: 'education.kindergartens' },
    { name: 'schools', label: 'education.schools' },
    { name: 'universities', label: 'education.universities' },
  ],
};

const EducationFilters = memo(({ values, onChange }) => {
  return (
    <FilterSection
      title={educationFilterConfig.title}
      filters={educationFilterConfig.filters}
      values={values}
      onChange={onChange}
    />
  );
});

export default EducationFilters;
