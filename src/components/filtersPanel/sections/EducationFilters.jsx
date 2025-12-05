import React from 'react';
import FilterSection from './FilterSection';
import FilterCheckbox from './FilterCheckbox';
import FilterSlider from './FilterSlider';

const EducationFilters = ({ filters, onFiltersChange }) => {
  const educationFilters = filters.education || {};

  const handleCheckboxChange = (field) => (e) => {
    onFiltersChange({
      education: { ...educationFilters, [field]: e.target.checked },
    });
  };

  const handleSliderChange = (field) => (e) => {
    onFiltersChange({
      education: { ...educationFilters, [field]: Number(e.target.value) },
    });
  };

  return (
    <FilterSection title="Освіта">
      <FilterCheckbox
        label="Дитячі садки"
        checked={!!educationFilters.kindergartens}
        onChange={handleCheckboxChange('kindergartens')}
      />
      <FilterCheckbox
        label="Школи"
        checked={!!educationFilters.schools}
        onChange={handleCheckboxChange('schools')}
      />
      <FilterCheckbox
        label="Університети"
        checked={!!educationFilters.universities}
        onChange={handleCheckboxChange('universities')}
      />
      <FilterSlider
        label="Мін. рейтинг"
        value={educationFilters.minRating || 0}
        onChange={handleSliderChange('minRating')}
        min={0}
        max={10}
        step={1}
      />
    </FilterSection>
  );
};

export default EducationFilters;
