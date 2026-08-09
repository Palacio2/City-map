import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as turf from '@turf/turf';
import { useTranslation } from 'react-i18next';
import { useDynamicFields } from './useDynamicFields';
import { normalizePoiData } from '../utils/mapHelpers';

export function useMapEditor(isOpen: boolean, rowData: any, onSaveMapData: any, onClose: any) {
    const { t } = useTranslation('db');
    const { metricGroups, fieldsConfig } = useDynamicFields();
    const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});
    const [localPois, setLocalPois] = useState<any[]>([]);
    const [selectedPoiIndex, setSelectedPoiIndex] = useState<number | null>(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newPoiType, setNewPoiType] = useState('');
    const mapRef = useRef<any>(null);

    const getFieldByPoiType = useCallback((type: string) => {
        const cleanType = type.replace('_count', '');
        return fieldsConfig?.find((f: any) => f.key === cleanType || f.key === `${cleanType}_count`);
    }, [fieldsConfig]);

    useEffect(() => {
        if (isOpen) {
            const pois = normalizePoiData(rowData?.poi_data);
            setLocalPois(pois);
            const initialFilters: Record<string, boolean> = {};
            pois.forEach((p: any) => {
                const type = p[2];
                if (type) {
                    initialFilters[type] = true;
                    initialFilters[`${type}_count`] = true;
                    initialFilters[type.replace('_count', '')] = true;
                }
            });
            if (fieldsConfig) {
                fieldsConfig.forEach((f: any) => {
                    if (initialFilters[f.key] === undefined) initialFilters[f.key] = true;
                });
            }
            setActiveFilters(initialFilters);
            setIsAddingMode(false);
            setNewPoiType('');
            setSelectedPoiIndex(null);
        }
    }, [isOpen, rowData, fieldsConfig]);

    const handleMapClick = useCallback((e: any) => {
        if (!isAddingMode || !newPoiType) return;
        const { lat, lng } = e.latlng;
        if (rowData?.geojson) {
            const pt = turf.point([lng, lat]);
            const poly = rowData.geojson.type === 'Feature' ? rowData.geojson : turf.feature(rowData.geojson);
            if (!turf.booleanPointInPolygon(pt, poly)) {
                alert(t('admin_map.editor.out_of_bounds'));
                return;
            }
        }
        const typeToSave = newPoiType.replace('_count', '');
        setLocalPois(prev => [...prev, [lat, lng, typeToSave, 'manual']]);
        setActiveFilters(prev => ({...prev, [typeToSave]: true, [`${typeToSave}_count`]: true}));
        setIsAddingMode(false);
        setNewPoiType('');
    }, [isAddingMode, newPoiType, rowData, t]);

    const handleDeletePoi = useCallback((index: number) => {
        setLocalPois(prev => prev.filter((_, i) => i !== index));
        setSelectedPoiIndex(null);
    }, []);

    const handleSave = useCallback(() => {
        const updatedCounts: Record<string, number> = {};
        if (fieldsConfig) {
            fieldsConfig.forEach((f: any) => {
                const shortKey = f.key.replace('_count', '');
                const count = localPois.filter(p => p[2] === shortKey || p[2] === f.key).length;
                updatedCounts[f.key] = count;
            });
        }
        onSaveMapData(localPois, updatedCounts);
        onClose();
    }, [fieldsConfig, localPois, onSaveMapData, onClose]);

    const filteredPois = useMemo(() => {
        return localPois.map((poi, idx) => ({ ...poi, originalIndex: idx })).filter(poi => {
            const type = poi[2];
            return activeFilters[type] !== false;
        });
    }, [localPois, activeFilters]);

    const poiFields = useMemo(() => {
        return (fieldsConfig || []).filter((f: any) => f.is_osm || f.data_type === 'number' || f.data_type === 'integer');
    }, [fieldsConfig]);

    const handleFilterToggle = useCallback((fieldKey: string) => {
        const val = !activeFilters[fieldKey];
        setActiveFilters(prev => ({
            ...prev,
            [fieldKey]: val,
            [fieldKey.replace('_count', '')]: val
        }));
    }, [activeFilters]);

    return {
        t,
        metricGroups,
        fieldsConfig,
        activeFilters,
        localPois,
        selectedPoiIndex,
        setSelectedPoiIndex,
        isAddingMode,
        setIsAddingMode,
        newPoiType,
        setNewPoiType,
        mapRef,
        getFieldByPoiType,
        handleMapClick,
        handleDeletePoi,
        handleSave,
        filteredPois,
        poiFields,
        handleFilterToggle
    };
}