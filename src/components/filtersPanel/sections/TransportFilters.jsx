import React from 'react';
import FilterSection from './FilterSection';
import FilterCheckbox from './FilterCheckbox';
import FilterSlider from './FilterSlider';

const TransportFilters = ({ filters, onFiltersChange }) => {
  const transportFilters = filters.transport || {};

  const handleCheckboxChange = (field) => (e) => {
    onFiltersChange({
      transport: { ...transportFilters, [field]: e.target.checked },
    });
  };

  const handleSliderChange = (field) => (e) => {
    onFiltersChange({
      transport: { ...transportFilters, [field]: Number(e.target.value) },
    });
  };

  return (
    <FilterSection title="Транспорт">
      <FilterCheckbox
        label="Зупинки автобусів"
        checked={!!transportFilters.bus_stops}
        onChange={handleCheckboxChange('bus_stops')}
      />
      <FilterCheckbox
        label="Метро"
        checked={!!transportFilters.metro}
        onChange={handleCheckboxChange('metro')}
      />
      <FilterCheckbox
        label="Зупинки трамваїв"
        checked={!!transportFilters.tram_stops}
        onChange={handleCheckboxChange('tram_stops')}
      />
      <FilterCheckbox
        label="Велодоріжки"
        checked={!!transportFilters.bike_lanes}
        onChange={handleCheckboxChange('bike_lanes')}
      />
      <FilterSlider
        label="Мін. рейтинг"
        value={transportFilters.minRating || 0}
        onChange={handleSliderChange('minRating')}
        min={0}
        max={10}
        step={1}
      />
    </FilterSection>
  );
};

export default TransportFilters;
