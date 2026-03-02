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

export const METRIC_GROUPS = [
    {
        id: 'finance', label: 'Фінанси та Статистика', icon: '💰', bgColor: '#fffbeb',
        fields: [
            { key: 'average_rent_price', label: 'Оренда (zł)', type: 'float' },
            { key: 'average_sale_price_sqm', label: 'Продаж (zł/м²)', type: 'float' },
            { key: 'average_property_price', label: 'Ціна (Заг.)', type: 'float' },
            { key: 'average_salary', label: 'Зарплата (zł)', type: 'float' },
            { key: 'unemployment_rate', label: 'Безробіття (%)', type: 'float' }
        ]
    },
    {
        id: 'eco', label: 'Екологія та Базові', icon: '🏗️',
        fields: [
            { key: 'population', label: 'Населення', type: 'number' },
            { key: 'population_density', label: 'Щільність', type: 'number' },
            { key: 'air_quality', label: 'AQI (Повітря)', type: 'number' },
            { key: 'green_spaces_percent', label: '% Зелені', type: 'float' },
            { key: 'average_park_size_sqm', label: 'Площа парків(м²)', type: 'float' },
            { key: 'utilities_cost_per_sqm', label: 'Комуналка (м²)', type: 'float' }
        ]
    },
    {
        id: 'utilities', label: 'Комунікації', icon: '🚰',
        fields: [
            { key: 'has_water_supply', label: 'Водопостачання', type: 'boolean' },
            { key: 'has_heating', label: 'Опалення', type: 'boolean' },
            { key: 'has_electricity', label: 'Електрика', type: 'boolean' },
            { key: 'has_gas_supply', label: 'Газ', type: 'boolean' },
            { key: 'has_waste_removal', label: 'Вивіз сміття', type: 'boolean' }
        ]
    },
    {
        id: 'security', label: 'Безпека', icon: '🛡️',
        fields: [
            { key: 'police_stations_count', label: 'Поліція', type: 'number' },
            { key: 'cctv_count', label: 'Камери', type: 'number' },
            { key: 'crime_level', label: 'Злочинність', type: 'float' }
        ]
    },
    {
        id: 'education', label: 'Освіта', icon: '🎓',
        fields: [
            { key: 'schools_count', label: 'Школи', type: 'number' },
            { key: 'kindergartens_count', label: 'Садки', type: 'number' },
            { key: 'universities_count', label: 'ВНЗ', type: 'number' }
        ]
    },
    {
        id: 'medicine', label: 'Медицина', icon: '🏥',
        fields: [
            { key: 'hospitals_count', label: 'Лікарні', type: 'number' },
            { key: 'clinics_count', label: 'Клініки', type: 'number' },
            { key: 'pharmacies_count', label: 'Аптеки', type: 'number' },
            { key: 'vet_clinics_count', label: 'Вет.клініки', type: 'number' }
        ]
    },
    {
        id: 'transport', label: 'Транспорт', icon: '🚌',
        fields: [
            { key: 'bus_stops_count', label: 'Автобус', type: 'number' },
            { key: 'tram_stops_count', label: 'Трамвай', type: 'number' },
            { key: 'metro_stations_count', label: 'Метро', type: 'number' },
            { key: 'parking_spots_count', label: 'Паркінг', type: 'number' },
            { key: 'bike_rental_stations_count', label: 'Велопрокат', type: 'number' },
            { key: 'ev_charging_stations_count', label: 'Зарядки EV', type: 'number' },
            { key: 'bike_lanes_km', label: 'Велодоріжки(км)', type: 'float' },
            { key: 'transport_average_distance_m', label: 'Відстань до зуп.(м)', type: 'number' }
        ]
    },
    {
        id: 'commerce', label: 'Комерція', icon: '🛍️',
        fields: [
            { key: 'grocery_stores_count', label: 'Продукти', type: 'number' },
            { key: 'shopping_malls_count', label: 'ТЦ', type: 'number' },
            { key: 'beauty_salons_count', label: 'Краса', type: 'number' },
            { key: 'pet_stores_count', label: 'Зоомагазини', type: 'number' },
            { key: 'markets_count', label: 'Ринки', type: 'number' }
        ]
    },
    {
        id: 'services', label: 'Послуги', icon: '☕',
        fields: [
            { key: 'cafes_restaurants_count', label: 'Кафе/Рест.', type: 'number' },
            { key: 'banks_atms_count', label: 'Банки/АТМ', type: 'number' },
            { key: 'post_offices_count', label: 'Пошта', type: 'number' },
            { key: 'parcel_lockers_count', label: 'Поштомати', type: 'number' },
            { key: 'coworking_spaces_count', label: 'Коворкінги', type: 'number' }
        ]
    },
    {
        id: 'leisure', label: 'Дозвілля', icon: '🌳',
        fields: [
            { key: 'parks_count', label: 'Парки', type: 'number' },
            { key: 'playgrounds_count', label: 'Майданчики', type: 'number' },
            { key: 'gyms_count', label: 'Спортзали', type: 'number' },
            { key: 'outdoor_gyms_count', label: 'Вул. Спорт', type: 'number' },
            { key: 'swimming_pools_count', label: 'Басейни', type: 'number' },
            { key: 'sports_facilities_count', label: 'Спорт. бази', type: 'number' },
            { key: 'cinemas_count', label: 'Кіно', type: 'number' },
            { key: 'theaters_count', label: 'Театри', type: 'number' },
            { key: 'museums_count', label: 'Музеї', type: 'number' },
            { key: 'libraries_count', label: 'Бібліотеки', type: 'number' },
            { key: 'churches_count', label: 'Церкви', type: 'number' }
        ]
    }
];