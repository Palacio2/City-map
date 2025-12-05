import { getFlatFilterData } from './dataTransformers';

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return districtsList;
  }

  return districtsList.filter(district => {
    const filterData = getFlatFilterData(district);
    if (!filterData) return false;

    const {
      // Освіта
      kindergartens_count,
      schools_count,
      universities_count,
      education_rating,
      
      // Медицина
      hospitals_count,
      clinics_count,
      pharmacies_count,
      emergency_services_count,
      medicine_rating,
      
      // Транспорт
      bus_stops_count,
      tram_stops_count,
      metro_stations_count,
      bike_lanes_km,
      parking_spots_count,
      transport_average_distance_m,
      transport_frequency,
      transport_rating,
      
      // Соціальна інфраструктура
      parks_count,
      average_park_size_sqm,
      playgrounds_count,
      sports_facilities_count,
      cafes_restaurants_count,
      libraries_count,
      cinemas_count,
      theaters_count,
      museums_count,
      social_rating,
      
      // Безпека
      crime_level,
      police_stations_count,
      cctv_count,
      street_lighting_rating,
      safety_rating,
      
      // Комерція
      grocery_stores_count,
      construction_stores_count,
      clothing_stores_count,
      shopping_malls_count,
      banks_atms_count,
      post_offices_count,
      beauty_salons_count,
      shops_density,
      commerce_rating,
      
      // Комунальні послуги
      utilities_quality_rating,
      utilities_cost_per_sqm,
      has_water_supply,
      has_heating,
      has_electricity,
      has_gas_supply,
      has_waste_removal
    } = filterData;

    // Освіта
    if (filters.education) {
      const eduFilters = filters.education;
      if (eduFilters.kindergartens && (!kindergartens_count || kindergartens_count === 0)) return false;
      if (eduFilters.schools && (!schools_count || schools_count === 0)) return false;
      if (eduFilters.universities && (!universities_count || universities_count === 0)) return false;
      
      if (eduFilters.minKindergartens && (!kindergartens_count || kindergartens_count < eduFilters.minKindergartens)) return false;
      if (eduFilters.minSchools && (!schools_count || schools_count < eduFilters.minSchools)) return false;
      if (eduFilters.minUniversities && (!universities_count || universities_count < eduFilters.minUniversities)) return false;
      
      if (eduFilters.minRating && (!education_rating || education_rating < eduFilters.minRating)) return false;
    }

    // Медицина
    if (filters.medicine) {
      const medFilters = filters.medicine;
      if (medFilters.hospitals && (!hospitals_count || hospitals_count === 0)) return false;
      if (medFilters.clinics && (!clinics_count || clinics_count === 0)) return false;
      if (medFilters.pharmacies && (!pharmacies_count || pharmacies_count === 0)) return false;
      if (medFilters.emergency && (!emergency_services_count || emergency_services_count === 0)) return false;
      
      if (medFilters.minHospitals && (!hospitals_count || hospitals_count < medFilters.minHospitals)) return false;
      if (medFilters.minClinics && (!clinics_count || clinics_count < medFilters.minClinics)) return false;
      
      if (medFilters.minRating && (!medicine_rating || medicine_rating < medFilters.minRating)) return false;
    }

    // Транспорт
    if (filters.transport) {
      const transFilters = filters.transport;
      if (transFilters.bus_stops && (!bus_stops_count || bus_stops_count === 0)) return false;
      if (transFilters.tram_stops && (!tram_stops_count || tram_stops_count === 0)) return false;
      if (transFilters.metro && (!metro_stations_count || metro_stations_count === 0)) return false;
      if (transFilters.bike_lanes && (!bike_lanes_km || bike_lanes_km === 0)) return false;
      if (transFilters.parking && (!parking_spots_count || parking_spots_count === 0)) return false;
      
      if (transFilters.maxDistance && transport_average_distance_m > transFilters.maxDistance) return false;
      
      if (transFilters.frequency && transFilters.frequency !== 'any') {
        const frequency = transport_frequency || 'medium';
        if (transFilters.frequency === 'high' && frequency !== 'high') return false;
        if (transFilters.frequency === 'medium' && frequency !== 'medium') return false;
        if (transFilters.frequency === 'low' && frequency !== 'low') return false;
      }
      
      if (transFilters.minRating && (!transport_rating || transport_rating < transFilters.minRating)) return false;
    }

    // Безпека
    if (filters.safety) {
      const safetyFilters = filters.safety;
      if (safetyFilters.police && (!police_stations_count || police_stations_count === 0)) return false;
      if (safetyFilters.cctv && (!cctv_count || cctv_count === 0)) return false;
      if (safetyFilters.lighting && (!street_lighting_rating || street_lighting_rating < 5)) return false;
      
      if (safetyFilters.crimeLevel && safetyFilters.crimeLevel !== 'any') {
        const crimeLevelNum = crime_level || 5;
        let crimeLevel = 'medium';
        if (crimeLevelNum <= 3) crimeLevel = 'low';
        else if (crimeLevelNum <= 6) crimeLevel = 'medium';
        else crimeLevel = 'high';
        
        if (safetyFilters.crimeLevel === 'low' && crimeLevel !== 'low') return false;
        if (safetyFilters.crimeLevel === 'medium' && crimeLevel !== 'medium') return false;
        if (safetyFilters.crimeLevel === 'high' && crimeLevel !== 'high') return false;
      }
      
      if (safetyFilters.minRating && (!safety_rating || safety_rating < safetyFilters.minRating)) return false;
    }

    // Соціальна інфраструктура
    if (filters.social) {
      const socialFilters = filters.social;
      if (socialFilters.parks && (!parks_count || parks_count === 0)) return false;
      if (socialFilters.cafes && (!cafes_restaurants_count || cafes_restaurants_count === 0)) return false;
      if (socialFilters.playgrounds && (!playgrounds_count || playgrounds_count === 0)) return false;
      if (socialFilters.sports && (!sports_facilities_count || sports_facilities_count === 0)) return false;
      if (socialFilters.libraries && (!libraries_count || libraries_count === 0)) return false;
      if (socialFilters.cinemas && (!cinemas_count || cinemas_count === 0)) return false;
      if (socialFilters.theaters && (!theaters_count || theaters_count === 0)) return false;
      if (socialFilters.museums && (!museums_count || museums_count === 0)) return false;
      
      if (socialFilters.minParks && (!parks_count || parks_count < socialFilters.minParks)) return false;
      if (socialFilters.minParkSize && (!average_park_size_sqm || average_park_size_sqm < socialFilters.minParkSize)) return false;
      
      if (socialFilters.minRating && (!social_rating || social_rating < socialFilters.minRating)) return false;
    }

    // Комерція
    if (filters.commerce) {
      const commerceFilters = filters.commerce;
      if (commerceFilters.groceries && (!grocery_stores_count || grocery_stores_count === 0)) return false;
      if (commerceFilters.construction && (!construction_stores_count || construction_stores_count === 0)) return false;
      if (commerceFilters.clothing && (!clothing_stores_count || clothing_stores_count === 0)) return false;
      if (commerceFilters.postOffices && (!post_offices_count || post_offices_count === 0)) return false;
      if (commerceFilters.banks && (!banks_atms_count || banks_atms_count === 0)) return false;
      if (commerceFilters.beauty && (!beauty_salons_count || beauty_salons_count === 0)) return false;
      
      if (commerceFilters.minGroceryStores && (!grocery_stores_count || grocery_stores_count < commerceFilters.minGroceryStores)) return false;
      
      if (commerceFilters.density && commerceFilters.density !== 'any') {
        const density = shops_density || 'medium';
        if (commerceFilters.density === 'high' && density !== 'high') return false;
        if (commerceFilters.density === 'medium' && density !== 'medium') return false;
        if (commerceFilters.density === 'low' && density !== 'low') return false;
      }
      
      if (commerceFilters.minRating && (!commerce_rating || commerce_rating < commerceFilters.minRating)) return false;
    }

    // Комунальні послуги
    if (filters.utilities) {
      const utilitiesFilters = filters.utilities;
      
      if (utilitiesFilters.water && has_water_supply !== true) return false;
      if (utilitiesFilters.heating && has_heating !== true) return false;
      if (utilitiesFilters.electricity && has_electricity !== true) return false;
      if (utilitiesFilters.gas && has_gas_supply !== true) return false;
      if (utilitiesFilters.waste && has_waste_removal !== true) return false;
      
      if (utilitiesFilters.quality && utilitiesFilters.quality !== 'any') {
        const qualityNum = utilities_quality_rating || 5;
        let quality = 'medium';
        if (qualityNum >= 8) quality = 'good';
        else if (qualityNum >= 5) quality = 'average';
        else quality = 'poor';
        
        if (utilitiesFilters.quality === 'good' && quality !== 'good') return false;
        if (utilitiesFilters.quality === 'average' && quality !== 'average') return false;
        if (utilitiesFilters.quality === 'poor' && quality !== 'poor') return false;
      }
      
      if (utilitiesFilters.minCost !== undefined && (!utilities_cost_per_sqm || utilities_cost_per_sqm < utilitiesFilters.minCost)) return false;
      if (utilitiesFilters.maxCost !== undefined && (!utilities_cost_per_sqm || utilities_cost_per_sqm > utilitiesFilters.maxCost)) return false;
    }

    return true;
  });
};