import React, { memo } from 'react';
import FilterSection from './FilterSection';

const transportFilterConfig = {
  title: 'transport.title',
  filters: [
    { name: 'bus_stops', label: 'transport.bus_stops' },
    { name: 'tram_stops', label: 'transport.tram_stops' },
    { name: 'metro', label: 'transport.metro' },
    { name: 'bike_lanes', label: 'transport.bike_lanes' },
    { name: 'parking', label: 'transport.parking' },
  ],
};

const TransportFilters = memo(({ values, onChange }) => {
  return (
    <FilterSection
      title={transportFilterConfig.title}
      filters={transportFilterConfig.filters}
      values={values}
      onChange={onChange}
    />
  );
});

export default TransportFilters;
