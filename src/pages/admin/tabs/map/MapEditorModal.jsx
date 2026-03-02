import React, { useState, useEffect, useMemo } from 'react';
import InteractiveMap from './InteractiveMap';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import styles from './MapEditorModal.module.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function MapEditorModal({ isOpen, onClose, rowData, onSaveMapData }) {
    const [activeMetric, setActiveMetric] = useState(null);
    const [activePois, setActivePois] = useState([]);

    useEffect(() => {
        if (isOpen && rowData) {
            const initialPois = rowData.poi_data || rowData.parsed_pois || [];
            
            const poisWithIds = initialPois.map(p => ({
                ...p,
                id: p.id || generateId(),
                source: p.source || 'parser'
            }));
            
            setActivePois(poisWithIds);
            setActiveMetric(null);
        }
    }, [isOpen]);

    const dynamicCounts = useMemo(() => {
        const counts = {};
        activePois.forEach(poi => {
            counts[poi.type] = (counts[poi.type] || 0) + 1;
        });
        return counts;
    }, [activePois]);

    const handleAddPoi = (coord) => {
        if (!activeMetric) return;
        setActivePois(prev => [
            ...prev, 
            { id: generateId(), coord, type: activeMetric, source: 'manual' }
        ]);
    };

    const handleRemovePoi = (poiId) => {
        setActivePois(prev => prev.filter(p => p.id !== poiId));
    };

    const handleSave = () => {
        onSaveMapData(activePois, dynamicCounts);
        onClose();
    };

    if (!isOpen || !rowData) return null;

    const countableMetrics = METRIC_GROUPS.flatMap(g => g.fields).filter(f => f.type === 'number' && f.key.includes('_count'));

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span className={styles.icon}>🗺️</span> GIS Редактор: 
                        <span className={styles.districtName}>{rowData.district_name}</span>
                    </h2>
                    <div className={styles.headerActions}>
                        <button onClick={onClose} className={`${styles.btn} ${styles.cancelBtn}`}>Скасувати</button>
                        <button onClick={handleSave} className={`${styles.btn} ${styles.saveBtn}`}>
                            💾 Зберегти зміни
                        </button>
                    </div>
                </div>

                <div className={styles.body}>
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHelp}>
                            💡 Підказка: Оберіть категорію зі списку. Клікніть на карту, щоб додати точку.
                        </div>
                        <div className={styles.metricsList}>
                            {countableMetrics.map(m => {
                                const isActive = activeMetric === m.key;
                                return (
                                    <div 
                                        key={m.key} 
                                        onClick={() => setActiveMetric(isActive ? null : m.key)}
                                        className={`${styles.metricItem} ${isActive ? styles.metricItemActive : styles.metricItemInactive}`}
                                    >
                                        <span className={styles.metricLabel}>{m.label}</span>
                                        <span className={`${styles.metricCount} ${isActive ? styles.countActive : styles.countInactive}`}>
                                            {dynamicCounts[m.key] || 0}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.mapContainer}>
                        <InteractiveMap 
                            geojson={rowData.geojson}
                            pois={activePois}
                            activeMetric={activeMetric}
                            onAddPoi={handleAddPoi}
                            onRemovePoi={handleRemovePoi}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}