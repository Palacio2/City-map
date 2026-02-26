import { DISTRICT_CATEGORIES } from '@config/districtFields';

const safeParseFloat = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseFloat(value)) ? parseFloat(value) : null;

const safeParseInt = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseInt(value)) ? parseInt(value) : null;

const PARSERS = {
  number: safeParseInt,
  price: safeParseFloat,
  crimeLevel: safeParseFloat,
  rating_10: safeParseFloat,
  boolean: (v) => Boolean(v),
  text: (v) => v || null,
};

export const transformDistrictForDisplay = (district) => {
  if (!district) return null;

  if (district.filterData && district.filterData.general && district.filterData.education) {
    return {
        ...district,
        updated_at: district.updated_at || district.filterData.data_updated_at || null
    };
  }

  let rawData = null;
  if (Array.isArray(district.filterData)) {
    rawData = district.filterData[0];
  } else if (district.filterData && typeof district.filterData === 'object') {
    rawData = district.filterData;
  } else if (district.district_data) { 
    rawData = Array.isArray(district.district_data) ? district.district_data[0] : district.district_data;
  } else {
    if (district.population !== undefined || district.average_salary !== undefined) {
        rawData = district;
    }
  }

  const filterData = rawData || {};

  const transformedFilterData = {
    general: {
      propertyPrice: safeParseFloat(filterData.average_sale_price_sqm),
      populationDensity: safeParseInt(filterData.population_density),
      greenSpaces: safeParseFloat(filterData.green_spaces_percent),
      population: safeParseInt(filterData.population),
      averageSalary: safeParseFloat(filterData.average_salary),
      unemploymentRate: safeParseFloat(filterData.unemployment_rate),
      average_rent_price: safeParseFloat(filterData.average_rent_price),
    }
  };

  // МАГІЯ ТУТ: Автоматично збираємо всі дані на основі конфігу
  Object.values(DISTRICT_CATEGORIES).forEach(category => {
    transformedFilterData[category.key] = {};
    
    // Автоматично беремо рейтинг категорії
    if (category.ratingDbKey) {
        transformedFilterData[category.key].rating = safeParseFloat(filterData[category.ratingDbKey]);
    }

    // Автоматично парсимо кожне поле
    category.fields.forEach(field => {
      const rawValue = filterData[field.dbKey];
      const parser = PARSERS[field.type] || ((v) => v);
      transformedFilterData[category.key][field.key] = parser(rawValue);
    });
  });

  return {
    ...district,
    updated_at: filterData.data_updated_at || filterData.last_updated || district.updated_at || null,
    filterData: transformedFilterData
  };
};

export const transformDistrictsForDisplay = (districts) => {
  if (!Array.isArray(districts)) return [];
  return districts.map(transformDistrictForDisplay);
};

export const getFlatFilterData = (district) => {
  if (!district || !district.filterData) return null;
  return district.filterData; 
};