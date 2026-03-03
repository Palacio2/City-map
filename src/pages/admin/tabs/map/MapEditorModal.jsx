// MapEditorModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import InteractiveMap from './InteractiveMap';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import { getLabelForKey } from './mapIcons';
import { FaEye, FaEyeSlash, FaMapMarkedAlt, FaGlobeEurope, FaTimes, FaSave } from 'react-icons/fa';
import L from 'leaflet';
import styles from './MapEditorModal.module.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function MapEditorModal({ isOpen, onClose, rowData, onSaveMapData }) {
    const [activeMetric, setActiveMetric] = useState(null);
    const [activePois, setActivePois] = useState([]);
    const [visibleTypes, setVisibleTypes] = useState(new Set());
    const [mapCenter, setMapCenter] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setActiveMetric(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && rowData) {
            const initialPois = rowData.poi_data || rowData.parsed_pois || [];
            
            const poisWithIds = initialPois.map(p => {
                if (Array.isArray(p)) {
                    const typeStr = p[2] || 'default';
                    const normalizedType = typeStr.endsWith('_count') ? typeStr : `${typeStr}_count`;
                    return { id: generateId(), coord: [p[1], p[0]], type: normalizedType, source: p[3] || 'parser' };
                }
                const typeStr = p.type || 'default';
                const normalizedType = typeStr.endsWith('_count') ? typeStr : `${typeStr}_count`;
                return { ...p, id: p.id || generateId(), type: normalizedType, source: p.source || 'parser' };
            });
            
            setActivePois(poisWithIds);
            setActiveMetric(null);
            setVisibleTypes(new Set(poisWithIds.map(p => p.type)));

            if (rowData.geojson) {
                try {
                    const center = L.geoJSON(rowData.geojson).getBounds().getCenter();
                    setMapCenter(center);
                } catch (e) {}
            }
        }
    }, [isOpen, rowData]);

    const dynamicCounts = useMemo(() => {
        const counts = {};
        activePois.forEach(poi => { counts[poi.type] = (counts[poi.type] || 0) + 1; });
        return counts;
    }, [activePois]);

    const handleAddPoi = (coord) => {
        if (!activeMetric) return;
        setActivePois(prev => [...prev, { id: generateId(), coord, type: activeMetric, source: 'manual' }]);
        setVisibleTypes(prev => new Set(prev).add(activeMetric));
    };

    const handleRemovePoi = (poiId) => {
        setActivePois(prev => prev.filter(p => p.id !== poiId));
    };

    const handleUpdatePoi = (poiId, newCoord) => {
        setActivePois(prev => prev.map(p => p.id === poiId ? { ...p, coord: newCoord } : p));
    };

    const toggleVisibility = (e, key) => {
        e.stopPropagation();
        setVisibleTypes(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const showAll = () => {
        const allKeys = METRIC_GROUPS.flatMap(g => g.fields).filter(f => f.type === 'number' && f.key.includes('_count')).map(f => f.key);
        setVisibleTypes(new Set(allKeys));
    };

    const hideAll = () => setVisibleTypes(new Set());

    const handleSave = () => {
        const compressedPois = activePois.map(p => [
            parseFloat(p.coord[1].toFixed(5)), 
            parseFloat(p.coord[0].toFixed(5)), 
            p.type.replace('_count', ''),
            p.source === 'manual' ? 'manual' : 'parser'
        ]);
        onSaveMapData(compressedPois, dynamicCounts);
        onClose();
    };

    if (!isOpen || !rowData) return null;
    const countableMetrics = METRIC_GROUPS.flatMap(g => g.fields).filter(f => f.type === 'number' && f.key.includes('_count'));

    let googleUrl = mapCenter ? `https://www.google.com/maps/@$$${mapCenter.lat},${mapCenter.lng},16z` : '#';
    let osmUrl = mapCenter ? `https://www.openstreetmap.org/#map=16/${mapCenter.lat}/${mapCenter.lng}` : '#';

    if (activeMetric && mapCenter) {
        const query = encodeURIComponent(getLabelForKey(activeMetric));
        googleUrl = `https://www.google.com/maps/search/$$${query}/@${mapCenter.lat},${mapCenter.lng},16z`;
        osmUrl = `https://www.openstreetmap.org/search?query=${query}#map=16/${mapCenter.lat}/${mapCenter.lng}`;
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <div className={styles.titleIcon}>🗺️</div>
                        <div className={styles.titleText}>
                            <span>Редактор GIS</span>
                            <span className={styles.districtName}>{rowData.district_name}</span>
                        </div>
                    </h2>
                    <div className={styles.headerActions}>
                        {mapCenter && (
                            <div className={styles.externalLinks}>
                                <a href={googleUrl} target="_blank" rel="noreferrer" className={styles.externalBtnGoogle}>
                                    <FaMapMarkedAlt /> Google Maps
                                </a>
                                <a href={osmUrl} target="_blank" rel="noreferrer" className={styles.externalBtnOsm}>
                                    <FaGlobeEurope /> OpenStreetMap
                                </a>
                            </div>
                        )}
                        <div className={styles.actionDivider}></div>
                        <button onClick={onClose} className={styles.cancelBtn}>
                            <FaTimes /> Скасувати
                        </button>
                        <button onClick={handleSave} className={styles.saveBtn}>
                            <FaSave /> Зберегти
                        </button>
                    </div>
                </div>

                <div className={styles.body}>
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHelp}>
                            <div className={styles.helpText}>Оберіть категорію для додавання. Керуйте видимістю міток на карті.</div>
                            <div className={styles.visibilityControls}>
                                <button onClick={showAll} className={styles.visBtn}>Показати всі</button>
                                <button onClick={hideAll} className={styles.visBtn}>Сховати всі</button>
                            </div>
                        </div>
                        <div className={styles.metricsList}>
                            {countableMetrics.map(m => {
                                const count = dynamicCounts[m.key] || 0;
                                const isActive = activeMetric === m.key;
                                const isVisible = visibleTypes.has(m.key);
                                
                                return (
                                    <div 
                                        key={m.key} 
                                        className={`${styles.metricItem} ${isActive ? styles.metricItemActive : styles.metricItemInactive} ${!isVisible ? styles.metricItemHidden : ''}`}
                                        onClick={() => setActiveMetric(isActive ? null : m.key)}
                                    >
                                        <span className={styles.metricLabel}>{m.label}</span>
                                        <div className={styles.metricControls}>
                                            <span className={`${styles.metricCount} ${isActive ? styles.countActive : styles.countInactive}`}>
                                                {count}
                                            </span>
                                            <button 
                                                className={`${styles.eyeBtn} ${isVisible ? styles.eyeBtnVisible : styles.eyeBtnHidden}`}
                                                onClick={(e) => toggleVisibility(e, m.key)}
                                            >
                                                {isVisible ? <FaEye /> : <FaEyeSlash />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.mapContainer}>
                        <InteractiveMap 
                            geojson={rowData.geojson}
                            pois={activePois.filter(p => visibleTypes.has(p.type))}
                            activeMetric={activeMetric}
                            onAddPoi={handleAddPoi}
                            onRemovePoi={handleRemovePoi}
                            onUpdatePoi={handleUpdatePoi}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}