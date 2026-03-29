import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { geoApi } from '@api/geoApi';
import { FiX, FiFilter, FiCheck } from 'react-icons/fi';
import Loader from '@components/loader/Loader';
import { useSubscription } from '@subscription/SubscriptionContext';
import { DISTRICT_CATEGORIES } from '@config/districtFields';

const ICON_MAP = {
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

const ICON_CACHE = {};

const getEmojiForType = (type) => {
    if (!type) return ICON_MAP.default;
    const base = type.replace('_count', '');
    return ICON_MAP[`${base}_count`] || ICON_MAP[base] || ICON_MAP.default;
};

const getCachedIcon = (type) => {
    const safeType = type || 'default';
    if (!ICON_CACHE[safeType]) {
        const emoji = getEmojiForType(safeType);
        const htmlString = `
            <div class="flex items-center justify-center w-8 h-8 bg-white border-2 border-slate-300 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] text-[16px]">
                ${emoji}
            </div>
        `;
        ICON_CACHE[safeType] = L.divIcon({ html: htmlString, className: 'custom-poi-icon bg-transparent border-none', iconSize: [32, 32], iconAnchor: [16, 16], tooltipAnchor: [0, -16] });
    }
    return ICON_CACHE[safeType];
};

const createCustomClusterIcon = (cluster) => {
  return L.divIcon({
    html: `<div class="bg-accent text-white rounded-full w-10 h-10 flex items-center justify-center font-bold font-sans border-2 border-white shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
            ${cluster.getChildCount()}
          </div>`,
    className: 'custom-marker-cluster bg-transparent border-none',
    iconSize: L.point(40, 40, true),
  });
};

const GEOJSON_STYLE = { color: '#c5a47e', weight: 3, fillColor: '#c5a47e', fillOpacity: 0.15, dashArray: '6, 6' };

const MapUpdater = ({ geoData }) => {
    const map = useMap();
    useEffect(() => {
        if (!geoData || !map) return;
        let bounds = null;
        try {
            if (geoData.geojson) {
                bounds = L.geoJSON(geoData.geojson).getBounds();
            } else if (geoData.poi_data && geoData.poi_data.length > 0) {
                bounds = L.latLngBounds(geoData.poi_data.map(p => p.coord));
            }
            if (bounds && bounds.isValid()) {
                const timer = setTimeout(() => {
                    if (map && map._container) {
                        try {
                            map.invalidateSize();
                            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
                        } catch(e) {}
                    }
                }, 250);
                return () => clearTimeout(timer);
            }
        } catch (e) {}
    }, [geoData, map]);
    return null;
};

const FastMapMarkers = ({ pois, t }) => {
    const map = useMap();
    useEffect(() => {
        if (!pois || pois.length === 0) return;
        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true, iconCreateFunction: createCustomClusterIcon,
            maxClusterRadius: 40, showCoverageOnHover: false, disableClusteringAtZoom: 17, spiderfyOnMaxZoom: true
        });

        const leafletMarkers = pois.map(poi => {
            const marker = L.marker(poi.coord, { icon: getCachedIcon(poi.type) });
            const rawName = (poi.type || 'default').replace('_count', '');
            const labelText = t(`poi_types.${rawName}`, { defaultValue: rawName.replace(/_/g, ' ') });
            // Added tailwind classes to tooltip via className
            marker.bindTooltip(`<strong>${labelText}</strong>`, { direction: 'top', className: 'font-body font-semibold capitalize border-none shadow-md rounded-md px-3 py-1.5 bg-surface text-textMain' });
            return marker;
        });

        clusterGroup.addLayers(leafletMarkers);
        map.addLayer(clusterGroup);
        return () => map.removeLayer(clusterGroup);
    }, [pois, map, t]);
    return null;
};

export default function DistrictGeoMapModal({ isOpen, onClose, districtId, districtName }) {
    const { t } = useTranslation('map');
    const { isFree, isRealtor } = useSubscription();
    
    const [geoData, setGeoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState([]);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    useEffect(() => {
        if (!isOpen || !districtId) return;
        let isMounted = true;
        setLoading(true);

        const fetchGeo = async () => {
            try {
                const data = await geoApi.getDistrictGeoData(districtId);
                
                if (isMounted) {
                    let rawPois = data?.poi_data || [];
                    if (typeof rawPois === 'string') {
                        try { rawPois = JSON.parse(rawPois); } catch(e) { rawPois = []; }
                    }
                    if (!Array.isArray(rawPois)) rawPois = [];

                    const normalizedPois = [];
                    rawPois.forEach(poi => {
                        try {
                            let type, lat, lon;
                            if (Array.isArray(poi)) {
                                const str = poi.find(item => typeof item === 'string');
                                const nums = poi.filter(item => typeof item === 'number');
                                if (str && nums.length >= 2) {
                                    type = str;
                                    lat = nums[0] > 40 ? nums[0] : nums[1];
                                    lon = nums[0] > 40 ? nums[1] : nums[0];
                                    normalizedPois.push({ type, coord: [lat, lon] });
                                }
                            } else if (poi && typeof poi === 'object') {
                                type = poi.type || poi.key || poi.dbKey;
                                if (poi.coord && Array.isArray(poi.coord)) {
                                    lat = poi.coord[0] > 40 ? poi.coord[0] : poi.coord[1];
                                    lon = poi.coord[0] > 40 ? poi.coord[1] : poi.coord[0];
                                    normalizedPois.push({ type, coord: [lat, lon] });
                                }
                            }
                        } catch(e) {}
                    });

                    const allowedPois = normalizedPois.filter(poi => {
                        if (isRealtor) return true;
                        let isPremiumPoi = false;
                        let isRealtorPoi = false;
                        let found = false;

                        for (const cat of Object.values(DISTRICT_CATEGORIES)) {
                            const field = cat.fields.find(f => f.dbKey === poi.type || f.dbKey === `${poi.type}_count`);
                            if (field) {
                                found = true;
                                if (field.isRealtorOnly) isRealtorPoi = true;
                                else if (cat.isPremium || field.isPremiumField) isPremiumPoi = true;
                                break;
                            }
                        }

                        if (!found) isPremiumPoi = true;
                        return isFree ? (!isPremiumPoi && !isRealtorPoi) : !isRealtorPoi;
                    });

                    setGeoData({ ...data, poi_data: allowedPois });
                    const types = [...new Set(allowedPois.map(p => p.type))].sort();
                    setActiveFilters(types); 
                }
            } catch (err) {
                console.error("Error loading map data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchGeo();
        return () => { isMounted = false; };
    }, [isOpen, districtId, isFree, isRealtor]);

    const availableTypes = useMemo(() => {
        if (!geoData?.poi_data) return [];
        return [...new Set(geoData.poi_data.map(p => p.type))].sort();
    }, [geoData]);

    const filteredPois = useMemo(() => {
        if (!geoData?.poi_data || activeFilters.length === 0) return [];
        return geoData.poi_data.filter(poi => activeFilters.includes(poi.type));
    }, [geoData, activeFilters]);

    const toggleFilter = useCallback((type) => {
        setActiveFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    }, []);

    const toggleAll = useCallback(() => {
        setActiveFilters(prevFilters => prevFilters.length === availableTypes.length ? [] : availableTypes);
    }, [availableTypes]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0f1014d9] backdrop-blur-[8px] z-[var(--z-modal-overlay)] flex items-center justify-center md:p-6 animate-fadeIn" onClick={onClose}>
            <div className="bg-surface w-full max-w-[1400px] h-[100dvh] md:h-[90vh] md:rounded-[var(--radius-md)] flex flex-col overflow-hidden shadow-modal animate-slideUp" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center py-5 px-6 bg-body border-b border-borderClient shrink-0">
                    <h3 className="m-0 font-heading text-xl md:text-2xl text-textMain font-bold tracking-wide">{districtName} - {t('title', { defaultValue: 'Карта інфраструктури' })}</h3>
                    <button className="bg-black/5 hover:bg-danger/10 border-none text-textSecondary hover:text-danger w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>
                
                {/* Map Body */}
                <div className="flex-1 flex flex-row relative overflow-hidden bg-body">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-surface font-heading text-textSecondary text-xl"><Loader /></div>
                    ) : (!geoData?.geojson && availableTypes.length === 0) ? (
                        <div className="w-full h-full flex items-center justify-center bg-surface font-heading text-textSecondary text-xl">{t('no_data', { defaultValue: 'Дані відсутні' })}</div>
                    ) : (
                        <>
                            {/* Sidebar Filters */}
                            {availableTypes.length > 0 && (
                                <div className={`absolute top-0 left-0 w-full h-full md:relative md:w-[320px] bg-surface border-r border-borderClient flex flex-col shrink-0 z-[var(--z-modal)] md:z-[var(--z-sidebar)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                                    
                                    <div className="p-5 border-b border-borderClient flex justify-between items-center bg-surface">
                                        <h4 className="m-0 font-heading text-textMain text-[1.1rem] font-bold">{t('filters_title', { defaultValue: 'Фільтри' })}</h4>
                                        <button className="md:hidden bg-transparent border-none text-textSecondary cursor-pointer p-1" onClick={() => setIsMobileFilterOpen(false)}>
                                            <FiX size={24} />
                                        </button>
                                    </div>
                                    
                                    <div className="py-4 px-5 flex justify-between items-center bg-body border-b border-borderClient">
                                        <button onClick={toggleAll} className="bg-transparent border-none text-accent font-body font-semibold text-[0.9rem] cursor-pointer p-0 transition-opacity hover:opacity-80">
                                            {activeFilters.length === availableTypes.length ? t('clear_all', { defaultValue: 'Очистити все' }) : t('select_all', { defaultValue: 'Обрати все' })}
                                        </button>
                                        <span className="text-[0.85rem] text-textSecondary font-bold bg-borderClient/30 px-2 py-0.5 rounded-full">{activeFilters.length} / {availableTypes.length}</span>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
                                        {availableTypes.map(type => {
                                            const isActive = activeFilters.includes(type);
                                            const count = geoData.poi_data.filter(p => p.type === type).length;
                                            const rawName = type.replace('_count', '');
                                            const translatedName = t(`poi_types.${rawName}`, { defaultValue: rawName.replace(/_/g, ' ') });

                                            return (
                                                <div key={type} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border border-transparent hover:bg-hover ${isActive ? 'bg-hover border-borderClient shadow-sm' : 'bg-transparent'}`} onClick={() => toggleFilter(type)}>
                                                    <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-colors ${isActive ? 'bg-accent border-accent text-white' : 'bg-transparent border-borderClient text-transparent'}`}>
                                                        {isActive && <FiCheck size={14} />}
                                                    </div>
                                                    <span className="text-xl mr-3 leading-none">{getEmojiForType(type)}</span>
                                                    <span className="font-body text-[0.95rem] text-textMain font-medium capitalize flex-1">{translatedName}</span>
                                                    <span className="text-[0.85rem] text-textSecondary font-bold bg-borderClient/30 px-2 py-0.5 rounded-full">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Map Container */}
                            <div className="flex-1 relative h-full">
                                {availableTypes.length > 0 && (
                                    <button className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-fixed)] bg-surface text-textMain border border-borderClient py-3 px-6 rounded-full font-heading font-bold text-[0.95rem] flex items-center justify-center gap-2.5 shadow-hover cursor-pointer" onClick={() => setIsMobileFilterOpen(true)}>
                                        <FiFilter size={20} /><span>{t('filters', { defaultValue: 'Фільтри' })}</span>
                                    </button>
                                )}
                                
                                <MapContainer center={[52, 19]} zoom={6} className="w-full h-full z-[var(--z-base)]" zoomControl={true} maxZoom={18}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; Carto' />
                                    <MapUpdater geoData={geoData} />
                                    {geoData.geojson && <GeoJSON data={geoData.geojson} style={GEOJSON_STYLE} />}
                                    <FastMapMarkers pois={filteredPois} t={t} />
                                </MapContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <style>{`
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-accent); border-radius: 10px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent-color); }
            `}</style>
        </div>
    );
}