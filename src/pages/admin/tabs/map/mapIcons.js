// mapIcons.js
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
    
    const isManual = source === 'manual';
    const bg = isManual ? '#eff6ff' : '#ffffff';
    const border = isManual ? '#3b82f6' : '#cbd5e1';
    const shadow = isManual ? '0 8px 16px rgba(59, 130, 246, 0.25)' : '0 4px 6px rgba(0,0,0,0.08)';
    const zIndex = isManual ? '1000' : '500';

    const htmlString = `
        <div style="
            font-size: 18px; 
            background: ${bg}; 
            border: 2.5px solid ${border}; 
            border-radius: 50%; 
            width: 36px; 
            height: 36px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: ${shadow}; 
            cursor: ${isManual ? 'grab' : 'pointer'}; 
            transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            z-index: ${zIndex};
        " onmouseover="this.style.transform='scale(1.15) translateY(-2px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.boxShadow='${shadow}';">
            ${emoji}
        </div>
    `;

    return L.divIcon({
        html: htmlString,
        className: '', 
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        tooltipAnchor: [0, -20]
    });
};