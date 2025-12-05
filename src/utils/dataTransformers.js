export const transformDistrictForDisplay = (district) => {
  if (!district || !district.filterData) return district;
  
  const { filterData } = district;
  
  // Не створюємо новий об'єкт, якщо вже є правильна структура
  if (filterData.education?.rating !== undefined) {
    return district; // Вже трансформовано
  }
  
  // Трансформуємо плоску структуру в вкладену
  return {
    ...district,
    filterData: {
      // Загальні дані
      general: {
        propertyPrice: filterData.property_price,
        populationDensity: filterData.population_density,
        greenSpaces: filterData.green_spaces_percent,
        area: filterData.area_sq_km,
        population: filterData.population_total
      },
      
      // Освіта
      education: {
        rating: filterData.education_rating,
        kindergartens: filterData.kindergartens_count,
        schools: filterData.schools_count,
        universities: filterData.universities_count
      },
      
      // Медицина
      medicine: {
        rating: filterData.medicine_rating,
        hospitals: filterData.hospitals_count,
        clinics: filterData.clinics_count,
        pharmacies: filterData.pharmacies_count,
        emergencyServices: filterData.emergency_services_count
      },
      
      // Транспорт
      transport: {
        rating: filterData.transport_rating,
        busStops: filterData.bus_stops_count,
        tramStops: filterData.tram_stops_count,
        metroStations: filterData.metro_stations_count,
        bikeLanes: filterData.bike_lanes_km,
        parkingSpots: filterData.parking_spots_count,
        averageDistance: filterData.transport_average_distance_m,
        frequency: filterData.transport_frequency
      },
      
      // Соціальна інфраструктура
      social: {
        rating: filterData.social_rating,
        parks: filterData.parks_count,
        averageParkSize: filterData.average_park_size_sqm,
        playgrounds: filterData.playgrounds_count,
        sportsFacilities: filterData.sports_facilities_count,
        cafesRestaurants: filterData.cafes_restaurants_count,
        libraries: filterData.libraries_count,
        cinemas: filterData.cinemas_count,
        theaters: filterData.theaters_count,
        museums: filterData.museums_count
      },
      
      // Безпека
      safety: {
        rating: filterData.safety_rating,
        crimeLevel: filterData.crime_level,
        policeStations: filterData.police_stations_count,
        cctv: filterData.cctv_count,
        streetLighting: filterData.street_lighting_rating
      },
      
      // Комерція
      commerce: {
        rating: filterData.commerce_rating,
        groceryStores: filterData.grocery_stores_count,
        constructionStores: filterData.construction_stores_count,
        clothingStores: filterData.clothing_stores_count,
        shoppingMalls: filterData.shopping_malls_count,
        banksATMs: filterData.banks_atms_count,
        postOffices: filterData.post_offices_count,
        beautySalons: filterData.beauty_salons_count,
        density: filterData.shops_density
      },
      
      // Комунальні послуги
      utilities: {
        qualityRating: filterData.utilities_quality_rating,
        costPerSqm: filterData.utilities_cost_per_sqm,
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