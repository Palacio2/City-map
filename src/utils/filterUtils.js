const filterConfig = {
  education: {
    kindergartens: (districtValue) => districtValue > 0,
    schools: (districtValue) => districtValue > 0,
    universities: (districtValue) => districtValue > 0,
    minRating: (districtValue, filterValue) => districtValue >= filterValue,
  },
  medicine: {
    hospitals: (districtValue) => districtValue > 0,
    clinics: (districtValue) => districtValue > 0,
    minRating: (districtValue, filterValue) => districtValue >= filterValue,
  },
  transport: {
    bus_stops: (districtValue) => districtValue > 0,
    metro: (districtValue) => districtValue > 0,
    tram_stops: (districtValue) => districtValue > 0,
    bike_lanes: (districtValue) => districtValue > 0,
    minRating: (districtValue, filterValue) => districtValue >= filterValue,
  },
  safety: {
    police: (districtValue) => districtValue > 0,
    minRating: (districtValue, filterValue) => districtValue >= filterValue,
    crimeLevel: (districtValue, filterValue) => {
      if (filterValue === 'any') return true;
      const crimeLevel = districtValue || 5;
      if (filterValue === 'low' && crimeLevel > 3) return false;
      if (filterValue === 'medium' && (crimeLevel <= 3 || crimeLevel > 6)) return false;
      if (filterValue === 'high' && crimeLevel <= 6) return false;
      return true;
    },
  },
  social: {
    parks: (districtValue) => districtValue > 0,
    cafes: (districtValue) => districtValue > 0,
    minRating: (districtValue, filterValue) => districtValue >= filterValue,
  },
  commerce: {
    groceries: (districtValue) => districtValue > 0,
    banks: (districtValue) => districtValue > 0,
    construction: (districtValue) => districtValue > 0,
    clothing: (districtValue) => districtValue > 0,
    post_offices: (districtValue) => districtValue > 0,
    minRating: (districtValue, filterValue) => districtValue >= filterValue,
  },
};

const propertyMap = {
  education: {
    minRating: 'rating',
  },
  medicine: {
    minRating: 'rating',
  },
  transport: {
    bus_stops: 'busStops',
    metro: 'metroStations',
    tram_stops: 'tramStops',
    bike_lanes: 'bikeLanes',
    minRating: 'rating',
  },
  safety: {
    police: 'policeStations',
    minRating: 'rating',
  },
  social: {
    cafes: 'cafesRestaurants',
    minRating: 'rating',
  },
  commerce: {
    groceries: 'groceryStores',
    banks: 'banksATMs',
    post_offices: 'postOffices',
    minRating: 'rating',
  },
};

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return districtsList;
  }

  return districtsList.filter((district) => {
    if (!district.filterData) return false;

    for (const category in filters) {
      if (filterConfig[category]) {
        for (const key in filters[category]) {
          const filterValue = filters[category][key];
          const districtCategory = district.filterData[category] || {};
          const propertyName = (propertyMap[category] && propertyMap[category][key]) || key;
          const districtValue = districtCategory[propertyName];
          const validationFn = filterConfig[category][key];

          if (validationFn && !validationFn(districtValue, filterValue)) {
            return false;
          }
        }
      }
    }

    return true;
  });
};
