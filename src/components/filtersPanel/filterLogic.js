import { DISTRICT_CATEGORIES } from '@config/districtFields';

const mapCrimeScoreToCategory = (score) => {
  if (score == null) return null;
  const num = parseFloat(score);
  return num < 4 ? 'low' : num < 7 ? 'medium' : 'high';
};

const validateField = (field, filterVal, districtVal) => {
  if (
    filterVal === undefined || 
    filterVal === null || 
    filterVal === '' || 
    filterVal === false || 
    filterVal === 'any' || 
    filterVal === '0' || 
    filterVal === 0
  ) {
    return true;
  }

  if (filterVal === true) {
    if (typeof districtVal === 'number') return districtVal > 0;
    return !!districtVal;
  }

  if (field.key === 'crimeLevel') {
    return mapCrimeScoreToCategory(districtVal) === filterVal;
  }

  if (field.key === 'airQuality' || field.key === 'transportFrequency') {
    return String(districtVal).toLowerCase() === String(filterVal).toLowerCase();
  }

  const nFilter = parseFloat(filterVal);
  const nDistrict = parseFloat(districtVal) || 0;
  
  if (isNaN(nFilter)) return true;

  const isMaxLimit = ['transportAvgDistance', 'propertyPricePerSqm', 'costPerSqm'].includes(field.key);
  return isMaxLimit ? (nDistrict > 0 && nDistrict <= nFilter) : (nDistrict >= nFilter);
};

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) return districtsList;

  return districtsList.filter(district => {
    const data = district.filterData;
    if (!data) return false;

    return Object.values(DISTRICT_CATEGORIES).every(category => {
      const filterGroup = filters[category.key];
      if (!filterGroup) return true;
      
      const dataGroup = data[category.key] || {};

      return category.fields.every(field => 
        validateField(field, filterGroup[field.key], dataGroup[field.key])
      );
    });
  });
};