import { getFlatFilterData } from './dataTransformers';

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return districtsList;
  }

  return districtsList.filter(district => {
    const data = getFlatFilterData(district);
    
    if (!data) return false;

    if (filters.education) {
      const f = filters.education;
      
      if (f.kindergartens && !data.kindergartens_count) return false;
      if (f.schools && !data.schools_count) return false;
      if (f.universities && !data.universities_count) return false;
      
      if (f.minKindergartens && (data.kindergartens_count || 0) < f.minKindergartens) return false;
      if (f.minSchools && (data.schools_count || 0) < f.minSchools) return false;
      if (f.minUniversities && (data.universities_count || 0) < f.minUniversities) return false;
      
      if (f.minRating && (data.education_rating || 0) < f.minRating) return false;
    }

    if (filters.medicine) {
      const f = filters.medicine;
      
      if (f.hospitals && !data.hospitals_count) return false;
      if (f.clinics && !data.clinics_count) return false;
      if (f.pharmacies && !data.pharmacies_count) return false;
      if (f.emergency && !data.emergency_services_count) return false;
      
      if (f.minHospitals && (data.hospitals_count || 0) < f.minHospitals) return false;
      if (f.minClinics && (data.clinics_count || 0) < f.minClinics) return false;
      
      if (f.minRating && (data.medicine_rating || 0) < f.minRating) return false;
    }

    if (filters.transport) {
      const f = filters.transport;
      
      if (f.bus_stops && !data.bus_stops_count) return false;
      if (f.tram_stops && !data.tram_stops_count) return false;
      if (f.metro && !data.metro_stations_count) return false;
      if (f.bike_lanes && !data.bike_lanes_km) return false;
      if (f.parking && !data.parking_spots_count) return false;
      
      if (f.maxDistance && data.transport_average_distance_m > f.maxDistance) return false;
      
      if (f.frequency && f.frequency !== 'any') {
        const freq = data.transport_frequency || 'medium'; 
        if (f.frequency === 'high' && freq !== 'high') return false;
        if (f.frequency === 'medium' && freq !== 'medium') return false;
        if (f.frequency === 'low' && freq !== 'low') return false;
      }
      
      if (f.minRating && (data.transport_rating || 0) < f.minRating) return false;
    }

    if (filters.safety) {
      const f = filters.safety;
      
      if (f.police && !data.police_stations_count) return false;
      if (f.cctv && !data.cctv_count) return false;
      if (f.lighting && (data.street_lighting_rating || 0) < 5) return false;
      
      if (f.crimeLevel && f.crimeLevel !== 'any') {
        const levelNum = data.crime_level || 5;
        let level = 'medium';
        if (levelNum <= 3) level = 'low';
        else if (levelNum > 6) level = 'high';
        
        if (f.crimeLevel !== level) return false;
      }
      
      if (f.minRating && (data.safety_rating || 0) < f.minRating) return false;
    }

    if (filters.social) {
      const f = filters.social;
      
      if (f.parks && !data.parks_count) return false;
      if (f.cafes && !data.cafes_restaurants_count) return false;
      if (f.playgrounds && !data.playgrounds_count) return false;
      if (f.sports && !data.sports_facilities_count) return false;
      if (f.libraries && !data.libraries_count) return false;
      if (f.cinemas && !data.cinemas_count) return false;
      if (f.theaters && !data.theaters_count) return false;
      if (f.museums && !data.museums_count) return false;
      
      if (f.minParks && (data.parks_count || 0) < f.minParks) return false;
      if (f.minParkSize && (data.average_park_size_sqm || 0) < f.minParkSize) return false;
      
      if (f.minRating && (data.social_rating || 0) < f.minRating) return false;
    }

    if (filters.commerce) {
      const f = filters.commerce;
      
      if (f.groceries && !data.grocery_stores_count) return false;
      if (f.construction && !data.construction_stores_count) return false;
      if (f.clothing && !data.clothing_stores_count) return false;
      if (f.postOffices && !data.post_offices_count) return false;
      if (f.banks && !data.banks_atms_count) return false;
      if (f.beauty && !data.beauty_salons_count) return false;
      
      if (f.minGroceryStores && (data.grocery_stores_count || 0) < f.minGroceryStores) return false;
      
      if (f.density && f.density !== 'any') {
        const density = data.shops_density || 'medium';
        if (f.density !== density) return false;
      }
      
      if (f.minRating && (data.commerce_rating || 0) < f.minRating) return false;
    }

    if (filters.utilities) {
      const f = filters.utilities;
      
      if (f.water && !data.has_water_supply) return false;
      if (f.heating && !data.has_heating) return false;
      if (f.electricity && !data.has_electricity) return false;
      if (f.gas && !data.has_gas_supply) return false;
      if (f.waste && !data.has_waste_removal) return false;
      
      if (f.quality && f.quality !== 'any') {
        const qNum = data.utilities_quality_rating || 5;
        let quality = 'medium';
        if (qNum >= 8) quality = 'good';
        else if (qNum < 5) quality = 'poor';
        
        if (f.quality === 'good' && quality !== 'good') return false;
        if (f.quality === 'average' && quality !== 'average') return false;
        if (f.quality === 'poor' && quality !== 'poor') return false;
      }
      
      const cost = data.utilities_cost_per_sqm;
      if (f.minCost !== undefined && (!cost || cost < f.minCost)) return false;
      if (f.maxCost !== undefined && (!cost || cost > f.maxCost)) return false;
    }
    return true;
  });
};