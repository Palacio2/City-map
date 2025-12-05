import React from 'react';
import FilterSection from './FilterSection';
import FilterCheckbox from './FilterCheckbox';
import FilterSlider from './FilterSlider';

const CommerceFilters = ({ filters, onFiltersChange }) => {
  const commerceFilters = filters.commerce || {};

  const handleCheckboxChange = (field) => (e) => {
    onFiltersChange({
      commerce: { ...commerceFilters, [field]: e.target.checked },
    });
  };

  const handleSliderChange = (field) => (e) => {
    onFiltersChange({
      commerce: { ...commerceFilters, [field]: Number(e.target.value) },
    });
  };

  return (
    <FilterSection title="Комерція">
      <FilterCheckbox
        label="Продуктові магазини"
        checked={!!commerceFilters.groceries}
        onChange={handleCheckboxChange('groceries')}
      />
      <FilterCheckbox
        label="Банки та банкомати"
        checked={!!commerceFilters.banks}
        onChange={handleCheckboxChange('banks')}
      />
      <FilterCheckbox
        label="Будівельні магазини"
        checked={!!commerceFilters.construction}
        onChange={handleCheckboxChange('construction')}
      />
      <FilterCheckbox
        label="Магазини одягу"
        checked={!!commerceFilters.clothing}
        onChange={handleCheckboxChange('clothing')}
      />
      <FilterCheckbox
        label="Поштові відділення"
        checked={!!commerceFilters.post_offices}
        onChange={handleCheckboxChange('post_offices')}
      />
      <FilterSlider
        label="Мін. рейтинг"
        value={commerceFilters.minRating || 0}
        onChange={handleSliderChange('minRating')}
        min={0}
        max={10}
        step={1}
      />
    </FilterSection>
  );
};

export default CommerceFilters;
