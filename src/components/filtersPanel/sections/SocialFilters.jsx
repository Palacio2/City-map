import React, { memo } from 'react';
import FilterSection from './FilterSection';

const socialFilterConfig = {
  title: 'social.title',
  filters: [
    { name: 'parks', label: 'social.parks' },
    { name: 'cafes', label: 'social.cafes' },
    { name: 'playgrounds', label: 'social.playgrounds' },
    { name: 'sports', label: 'social.sports' },
    { name: 'libraries', label: 'social.libraries' },
    { name: 'cinemas', label: 'social.cinemas' },
    { name: 'theaters', label: 'social.theaters' },
    { name: 'museums', label: 'social.museums' },
  ],
};

const SocialFilters = memo(({ values, onChange }) => {
  return (
    <FilterSection
      title={socialFilterConfig.title}
      filters={socialFilterConfig.filters}
      values={values}
      onChange={onChange}
    />
  );
});

export default SocialFilters;
