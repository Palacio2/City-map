import React from 'react';
import FilterSection from './FilterSection';
import FilterCheckbox from './FilterCheckbox';
import FilterSlider from './FilterSlider';

const SocialFilters = ({ filters, onFiltersChange }) => {
  const socialFilters = filters.social || {};

  const handleCheckboxChange = (field) => (e) => {
    onFiltersChange({
      social: { ...socialFilters, [field]: e.target.checked },
    });
  };

  const handleSliderChange = (field) => (e) => {
    onFiltersChange({
      social: { ...socialFilters, [field]: Number(e.target.value) },
    });
  };

  return (
    <FilterSection title="Соціальна інфраструктура">
      <FilterCheckbox
        label="Парки"
        checked={!!socialFilters.parks}
        onChange={handleCheckboxChange('parks')}
      />
      <FilterCheckbox
        label="Кафе та ресторани"
        checked={!!socialFilters.cafes}
        onChange={handleCheckboxChange('cafes')}
      />
      <FilterSlider
        label="Мін. рейтинг"
        value={socialFilters.minRating || 0}
        onChange={handleSliderChange('minRating')}
        min={0}
        max={10}
        step={1}
      />
    </FilterSection>
  );
};

export default SocialFilters;
