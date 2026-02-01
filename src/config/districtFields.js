export const DISTRICT_CATEGORIES = {
  education: {
    key: 'education',
    icon: '🎓',
    isPremium: true,
    fields: [
      { key: 'schools', type: 'number' },
      { key: 'kindergartens', type: 'number' },
      { key: 'universities', type: 'number' },
    ]
  },
  medicine: {
    key: 'medicine',
    icon: '🏥',
    isPremium: false,
    fields: [
      { key: 'hospitals', type: 'number' },
      { key: 'pharmacies', type: 'number' },
      { key: 'clinics', type: 'number', isPremiumField: true },
      // emergencyServices видалено
    ]
  },
  transport: {
    key: 'transport',
    icon: '🚌',
    isPremium: false,
    fields: [
      { key: 'busStops', type: 'number' },
      { key: 'tramStops', type: 'number', isPremiumField: true },
      { key: 'metroStations', type: 'number', isPremiumField: true },
      { key: 'parkingSpots', type: 'number' },
      { key: 'bikeLanes', type: 'number', isPremiumField: true },
      { key: 'bikeRental', type: 'number', isPremiumField: true }, // 🆕 Велопрокат
      { key: 'evCharging', type: 'number', isPremiumField: true }, // 🆕 Зарядки авто
      { key: 'transportFrequency', type: 'text', isPremiumField: true },
      { key: 'transportAvgDistance', type: 'number', isPremiumField: true },
    ]
  },
  commerce: {
    key: 'commerce',
    icon: '🛍️',
    isPremium: false,
    fields: [
      { key: 'groceryStores', type: 'number' },
      { key: 'markets', type: 'number' }, // 🆕 Ринки
      { key: 'shoppingMalls', type: 'number' },
      { key: 'parcelLockers', type: 'number', isPremiumField: true }, // 🆕 Поштомати
      { key: 'coworking', type: 'number', isPremiumField: true },     // 🆕 Коворкінги
      { key: 'banksATMs', type: 'number', isPremiumField: true },
      { key: 'postOffices', type: 'number', isPremiumField: true },
      { key: 'cafesRestaurants', type: 'number', isPremiumField: true },
      { key: 'beautySalons', type: 'number', isPremiumField: true },
      { key: 'petStores', type: 'number', isPremiumField: true },     // 🆕 Зоомагазини
      { key: 'vetClinics', type: 'number', isPremiumField: true },    // 🆕 Ветклініки
      // constructionStores та clothingStores видалено
    ]
  },
  safety: {
    key: 'safety',
    icon: '🛡️',
    isPremium: true,
    fields: [
      { key: 'crimeLevel', type: 'crimeLevel' },
      { key: 'policeStations', type: 'number' },
      { key: 'cctv', type: 'number' },
      { key: 'streetLighting', type: 'rating_10' },
    ]
  },
  utilities: {
    key: 'utilities',
    icon: '⚡',
    isPremium: true,
    fields: [
      { key: 'propertyPricePerSqm', type: 'price', isRealtorOnly: true },
      { key: 'costPerSqm', type: 'price', isRealtorOnly: true },
      { key: 'hasWaterSupply', type: 'boolean' },
      { key: 'hasElectricity', type: 'boolean' },
      { key: 'hasHeating', type: 'boolean' },
      { key: 'hasGasSupply', type: 'boolean' },
      { key: 'hasWasteRemoval', type: 'boolean' },
    ]
  },
  social: {
    key: 'social',
    icon: '🌳',
    isPremium: true,
    fields: [
      { key: 'parks', type: 'number' },
      { key: 'playgrounds', type: 'number' },
      { key: 'avgParkSize', type: 'number', isPremiumField: true },
      { key: 'gyms', type: 'number' },           // 🆕 Спортзали
      { key: 'swimmingPools', type: 'number' },  // 🆕 Басейни
      { key: 'outdoorGyms', type: 'number' },    // 🆕 Воркаут
      { key: 'cinemas', type: 'number', isPremiumField: true },
      { key: 'theaters', type: 'number', isPremiumField: true },
      { key: 'museums', type: 'number', isPremiumField: true },
      { key: 'libraries', type: 'number', isPremiumField: true },
      { key: 'churches', type: 'number', isPremiumField: true }, // 🆕 Церкви
      { key: 'airQuality', type: 'text', isPremiumField: true },
    ]
  }
};