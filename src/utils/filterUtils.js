const getFilterData = (district) => district.filterData || null;

const FILTER_MAPPING = {
  education: {
    kindergartens: 'kindergartens',
    schools: 'schools',
    universities: 'universities'
  },
  medicine: {
    hospitals: 'hospitals',
    clinics: 'clinics',
    pharmacies: 'pharmacies',
    emergency: 'emergencyServices'
  },
  transport: {
    bus_stops: 'busStops',
    tram_stops: 'tramStops',
    metro: 'metroStations',
    parking: 'parkingSpots'
  },
  social: {
    parks: 'parks',
    cafes: 'cafesRestaurants',
    playgrounds: 'playgrounds',
    sports: 'sportsFacilities',
    libraries: 'libraries',
    cinemas: 'cinemas',
    theaters: 'theaters',
    museums: 'museums'
  },
  commerce: {
    groceries: 'groceryStores',
    construction: 'constructionStores',
    clothing: 'clothingStores',
    postOffices: 'postOffices',
    banks: 'banksATMs',
    beauty: 'beautySalons'
  },
  safety: {
    police: 'policeStations',
    cctv: 'cctv'
  },
  utilities: {
    water: 'hasWaterSupply',
    heating: 'hasHeating',
    electricity: 'hasElectricity',
    gas: 'hasGasSupply',
    waste: 'hasWasteRemoval'
  }
};

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return districtsList;
  }

  return districtsList.filter(district => {
    const data = getFilterData(district);
    if (!data) return false;

    for (const [category, fieldsMap] of Object.entries(FILTER_MAPPING)) {
      if (filters[category]) {
        const filterGroup = filters[category];
        const dataGroup = data[category] || {};

        for (const [filterKey, dataKey] of Object.entries(fieldsMap)) {
          if (filterGroup[filterKey] && !dataGroup[dataKey]) {
            return false;
          }
        }
      }
    }

    if (filters.transport?.bike_lanes) {
      if (!data.transport?.bikeLanes || data.transport.bikeLanes <= 0) return false;
    }

    if (filters.safety?.lighting) {
      if (!data.safety?.streetLighting || data.safety.streetLighting <= 0) return false;
    }

    return true;
  });
};