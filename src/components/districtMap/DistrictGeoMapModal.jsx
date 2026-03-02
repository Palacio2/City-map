import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
// 1. Підключаємо geoApi замість прямого supabase
import { geoApi } from '@api/geoApi';
import { FiX, FiFilter, FiCheck } from 'react-icons/fi';
import Loader from '@components/loader/Loader';
import styles from './DistrictGeoMapModal.module.css';

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

const getCachedIcon = (type) => {
    if (!ICON_CACHE[type]) {
        const emoji = ICON_MAP[type] || ICON_MAP.default;
        const htmlString = `
            <div style="font-size: 16px; background: #ffffff; border: 2px solid #cbd5e1; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${emoji}
            </div>
        `;
        ICON_CACHE[type] = L.divIcon({ html: htmlString, className: 'custom-poi-icon', iconSize: [32, 32], iconAnchor: [16, 16], tooltipAnchor: [0, -16] });
    }
    return ICON_CACHE[type];
};

const createCustomClusterIcon = (cluster) => {
  return L.divIcon({
    html: `<div style="background-color: #c5a47e; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: sans-serif; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            ${cluster.getChildCount()}
          </div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

const GEOJSON_STYLE = { 
    color: '#c5a47e', 
    weight: 3, 
    fillColor: '#c5a47e', 
    fillOpacity: 0.15, 
    dashArray: '6, 6' 
};

const FastMapMarkers = ({ pois, t }) => {
    const map = useMap();

    useEffect(() => {
        if (!pois || pois.length === 0) return;

        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            iconCreateFunction: createCustomClusterIcon,
            maxClusterRadius: 40,
            showCoverageOnHover: false,
            disableClusteringAtZoom: 17,
            spiderfyOnMaxZoom: true
        });

        const leafletMarkers = pois.map(poi => {
            const marker = L.marker([poi.coord[1], poi.coord[0]], {
                icon: getCachedIcon(poi.type)
            });
            const rawName = poi.type.replace('_count', '');
            const labelText = t(`poi_types.${rawName}`, { defaultValue: rawName.replace(/_/g, ' ') });
            
            marker.bindTooltip(`<strong>${labelText}</strong>`, { 
                direction: 'top', 
                className: styles.customTooltip 
            });
            return marker;
        });

        clusterGroup.addLayers(leafletMarkers);
        map.addLayer(clusterGroup);

        return () => {
            map.removeLayer(clusterGroup);
        };
    }, [pois, map, t]);

    return null;
};

export default function DistrictGeoMapModal({ isOpen, onClose, districtId, districtName }) {
    const { t } = useTranslation('map');
    
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
                // 2. Використовуємо метод з geoApi
                const data = await geoApi.getDistrictGeoData(districtId);
                
                if (isMounted) {
                    setGeoData(data);
                    const types = [...new Set((data.poi_data || []).map(p => p.type))];
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
    }, [isOpen, districtId]);

    const availableTypes = useMemo(() => {
        if (!geoData?.poi_data) return [];
        return [...new Set(geoData.poi_data.map(p => p.type))].sort();
    }, [geoData]);

    const filteredPois = useMemo(() => {
        if (!geoData?.poi_data || activeFilters.length === 0) return [];
        return geoData.poi_data.filter(poi => activeFilters.includes(poi.type));
    }, [geoData, activeFilters]);

    const toggleFilter = useCallback((type) => {
        setActiveFilters(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    }, []);

    const toggleAll = useCallback(() => {
        setActiveFilters(prevFilters => 
            prevFilters.length === availableTypes.length ? [] : availableTypes
        );
    }, [availableTypes]);

    const getBounds = useCallback(() => {
        if (geoData?.geojson?.bbox) {
            return [ [geoData.geojson.bbox[1], geoData.geojson.bbox[0]], [geoData.geojson.bbox[3], geoData.geojson.bbox[2]] ];
        }
        if (geoData?.poi_data && geoData.poi_data.length > 0) {
           return [[geoData.poi_data[0].coord[1], geoData.poi_data[0].coord[0]], [geoData.poi_data[0].coord[1], geoData.poi_data[0].coord[0]]];
        }
        return [[50.45, 30.52], [50.45, 30.52]]; 
    }, [geoData]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                
                <div className={styles.header}>
                    <h3>{districtName} - {t('title')}</h3>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        <FiX size={24} />
                    </button>
                </div>
                
                <div className={styles.mapBody}>
                    {loading ? (
                        <div className={styles.loaderWrapper}><Loader /></div>
                    ) : (!geoData?.geojson && availableTypes.length === 0) ? (
                        <div className={styles.noData}>{t('no_data')}</div>
                    ) : (
                        <>
                            {availableTypes.length > 0 && (
                                <div className={`${styles.sidebar} ${isMobileFilterOpen ? styles.sidebarOpen : ''}`}>
                                    <div className={styles.sidebarHeader}>
                                        <h4>{t('filters_title')}</h4>
                                        <button className={styles.mobileCloseFilter} onClick={() => setIsMobileFilterOpen(false)}>
                                            <FiX size={20} />
                                        </button>
                                    </div>
                                    
                                    <div className={styles.sidebarControls}>
                                        <button onClick={toggleAll} className={styles.toggleAllBtn}>
                                            {activeFilters.length === availableTypes.length ? t('clear_all') : t('select_all')}
                                        </button>
                                        <span className={styles.counter}>{activeFilters.length} / {availableTypes.length}</span>
                                    </div>

                                    <div className={styles.filterList}>
                                        {availableTypes.map(type => {
                                            const isActive = activeFilters.includes(type);
                                            const count = geoData.poi_data.filter(p => p.type === type).length;
                                            const rawName = type.replace('_count', '');
                                            const translatedName = t(`poi_types.${rawName}`, { defaultValue: rawName.replace(/_/g, ' ') });

                                            return (
                                                <div 
                                                    key={type} 
                                                    className={`${styles.filterItem} ${isActive ? styles.activeItem : ''}`}
                                                    onClick={() => toggleFilter(type)}
                                                >
                                                    <div className={`${styles.checkbox} ${isActive ? styles.checkboxActive : ''}`}>
                                                        {isActive && <FiCheck size={14} />}
                                                    </div>
                                                    <span className={styles.filterIcon}>{ICON_MAP[type] || ICON_MAP.default}</span>
                                                    <span className={styles.filterName}>{translatedName}</span>
                                                    <span className={styles.filterCount}>{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className={styles.mapContainerWrapper}>
                                {availableTypes.length > 0 && (
                                    <button 
                                        className={styles.mobileOpenFilterBtn} 
                                        onClick={() => setIsMobileFilterOpen(true)}
                                    >
                                        <FiFilter size={20} />
                                        <span>{t('filters')}</span>
                                    </button>
                                )}
                                
                                <MapContainer bounds={getBounds()} className={styles.leafletMap} zoomControl={true} maxZoom={18}>
                                    <TileLayer 
                                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                                        attribution='&copy; <a href="https://carto.com/">Carto</a>'
                                    />
                                    {geoData.geojson && (
                                        <GeoJSON 
                                            data={geoData.geojson} 
                                            style={GEOJSON_STYLE} 
                                        />
                                    )}
                                    <FastMapMarkers pois={filteredPois} t={t} />
                                </MapContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}