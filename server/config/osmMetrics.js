export const TRANSPORT_METRICS = [
    { db: 'bus_stops_count', filter: e => e.tags.highway === 'bus_stop' || e.tags.public_transport === 'platform' || e.tags.public_transport === 'stop_position' },
    { db: 'tram_stops_count', filter: e => e.tags.railway === 'tram_stop' || (e.tags.public_transport === 'platform' && e.tags.tram === 'yes') },
    { db: 'metro_stations_count', filter: e => e.tags.station === 'subway' || e.tags.railway === 'subway' },
    { db: 'parking_spots_count', filter: e => e.tags.amenity === 'parking' || e.tags.amenity === 'parking_space' },
    { db: 'bike_rental_stations_count', filter: e => e.tags.amenity === 'bicycle_rental' || e.tags.vending === 'bicycle' },
    { db: 'ev_charging_stations_count', filter: e => e.tags.amenity === 'charging_station' },
    { db: 'police_stations_count', filter: e => e.tags.amenity === 'police' },
    { db: 'cctv_count', filter: e => e.tags.man_made === 'surveillance' || e.tags.camera === 'surveillance' },
];

export const COMMERCE_METRICS = [
    { db: 'grocery_stores_count', filter: e => ['supermarket', 'convenience', 'grocery', 'deli', 'greengrocer', 'bakery', 'butcher', 'kiosk'].includes(e.tags.shop) },
    { db: 'markets_count', filter: e => e.tags.amenity === 'marketplace' },
    { db: 'shopping_malls_count', filter: e => e.tags.shop === 'mall' || e.tags.shop === 'department_store' },
    { db: 'beauty_salons_count', filter: e => ['hairdresser', 'beauty', 'cosmetics', 'massage', 'tattoo'].includes(e.tags.shop) },
    { db: 'pet_stores_count', filter: e => e.tags.shop === 'pet' || e.tags.amenity === 'veterinary' },
    { db: 'cafes_restaurants_count', filter: e => ['cafe', 'restaurant', 'bar', 'fast_food', 'pub', 'food_court', 'ice_cream'].includes(e.tags.amenity) },
    { db: 'banks_atms_count', filter: e => ['bank', 'atm'].includes(e.tags.amenity) },
    { db: 'post_offices_count', filter: e => e.tags.amenity === 'post_office' || e.tags.amenity === 'post_box' },
    { db: 'parcel_lockers_count', filter: e => e.tags.amenity === 'parcel_locker' || e.tags.vending === 'parcel_pickup' },
    { db: 'coworking_spaces_count', filter: e => e.tags.amenity === 'coworking_space' || e.tags.office === 'coworking' },
];

export const LIFESTYLE_METRICS = [
    { db: 'schools_count', filter: e => e.tags.amenity === 'school' || e.tags.building === 'school' },
    { db: 'kindergartens_count', filter: e => e.tags.amenity === 'kindergarten' || e.tags.building === 'kindergarten' || e.tags.amenity === 'childcare' },
    { db: 'universities_count', filter: e => ['university', 'college'].includes(e.tags.amenity) || ['university', 'college'].includes(e.tags.building) },
    { db: 'hospitals_count', filter: e => e.tags.amenity === 'hospital' || e.tags.healthcare === 'hospital' || e.tags.building === 'hospital' },
    { db: 'clinics_count', filter: e => ['clinic', 'doctors', 'dentist'].includes(e.tags.amenity) || ['clinic', 'doctor', 'dentist', 'physiotherapist'].includes(e.tags.healthcare) },
    { db: 'pharmacies_count', filter: e => e.tags.amenity === 'pharmacy' || e.tags.healthcare === 'pharmacy' },
    { db: 'vet_clinics_count', filter: e => e.tags.amenity === 'veterinary' },
    { db: 'parks_count', filter: e => ['park', 'nature_reserve'].includes(e.tags.leisure) || ['village_green', 'recreation_ground'].includes(e.tags.landuse) },
    { db: 'playgrounds_count', filter: e => e.tags.leisure === 'playground' },
    { db: 'gyms_count', filter: e => e.tags.leisure === 'fitness_centre' || e.tags.sport === 'fitness' || e.tags.club === 'sport' },
    { db: 'outdoor_gyms_count', filter: e => ['pitch', 'fitness_station', 'sports_centre'].includes(e.tags.leisure) },
    { db: 'swimming_pools_count', filter: e => e.tags.sport === 'swimming' || e.tags.leisure === 'swimming_pool' || e.tags.amenity === 'swimming_pool' },
    { db: 'sports_facilities_count', filter: e => ['sports_centre', 'stadium', 'track'].includes(e.tags.leisure) },
    { db: 'cinemas_count', filter: e => e.tags.amenity === 'cinema' },
    { db: 'theaters_count', filter: e => ['theatre', 'arts_centre'].includes(e.tags.amenity) },
    { db: 'museums_count', filter: e => e.tags.tourism === 'museum' || e.tags.tourism === 'gallery' },
    { db: 'libraries_count', filter: e => e.tags.amenity === 'library' },
    { db: 'churches_count', filter: e => e.tags.amenity === 'place_of_worship' || e.tags.building === 'church' },
];

export const ALL_METRICS = [...TRANSPORT_METRICS, ...COMMERCE_METRICS, ...LIFESTYLE_METRICS];