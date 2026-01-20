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

// Допоміжна функція: перетворює число 0-10 у категорію
const mapCrimeScoreToCategory = (score) => {
  if (score === null || score === undefined) return null;
  const num = parseFloat(score);
  // Налаштуй ці пороги (thresholds) за потребою
  if (num < 4) return 'low';    // 0 - 3.9
  if (num < 7) return 'medium'; // 4 - 6.9
  return 'high';                // 7 - 10
};

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return districtsList;
  }

  return districtsList.filter(district => {
    const data = getFilterData(district);
    if (!data) return false;

    // 1. Перевірка стандартних чекбоксів
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

    // 2. Спеціальна перевірка: Рівень злочинності (Numeric -> String mapping)
    if (filters.safety?.crimeLevel && filters.safety.crimeLevel !== 'any') {
      const dataLevelScore = data.safety?.crimeLevel;
      const filterLevel = filters.safety.crimeLevel; // 'low', 'medium', 'high'
      
      // Перетворюємо число з бази на категорію
      const dataCategory = mapCrimeScoreToCategory(dataLevelScore);

      if (!dataCategory || dataCategory !== filterLevel) {
        return false;
      }
    }

    // 3. Інші числові перевірки
    if (filters.transport?.bike_lanes) {
      if (!data.transport?.bikeLanes || data.transport.bikeLanes <= 0) return false;
    }

    if (filters.safety?.lighting) {
      if (!data.safety?.streetLighting || data.safety.streetLighting <= 0) return false;
    }

    return true;
  });
};