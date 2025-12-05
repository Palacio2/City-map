// src/utils/filterUtils.js

export const filterDistrictsByCriteria = (districtsList, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return districtsList;
  }

  return districtsList.filter(district => {
    if (!district.filterData) return false;

    const {
      education = {},
      transport = {},
      safety = {},
      social = {},
      medicine = {},
      commerce = {}
    } = district.filterData;

    // Освіта
    if (filters.education) {
      const eduFilters = filters.education;
      if (eduFilters.kindergartens && (!education.kindergartens || education.kindergartens === 0)) return false;
      if (eduFilters.schools && (!education.schools || education.schools === 0)) return false;
      if (eduFilters.universities && (!education.universities || education.universities === 0)) return false;
      if (eduFilters.minRating && education.rating < eduFilters.minRating) return false;
    }

    // Медицина
    if (filters.medicine) {
      const medFilters = filters.medicine;
      if (medFilters.hospitals && (!medicine.hospitals || medicine.hospitals === 0)) return false;
      if (medFilters.clinics && (!medicine.clinics || medicine.clinics === 0)) return false;
      if (medFilters.minRating && medicine.rating < medFilters.minRating) return false;
    }

    // Транспорт
    if (filters.transport) {
      const transFilters = filters.transport;
      if (transFilters.bus_stops && (!transport.busStops || transport.busStops === 0)) return false;
      if (transFilters.metro && (!transport.metroStations || transport.metroStations === 0)) return false;
      if (transFilters.minRating && transport.rating < transFilters.minRating) return false;
    }

    // Безпека
    if (filters.safety) {
      const safetyFilters = filters.safety;
      if (safetyFilters.police && (!safety.policeStations || safety.policeStations === 0)) return false;
      if (safetyFilters.minRating && safety.rating < safetyFilters.minRating) return false;

      if (safetyFilters.crimeLevel && safetyFilters.crimeLevel !== 'any') {
        const crimeLevel = safety.crimeLevel || 5;
        if (safetyFilters.crimeLevel === 'low' && crimeLevel > 3) return false;
        if (safetyFilters.crimeLevel === 'medium' && (crimeLevel <= 3 || crimeLevel > 6)) return false;
        if (safetyFilters.crimeLevel === 'high' && crimeLevel <= 6) return false;
      }
    }

    // Соціальна інфраструктура
    if (filters.social) {
      const socialFilters = filters.social;
      if (socialFilters.parks && (!social.parks || social.parks === 0)) return false;
      if (socialFilters.cafes && (!social.cafesRestaurants || social.cafesRestaurants === 0)) return false;
      if (socialFilters.minRating && social.rating < socialFilters.minRating) return false;
    }

    // Комерція
    if (filters.commerce) {
      const commerceFilters = filters.commerce;
      if (commerceFilters.groceries && (!commerce.groceryStores || commerce.groceryStores === 0)) return false;
      if (commerceFilters.banks && (!commerce.banksATMs || commerce.banksATMs === 0)) return false;
      if (commerceFilters.minRating && commerce.rating < commerceFilters.minRating) return false;
    }

    return true;
  });
};
