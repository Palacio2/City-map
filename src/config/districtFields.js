export const DISTRICT_CATEGORIES = {
  education: {
    key: 'education',
    icon: '🎓',
    isPremium: true,
    ratingDbKey: 'education_rating',
    fields: [
      { key: 'schools', dbKey: 'schools_count', type: 'number' },
      { key: 'kindergartens', dbKey: 'kindergartens_count', type: 'number' },
      { key: 'universities', dbKey: 'universities_count', type: 'number' },
    ]
  },
  medicine: {
    key: 'medicine',
    icon: '🏥',
    isPremium: false,
    ratingDbKey: 'medicine_rating',
    fields: [
      { key: 'hospitals', dbKey: 'hospitals_count', type: 'number' },
      { key: 'pharmacies', dbKey: 'pharmacies_count', type: 'number' },
      { key: 'clinics', dbKey: 'clinics_count', type: 'number', isPremiumField: true },
    ]
  },
  transport: {
    key: 'transport',
    icon: '🚌',
    isPremium: false,
    ratingDbKey: 'transport_rating',
    fields: [
      { key: 'busStops', dbKey: 'bus_stops_count', type: 'number' },
      { key: 'tramStops', dbKey: 'tram_stops_count', type: 'number', isPremiumField: true },
      { key: 'metroStations', dbKey: 'metro_stations_count', type: 'number', isPremiumField: true },
      { key: 'parkingSpots', dbKey: 'parking_spots_count', type: 'number' },
      { key: 'bikeLanes', dbKey: 'bike_lanes_km', type: 'number', isPremiumField: true },
      { key: 'bikeRental', dbKey: 'bike_rental_stations_count', type: 'number', isPremiumField: true },
      { key: 'evCharging', dbKey: 'ev_charging_stations_count', type: 'number', isPremiumField: true },
      { key: 'transportFrequency', dbKey: 'transport_frequency', type: 'text', isPremiumField: true },
      { key: 'transportAvgDistance', dbKey: 'transport_average_distance_m', type: 'number', isPremiumField: true },
    ]
  },
  commerce: {
    key: 'commerce',
    icon: '🛍️',
    isPremium: false,
    ratingDbKey: 'commerce_rating',
    fields: [
      { key: 'groceryStores', dbKey: 'grocery_stores_count', type: 'number' },
      { key: 'markets', dbKey: 'markets_count', type: 'number' },
      { key: 'shoppingMalls', dbKey: 'shopping_malls_count', type: 'number' },
      { key: 'parcelLockers', dbKey: 'parcel_lockers_count', type: 'number', isPremiumField: true },
      { key: 'coworking', dbKey: 'coworking_spaces_count', type: 'number', isPremiumField: true },
      { key: 'banksATMs', dbKey: 'banks_atms_count', type: 'number', isPremiumField: true },
      { key: 'postOffices', dbKey: 'post_offices_count', type: 'number', isPremiumField: true },
      { key: 'cafesRestaurants', dbKey: 'cafes_restaurants_count', type: 'number', isPremiumField: true },
      { key: 'beautySalons', dbKey: 'beauty_salons_count', type: 'number', isPremiumField: true },
      { key: 'petStores', dbKey: 'pet_stores_count', type: 'number', isPremiumField: true },
      { key: 'vetClinics', dbKey: 'vet_clinics_count', type: 'number', isPremiumField: true },
    ]
  },
  safety: {
    key: 'safety',
    icon: '🛡️',
    isPremium: true,
    ratingDbKey: 'safety_rating',
    fields: [
      { key: 'crimeLevel', dbKey: 'crime_level', type: 'crimeLevel' },
      { key: 'policeStations', dbKey: 'police_stations_count', type: 'number' },
      { key: 'cctv', dbKey: 'cctv_count', type: 'number' },
      { key: 'streetLighting', dbKey: 'street_lighting_rating', type: 'rating_10' },
    ]
  },
  utilities: {
    key: 'utilities',
    icon: '⚡',
    isPremium: true,
    ratingDbKey: 'utilities_quality_rating',
    fields: [
      { key: 'propertyPricePerSqm', dbKey: 'average_sale_price_sqm', type: 'price', isRealtorOnly: true },
      { key: 'costPerSqm', dbKey: 'utilities_cost_per_sqm', type: 'price', isRealtorOnly: true },
      { key: 'hasWaterSupply', dbKey: 'has_water_supply', type: 'boolean' },
      { key: 'hasElectricity', dbKey: 'has_electricity', type: 'boolean' },
      { key: 'hasHeating', dbKey: 'has_heating', type: 'boolean' },
      { key: 'hasGasSupply', dbKey: 'has_gas_supply', type: 'boolean' },
      { key: 'hasWasteRemoval', dbKey: 'has_waste_removal', type: 'boolean' },
    ]
  },
  social: {
    key: 'social',
    icon: '🌳',
    isPremium: true,
    ratingDbKey: 'social_rating',
    fields: [
      { key: 'parks', dbKey: 'parks_count', type: 'number' },
      { key: 'playgrounds', dbKey: 'playgrounds_count', type: 'number' },
      { key: 'avgParkSize', dbKey: 'average_park_size_sqm', type: 'number', isPremiumField: true },
      { key: 'gyms', dbKey: 'gyms_count', type: 'number' },
      { key: 'swimmingPools', dbKey: 'swimming_pools_count', type: 'number' },
      { key: 'outdoorGyms', dbKey: 'outdoor_gyms_count', type: 'number' },
      { key: 'cinemas', dbKey: 'cinemas_count', type: 'number', isPremiumField: true },
      { key: 'theaters', dbKey: 'theaters_count', type: 'number', isPremiumField: true },
      { key: 'museums', dbKey: 'museums_count', type: 'number', isPremiumField: true },
      { key: 'libraries', dbKey: 'libraries_count', type: 'number', isPremiumField: true },
      { key: 'churches', dbKey: 'churches_count', type: 'number', isPremiumField: true },
      { key: 'airQuality', dbKey: 'air_quality', type: 'text', isPremiumField: true },
    ]
  }
};