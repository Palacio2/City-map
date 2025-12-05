import React from 'react';
import FilterSection from './FilterSection';
import FilterCheckbox from './FilterCheckbox';
import FilterSlider from './FilterSlider';

const SafetyFilters = ({ filters, onFiltersChange }) => {
  const safetyFilters = filters.safety || {};

  const handleCheckboxChange = (field) => (e) => {
    onFiltersChange({
      safety: { ...safetyFilters, [field]: e.target.checked },
    });
  };

  const handleSliderChange = (field) => (e) => {
    onFiltersChange({
      safety: { ...safetyFilters, [field]: Number(e.target.value) },
    });
  };

  const handleCrimeLevelChange = (e) => {
    onFiltersChange({
      safety: { ...safetyFilters, crimeLevel: e.target.value },
    });
  };

  return (
    <FilterSection title="Безпека">
      <FilterCheckbox
        label="Поліцейські відділки"
        checked={!!safetyFilters.police}
        onChange={handleCheckboxChange('police')}
      />
      <FilterSlider
        label="Мін. рейтинг"
        value={safetyFilters.minRating || 0}
        onChange={handleSliderChange('minRating')}
        min={0}
        max={10}
        step={1}
      />
      <div>
        <label>Рівень злочинності</label>
        <select value={safetyFilters.crimeLevel || 'any'} onChange={handleCrimeLevelChange}>
          <option value="any">Будь-який</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </div>
    </FilterSection>
  );
};

export default SafetyFilters;
