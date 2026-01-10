// Допоміжні функції для безпечного перетворення типів
const safeParseFloat = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseFloat(value)) ? parseFloat(value) : null;

const safeParseInt = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseInt(value)) ? parseInt(value) : null;

// =========================================================================================

export const transformDistrictForDisplay = (district) => {
  if (!district || !district.filterData) return district;
  
  // Перевіряємо, чи дані фільтра прийшли як масив (від API) і вибираємо перший елемент
  let filterData = Array.isArray(district.filterData) 
    ? district.filterData[0] 
    : district.filterData;
    
  if (!filterData) return district;

  // Не створюємо новий об'єкт, якщо структура вже була трансформована
  // Це дозволяє уникнути подвійної конвертації типів
  if (filterData.education?.rating !== undefined) {
    return district; 
  }
  
  // Трансформуємо плоску структуру (від API) у вкладену (для компонентів)
  return {
    ...district,
    filterData: {
      // Загальні дані
      general: {
        propertyPrice: safeParseFloat(filterData.average_property_price),
        populationDensity: safeParseInt(filterData.population_density),
        greenSpaces: safeParseFloat(filterData.green_spaces_percent),
        // Додаткові поля (якщо існують)
        area: safeParseFloat(filterData.area_sq_km), 
        population: safeParseInt(filterData.population_total)
      },
      
      // Освіта
      education: {
        rating: safeParseFloat(filterData.education_rating),
        kindergartens: safeParseInt(filterData.kindergartens_count),
        schools: safeParseInt(filterData.schools_count),
        universities: safeParseInt(filterData.universities_count)
      },
      
      // Медицина
      medicine: {
        rating: safeParseFloat(filterData.medicine_rating),
        hospitals: safeParseInt(filterData.hospitals_count),
        clinics: safeParseInt(filterData.clinics_count),
        pharmacies: safeParseInt(filterData.pharmacies_count),
        emergencyServices: safeParseInt(filterData.emergency_services_count)
      },
      
      // Транспорт
      transport: {
        rating: safeParseFloat(filterData.transport_rating),
        busStops: safeParseInt(filterData.bus_stops_count),
        tramStops: safeParseInt(filterData.tram_stops_count),
        metroStations: safeParseInt(filterData.metro_stations_count),
        bikeLanes: safeParseFloat(filterData.bike_lanes_km),
        parkingSpots: safeParseInt(filterData.parking_spots_count),
        averageDistance: safeParseInt(filterData.transport_average_distance_m),
        frequency: filterData.transport_frequency // Рядок, не конвертуємо
      },
      
      // Соціальна інфраструктура
      social: {
        rating: safeParseFloat(filterData.social_rating),
        parks: safeParseInt(filterData.parks_count),
        averageParkSize: safeParseFloat(filterData.average_park_size_sqm),
        playgrounds: safeParseInt(filterData.playgrounds_count),
        sportsFacilities: safeParseInt(filterData.sports_facilities_count),
        cafesRestaurants: safeParseInt(filterData.cafes_restaurants_count),
        libraries: safeParseInt(filterData.libraries_count),
        cinemas: safeParseInt(filterData.cinemas_count),
        theaters: safeParseInt(filterData.theaters_count),
        museums: safeParseInt(filterData.museums_count)
      },
      
      // Безпека
      safety: {
        rating: safeParseFloat(filterData.safety_rating),
        crimeLevel: safeParseFloat(filterData.crime_level), 
        policeStations: safeParseInt(filterData.police_stations_count),
        cctv: safeParseInt(filterData.cctv_count),
        streetLighting: safeParseFloat(filterData.street_lighting_rating)
      },
      
      // Комерція
      commerce: {
        rating: safeParseFloat(filterData.commerce_rating),
        groceryStores: safeParseInt(filterData.grocery_stores_count),
        constructionStores: safeParseInt(filterData.construction_stores_count),
        clothingStores: safeParseInt(filterData.clothing_stores_count),
        shoppingMalls: safeParseInt(filterData.shopping_malls_count),
        banksATMs: safeParseInt(filterData.banks_atms_count),
        postOffices: safeParseInt(filterData.post_offices_count),
        beautySalons: safeParseInt(filterData.beauty_salons_count),
        density: filterData.shops_density // Рядок, не конвертуємо
      },
      
      // Комунальні послуги
      utilities: {
        qualityRating: safeParseFloat(filterData.utilities_quality_rating),
        costPerSqm: safeParseFloat(filterData.utilities_cost_per_sqm),
        // Булеві значення залишаємо як є
        hasWaterSupply: filterData.has_water_supply, 
        hasHeating: filterData.has_heating,
        hasElectricity: filterData.has_electricity,
        hasGasSupply: filterData.has_gas_supply,
        hasWasteRemoval: filterData.has_waste_removal
      }
    }
  };
};

// Функція для масиву районів
export const transformDistrictsForDisplay = (districts) => {
  return districts.map(transformDistrictForDisplay);
};

// Функція для фільтрації - працює з оригінальними даними
export const getFlatFilterData = (district) => {
  if (!district || !district.filterData) return null;
  
  // Якщо це вже плоскі дані, повертаємо їх
  if (district.filterData.property_price !== undefined) {
    return district.filterData;
  }
  
  // Якщо це трансформовані дані, конвертуємо назад
  const { filterData } = district;
  return {
    // Загальні
    property_price: filterData.general?.propertyPrice,
    population_density: filterData.general?.populationDensity,
    green_spaces_percent: filterData.general?.greenSpaces,
    area_sq_km: filterData.general?.area,
    population_total: filterData.general?.population,
    
    // Освіта
    education_rating: filterData.education?.rating,
    kindergartens_count: filterData.education?.kindergartens,
    schools_count: filterData.education?.schools,
    universities_count: filterData.education?.universities,
    
    // Медицина
    medicine_rating: filterData.medicine?.rating,
    hospitals_count: filterData.medicine?.hospitals,
    clinics_count: filterData.medicine?.clinics,
    pharmacies_count: filterData.medicine?.pharmacies,
    emergency_services_count: filterData.medicine?.emergencyServices,
    
    // Транспорт
    transport_rating: filterData.transport?.rating,
    bus_stops_count: filterData.transport?.busStops,
    tram_stops_count: filterData.transport?.tramStops,
    metro_stations_count: filterData.transport?.metroStations,
    bike_lanes_km: filterData.transport?.bikeLanes,
    parking_spots_count: filterData.transport?.parkingSpots,
    transport_average_distance_m: filterData.transport?.averageDistance,
    transport_frequency: filterData.transport?.frequency,
    
    // Соціальна
    social_rating: filterData.social?.rating,
    parks_count: filterData.social?.parks,
    average_park_size_sqm: filterData.social?.averageParkSize,
    playgrounds_count: filterData.social?.playgrounds,
    sports_facilities_count: filterData.social?.sportsFacilities,
    cafes_restaurants_count: filterData.social?.cafesRestaurants,
    libraries_count: filterData.social?.libraries,
    cinemas_count: filterData.social?.cinemas,
    theaters_count: filterData.social?.theaters,
    museums_count: filterData.social?.museums,
    
    // Безпека
    safety_rating: filterData.safety?.rating,
    crime_level: filterData.safety?.crimeLevel,
    police_stations_count: filterData.safety?.policeStations,
    cctv_count: filterData.safety?.cctv,
    street_lighting_rating: filterData.safety?.streetLighting,
    
    // Комерція
    commerce_rating: filterData.commerce?.rating,
    grocery_stores_count: filterData.commerce?.groceryStores,
    construction_stores_count: filterData.commerce?.constructionStores,
    clothing_stores_count: filterData.commerce?.clothingStores,
    shopping_malls_count: filterData.commerce?.shoppingMalls,
    banks_atms_count: filterData.commerce?.banksATMs,
    post_offices_count: filterData.commerce?.postOffices,
    beauty_salons_count: filterData.commerce?.beautySalons,
    shops_density: filterData.commerce?.density,
    
    // Комунальні послуги
    utilities_quality_rating: filterData.utilities?.qualityRating,
    utilities_cost_per_sqm: filterData.utilities?.costPerSqm,
    has_water_supply: filterData.utilities?.hasWaterSupply,
    has_heating: filterData.utilities?.hasHeating,
    has_electricity: filterData.utilities?.hasElectricity,
    has_gas_supply: filterData.utilities?.hasGasSupply,
    has_waste_removal: filterData.utilities?.hasWasteRemoval
  };
};