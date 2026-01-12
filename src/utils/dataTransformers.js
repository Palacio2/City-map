const safeParseFloat = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseFloat(value)) ? parseFloat(value) : null;

const safeParseInt = (value) => 
  (value !== null && value !== undefined) && !isNaN(parseInt(value)) ? parseInt(value) : null;

// =========================================================================================

export const transformDistrictForDisplay = (district) => {
  if (!district || !district.filterData) return district;
  
  let filterData = Array.isArray(district.filterData) 
    ? district.filterData[0] 
    : district.filterData;
    
  if (!filterData) return district;
  if (filterData.education?.rating !== undefined) {
    return district; 
  }
  
  return {
    ...district,
    filterData: {
      general: {
        propertyPrice: safeParseFloat(filterData.average_property_price),
        populationDensity: safeParseInt(filterData.population_density),
        greenSpaces: safeParseFloat(filterData.green_spaces_percent),
        population: safeParseInt(filterData.population), 
        averageSalary: safeParseFloat(filterData.average_salary),
        unemploymentRate: safeParseFloat(filterData.unemployment_rate),
        area: safeParseFloat(filterData.area_sq_km)
      },
      
      education: {
        rating: safeParseFloat(filterData.education_rating),
        kindergartens: safeParseInt(filterData.kindergartens_count),
        schools: safeParseInt(filterData.schools_count),
        universities: safeParseInt(filterData.universities_count)
      },
      
      medicine: {
        rating: safeParseFloat(filterData.medicine_rating),
        hospitals: safeParseInt(filterData.hospitals_count),
        clinics: safeParseInt(filterData.clinics_count),
        pharmacies: safeParseInt(filterData.pharmacies_count),
        emergencyServices: safeParseInt(filterData.emergency_services_count)
      },
      
      transport: {
        rating: safeParseFloat(filterData.transport_rating),
        distanceRating: safeParseFloat(filterData.transport_distance_rating),
        busStops: safeParseInt(filterData.bus_stops_count),
        tramStops: safeParseInt(filterData.tram_stops_count),
        metroStations: safeParseInt(filterData.metro_stations_count),
        bikeLanes: safeParseFloat(filterData.bike_lanes_km),
        parkingSpots: safeParseInt(filterData.parking_spots_count),
        averageDistance: safeParseInt(filterData.transport_average_distance_m),
        frequency: filterData.transport_frequency 
      },
      
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
        constructionStores: safeParseInt(filterData.construction_stores_count),
        clothingStores: safeParseInt(filterData.clothing_stores_count),
        shoppingMalls: safeParseInt(filterData.shopping_malls_count),
        banksATMs: safeParseInt(filterData.banks_atms_count),
        postOffices: safeParseInt(filterData.post_offices_count),
        beautySalons: safeParseInt(filterData.beauty_salons_count),
        density: filterData.shops_density 
      },
      
      utilities: {
        qualityRating: safeParseFloat(filterData.utilities_quality_rating),
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
  return districts.map(transformDistrictForDisplay);
};

export const getFlatFilterData = (district) => {
  if (!district || !district.filterData) return null;
  
  if (district.filterData.property_price !== undefined) {
    return district.filterData;
  }
  
  return district.filterData; 
};