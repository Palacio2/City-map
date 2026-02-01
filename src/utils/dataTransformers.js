const safeParseFloat = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseFloat(value)) ? parseFloat(value) : null;

const safeParseInt = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseInt(value)) ? parseInt(value) : null;

export const transformDistrictForDisplay = (district) => {
  if (!district) return null;

  // Якщо дані вже структуровані (рідкісний кейс, але залишаємо)
  if (district.filterData && district.filterData.general && district.filterData.education) {
    return {
        ...district,
        updated_at: district.updated_at || district.filterData.data_updated_at || null
    };
  }

  // Витягуємо "сирі" дані з різних можливих структур Supabase
  let rawData = null;

  if (Array.isArray(district.filterData)) {
    rawData = district.filterData[0];
  } else if (district.filterData && typeof district.filterData === 'object') {
    rawData = district.filterData;
  } else if (district.district_data) { 
    rawData = Array.isArray(district.district_data) ? district.district_data[0] : district.district_data;
  } else {
    // Fallback, якщо filterData лежить прямо в корені об'єкта (іноді буває при join)
    if (district.population !== undefined || district.average_salary !== undefined) {
        rawData = district;
    }
  }

  const filterData = rawData || {};

  return {
    ...district,
    updated_at: filterData.data_updated_at || filterData.last_updated || district.updated_at || null,

    filterData: {
      general: {
        propertyPrice: safeParseFloat(filterData.average_sale_price_sqm),
        populationDensity: safeParseInt(filterData.population_density),
        greenSpaces: safeParseFloat(filterData.green_spaces_percent),
        population: safeParseInt(filterData.population),
        averageSalary: safeParseFloat(filterData.average_salary),
        unemploymentRate: safeParseFloat(filterData.unemployment_rate),
        average_rent_price: safeParseFloat(filterData.average_rent_price),
        // totalScore можна додати пізніше, якщо буде колонка в БД
      },
      education: {
        rating: safeParseFloat(filterData.education_rating),
        schools: safeParseInt(filterData.schools_count),
        kindergartens: safeParseInt(filterData.kindergartens_count),
        universities: safeParseInt(filterData.universities_count)
      },
      medicine: {
        rating: safeParseFloat(filterData.medicine_rating),
        hospitals: safeParseInt(filterData.hospitals_count),
        pharmacies: safeParseInt(filterData.pharmacies_count),
        clinics: safeParseInt(filterData.clinics_count),
        // emergencyServices видалено
      },
      transport: {
        rating: safeParseFloat(filterData.transport_rating),
        busStops: safeParseInt(filterData.bus_stops_count),
        tramStops: safeParseInt(filterData.tram_stops_count),
        metroStations: safeParseInt(filterData.metro_stations_count),
        parkingSpots: safeParseInt(filterData.parking_spots_count),
        bikeLanes: safeParseFloat(filterData.bike_lanes_km), // float для км
        bikeRental: safeParseInt(filterData.bike_rental_stations_count), // 🆕
        evCharging: safeParseInt(filterData.ev_charging_stations_count), // 🆕
        transportFrequency: filterData.transport_frequency || null,
        transportAvgDistance: safeParseInt(filterData.transport_average_distance_m) 
      },
      social: {
        rating: safeParseFloat(filterData.social_rating),
        parks: safeParseInt(filterData.parks_count),
        playgrounds: safeParseInt(filterData.playgrounds_count),
        avgParkSize: safeParseInt(filterData.average_park_size_sqm),
        airQuality: filterData.air_quality || null,
        
        // Спорт та культура
        gyms: safeParseInt(filterData.gyms_count),                     // 🆕
        outdoorGyms: safeParseInt(filterData.outdoor_gyms_count),       // 🆕
        swimmingPools: safeParseInt(filterData.swimming_pools_count),   // 🆕
        sportsFacilities: safeParseInt(filterData.sports_facilities_count), // Загальне, якщо ще треба
        
        cinemas: safeParseInt(filterData.cinemas_count),
        theaters: safeParseInt(filterData.theaters_count),
        museums: safeParseInt(filterData.museums_count),
        libraries: safeParseInt(filterData.libraries_count),
        churches: safeParseInt(filterData.churches_count)               // 🆕
      },
      safety: {
        rating: safeParseFloat(filterData.safety_rating),
        crimeLevel: safeParseFloat(filterData.crime_level),
        policeStations: safeParseInt(filterData.police_stations_count),
        cctv: safeParseInt(filterData.cctv_count),
        streetLighting: safeParseFloat(filterData.street_lighting_rating)
      },
      commerce: {
        rating: safeParseFloat(filterData.commerce_rating),
        groceryStores: safeParseInt(filterData.grocery_stores_count),
        markets: safeParseInt(filterData.markets_count),                // 🆕
        shoppingMalls: safeParseInt(filterData.shopping_malls_count),
        
        parcelLockers: safeParseInt(filterData.parcel_lockers_count),   // 🆕
        coworking: safeParseInt(filterData.coworking_spaces_count),     // 🆕
        
        banksATMs: safeParseInt(filterData.banks_atms_count),
        postOffices: safeParseInt(filterData.post_offices_count),
        
        beautySalons: safeParseInt(filterData.beauty_salons_count),
        cafesRestaurants: safeParseInt(filterData.cafes_restaurants_count),
        
        petStores: safeParseInt(filterData.pet_stores_count),           // 🆕
        vetClinics: safeParseInt(filterData.vet_clinics_count)          // 🆕
        
        // constructionStores та clothingStores видалено
      },
      utilities: {
        qualityRating: safeParseFloat(filterData.utilities_quality_rating),
        propertyPricePerSqm: safeParseFloat(filterData.average_sale_price_sqm),
        costPerSqm: safeParseFloat(filterData.utilities_cost_per_sqm),
        
        hasWaterSupply: Boolean(filterData.has_water_supply), 
        hasHeating: Boolean(filterData.has_heating),
        hasElectricity: Boolean(filterData.has_electricity),
        hasGasSupply: Boolean(filterData.has_gas_supply),
        hasWasteRemoval: Boolean(filterData.has_waste_removal)
      }
    }
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