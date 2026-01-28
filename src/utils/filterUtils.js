import { DISTRICT_CATEGORIES } from '@config/districtFields';

const getFilterData = (district) => district.filterData || null;

const mapCrimeScoreToCategory = (score) => {
  if (score === null || score === undefined) return null;
  const num = parseFloat(score);
  if (num < 4) return 'low';
  if (num < 7) return 'medium';
  return 'high';
};

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return districtsList;
  }

  return districtsList.filter(district => {
    const data = getFilterData(district);
    if (!data) return false;

    for (const categoryConfig of Object.values(DISTRICT_CATEGORIES)) {
      const catKey = categoryConfig.key;
      const filterGroup = filters[catKey];

      if (!filterGroup) continue;

      const dataGroup = data[catKey] || {};

      for (const field of categoryConfig.fields) {
        if (field.key === 'crimeLevel') continue; 
        
        if (filterGroup[field.key]) {
           const value = dataGroup[field.key];
           if (!value) return false;
        }
      }
    }

    if (filters.safety?.crimeLevel && filters.safety.crimeLevel !== 'any') {
      const dataLevelScore = data.safety?.crimeLevel;
      const dataCategory = mapCrimeScoreToCategory(dataLevelScore);
      
      if (dataCategory !== filters.safety.crimeLevel) {
        return false;
      }
    }

    return true;
  });
};