import React from 'react';
import FilterSection from './FilterSection';
import FilterCheckbox from './FilterCheckbox';

const UtilitiesFilters = ({ filters, onFiltersChange }) => {
  const utilitiesFilters = filters.utilities || {};

  const handleCheckboxChange = (field) => (e) => {
    onFiltersChange({
      utilities: { ...utilitiesFilters, [field]: e.target.checked },
    });
  };

  return (
    <FilterSection title="Комунальні послуги">
      <FilterCheckbox
        label="Центральне опалення"
        checked={!!utilitiesFilters.central_heating}
        onChange={handleCheckboxChange('central_heating')}
      />
      <FilterCheckbox
        label="Гаряча вода"
        checked={!!utilitiesFilters.hot_water}
        onChange={handleCheckboxChange('hot_water')}
      />
    </FilterSection>
  );
};

export default UtilitiesFilters;
