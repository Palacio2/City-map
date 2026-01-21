const safeParseFloat = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseFloat(value)) ? parseFloat(value) : null;

const safeParseInt = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseInt(value)) ? parseInt(value) : null;

export const transformDistrictForDisplay = (district) => {
  if (!district) return null;

  if (district.filterData && district.filterData.general && district.filterData.education) {
    return {
        ...district,
        updated_at: district.updated_at || district.filterData.data_updated_at || null
    };
  }

  let filterData = Array.isArray(district.filterData) 
    ? district.filterData[0] 
    : district.filterData;
    
  if (!filterData) return district;

  return {
    ...district,
    updated_at: filterData.data_updated_at || filterData.last_updated || district.updated_at,

    filterData: {
      general: {
        propertyPrice: safeParseFloat(filterData.average_property_price),
        populationDensity: safeParseInt(filterData.population_density),
        greenSpaces: safeParseFloat(filterData.green_spaces_percent),
        population: safeParseInt(filterData.population),
        averageSalary: safeParseFloat(filterData.average_salary),
        unemploymentRate: safeParseFloat(filterData.unemployment_rate),
        average_rent_price: safeParseFloat(filterData.average_rent_price),
        totalScore: safeParseFloat(filterData.total_score)
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
        emergencyServices: safeParseInt(filterData.emergency_services_count)
      },
      transport: {
        rating: safeParseFloat(filterData.transport_rating),
        busStops: safeParseInt(filterData.bus_stops_count),
        parkingSpots: safeParseInt(filterData.parking_spots_count),
        metroStations: safeParseInt(filterData.metro_stations_count),
        tramStops: safeParseInt(filterData.tram_stops_count),
        bikeLanes: safeParseInt(filterData.bike_lanes_km),
        transportFrequency: filterData.transport_frequency,
        transportAvgDistance: safeParseInt(filterData.transport_average_distance_m) 
      },
      social: {
        rating: safeParseFloat(filterData.social_rating),
        parks: safeParseInt(filterData.parks_count),
        playgrounds: safeParseInt(filterData.playgrounds_count),
        avgParkSize: safeParseInt(filterData.average_park_size_sqm),
        airQuality: filterData.air_quality,
        
        sportsFacilities: safeParseInt(filterData.sports_facilities_count),
        cinemas: safeParseInt(filterData.cinemas_count),
        theaters: safeParseInt(filterData.theaters_count),
        museums: safeParseInt(filterData.museums_count),
        libraries: safeParseInt(filterData.libraries_count)
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
        shoppingMalls: safeParseInt(filterData.shopping_malls_count),
        banksATMs: safeParseInt(filterData.banks_atms_count),
        postOffices: safeParseInt(filterData.post_offices_count),
        beautySalons: safeParseInt(filterData.beauty_salons_count),
        cafesRestaurants: safeParseInt(filterData.cafes_restaurants_count),
        constructionStores: safeParseInt(filterData.construction_stores_count),
        clothingStores: safeParseInt(filterData.clothing_stores_count)
      },
      utilities: {
        qualityRating: safeParseFloat(filterData.utilities_quality_rating),
        propertyPricePerSqm: safeParseFloat(filterData.average_sale_price_sqm),
        costPerSqm: safeParseFloat(filterData.utilities_cost_per_sqm),
        
        hasWaterSupply: filterData.has_water_supply, 
        hasHeating: filterData.has_heating,
        hasElectricity: filterData.has_electricity,
        hasGasSupply: filterData.has_gas_supply,
        hasWasteRemoval: filterData.has_waste_removal
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