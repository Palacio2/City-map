import L from 'leaflet';
import { METRIC_GROUPS } from '../../config/metricsConfig';

export const ICON_MAP = {
    hospitals_count: '🏥', clinics_count: '🩺', pharmacies_count: '💊', vet_clinics_count: '🐕',
    schools_count: '🏫', kindergartens_count: '🧸', universities_count: '🎓',
    bus_stops_count: '🚌', tram_stops_count: '🚋', metro_stations_count: '🚇',
    parking_spots_count: '🅿️', bike_rental_stations_count: '🚲', ev_charging_stations_count: '⚡',
    grocery_stores_count: '🛒', markets_count: '🍎', shopping_malls_count: '🛍️',
    beauty_salons_count: '💇‍♀️', pet_stores_count: '🐾', cafes_restaurants_count: '☕',
    banks_atms_count: '🏧', post_offices_count: '📮', parcel_lockers_count: '📦', coworking_spaces_count: '💻',
    parks_count: '🌳', playgrounds_count: '🛝', gyms_count: '🏋️', outdoor_gyms_count: '🤸‍♂️', 
    swimming_pools_count: '🏊', sports_facilities_count: '🏟️',
    cinemas_count: '🍿', theaters_count: '🎭', museums_count: '🖼️', libraries_count: '📚',
    churches_count: '⛪', police_stations_count: '🚓', cctv_count: '📹',
    default: '📍'
};

export const getLabelForKey = (key) => {
    try {
        for (const group of METRIC_GROUPS) {
            const field = group.fields.find(f => f.key === key);
            if (field) return field.label;
        }
    } catch (e) {
        console.error('Error finding label for key:', key, e);
    }
    return key;
};

export const createEmojiIcon = (type, source) => {
    const emoji = ICON_MAP[type] || ICON_MAP.default;
    
    // Ручні точки виділяємо яскравіше, ніж точки від парсера
    const isManual = source === 'manual';
    const bg = isManual ? '#3b82f6' : '#ffffff';
    const border = isManual ? '#ffffff' : '#cbd5e1';
    const shadow = isManual ? '0 4px 8px rgba(59, 130, 246, 0.5)' : '0 2px 4px rgba(0,0,0,0.2)';
    const scale = isManual ? 'scale(1.1)' : 'scale(1)';
    const zIndex = isManual ? '1000' : '500';

    const htmlString = `
        <div style="
            font-size: 16px; 
            background: ${bg}; 
            border: 2px solid ${border}; 
            border-radius: 50%; 
            width: 32px; 
            height: 32px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: ${shadow}; 
            cursor: pointer; 
            transform: ${scale};
            transition: all 0.2s ease;
            position: relative;
            z-index: ${zIndex};
        ">
            ${emoji}
        </div>
    `;

    return L.divIcon({
        html: htmlString,
        className: 'custom-poi-icon', // Can be used for global hover effects if needed
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        tooltipAnchor: [0, -16]
    });
};