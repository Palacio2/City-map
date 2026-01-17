import React, { memo } from 'react';
import FilterSection from './FilterSection';

const medicineFilterConfig = {
  title: 'medicine.title',
  filters: [
    { name: 'hospitals', label: 'medicine.hospitals' },
    { name: 'clinics', label: 'medicine.clinics' },
    { name: 'pharmacies', label: 'medicine.pharmacies' },
    { name: 'emergency', label: 'medicine.emergency' },
  ],
};

const MedicineFilters = memo(({ values, onChange }) => {
  return (
    <FilterSection
      title={medicineFilterConfig.title}
      filters={medicineFilterConfig.filters}
      values={values}
      onChange={onChange}
    />
  );
});

export default MedicineFilters;
