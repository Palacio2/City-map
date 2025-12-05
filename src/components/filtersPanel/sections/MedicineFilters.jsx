import React from 'react';
import FilterSection from './FilterSection';
import FilterCheckbox from './FilterCheckbox';
import FilterSlider from './FilterSlider';

const MedicineFilters = ({ filters, onFiltersChange }) => {
  const medicineFilters = filters.medicine || {};

  const handleCheckboxChange = (field) => (e) => {
    onFiltersChange({
      medicine: { ...medicineFilters, [field]: e.target.checked },
    });
  };

  const handleSliderChange = (field) => (e) => {
    onFiltersChange({
      medicine: { ...medicineFilters, [field]: Number(e.target.value) },
    });
  };

  return (
    <FilterSection title="Медицина">
      <FilterCheckbox
        label="Лікарні"
        checked={!!medicineFilters.hospitals}
        onChange={handleCheckboxChange('hospitals')}
      />
      <FilterCheckbox
        label="Клініки"
        checked={!!medicineFilters.clinics}
        onChange={handleCheckboxChange('clinics')}
      />
      <FilterSlider
        label="Мін. рейтинг"
        value={medicineFilters.minRating || 0}
        onChange={handleSliderChange('minRating')}
        min={0}
        max={10}
        step={1}
      />
    </FilterSection>
  );
};

export default MedicineFilters;
