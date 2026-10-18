import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as turf from '@turf/turf';
import type { Polygon, MultiPolygon, Feature } from 'geojson';
import { useTranslation } from 'react-i18next';
import { useDynamicFields } from '@admin/core/hooks/useDynamicFields';
import { normalizePoiData } from '@admin/core/utils/mapHelpers';
import { NormalizedPoiPoint } from '@admin/core/types/geo.types';
import { useModals } from '@admin/core/context/ModalContext';

export function useMapEditor(isOpen: boolean, rowData: Record<string, unknown> | null, onSaveMapData: (pois: NormalizedPoiPoint[], counts: Record<string, number>) => void, onClose: () => void) {
    const { t } = useTranslation('db');
    const { showAlert } = useModals();
    const { metricGroups, fieldsConfig } = useDynamicFields();
    
    const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});
    const [localPois, setLocalPois] = useState<NormalizedPoiPoint[]>([]);
    const [selectedPoiIndex, setSelectedPoiIndex] = useState<number | null>(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newPoiType, setNewPoiType] = useState('');
    const mapRef = useRef<unknown>(null);

    const getFieldByPoiType = useCallback((type: string) => {
        const cleanType = type.replace('_count', '');
        return fieldsConfig?.find((f: { key?: string; field_code?: string; icon?: string }) => f.key === cleanType || f.key === `${cleanType}_count`);
    }, [fieldsConfig]);

    useEffect(() => {
        if (isOpen) {
            const pois = normalizePoiData(rowData?.poi_data);
            setLocalPois(pois);
            const initialFilters: Record<string, boolean> = {};
            pois.forEach((p: NormalizedPoiPoint) => {
                const type = p[2];
                if (type) {
                    initialFilters[type] = true;
                    initialFilters[`${type}_count`] = true;
                    initialFilters[type.replace('_count', '')] = true;
                }
            });
            if (fieldsConfig) {
                fieldsConfig.forEach((f: { key: string }) => {
                    if (initialFilters[f.key] === undefined) initialFilters[f.key] = true;
                });
            }
            setActiveFilters(initialFilters);
            setIsAddingMode(false);
            setNewPoiType('');
            setSelectedPoiIndex(null);
        }
    }, [isOpen, rowData, fieldsConfig]);

    const handleMapClick = useCallback((e: { latlng: { lat: number; lng: number } }) => {
        if (!isAddingMode || !newPoiType) return;
        const { lat, lng } = e.latlng;
        
        if (rowData?.geojson) {
            const pt = turf.point([lng, lat]);
            const geojson = rowData.geojson as Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon;
            
            const poly = ('type' in geojson && geojson.type === 'Feature')
                ? geojson as Feature<Polygon | MultiPolygon>
                : turf.feature(geojson as Polygon | MultiPolygon);

            if (!turf.booleanPointInPolygon(pt, poly)) {
                showAlert(t('common.error'), t('admin_map.editor.out_of_bounds'), 'error');
                return;
            }
        }
        
        const typeToSave = newPoiType.replace('_count', '');
        setLocalPois(prev => [...prev, [lat, lng, typeToSave, 'manual']]);
        setActiveFilters(prev => ({...prev, [typeToSave]: true, [`${typeToSave}_count`]: true}));
        setIsAddingMode(false);
        setNewPoiType('');
    }, [isAddingMode, newPoiType, rowData, t, showAlert]);

    const handleDeletePoi = useCallback((index: number) => {
        setLocalPois(prev => prev.filter((_, i) => i !== index));
        setSelectedPoiIndex(null);
    }, []);

    const handleSave = useCallback(() => {
        const updatedCounts: Record<string, number> = {};
        if (fieldsConfig) {
            fieldsConfig.forEach((f: { key: string }) => {
                const shortKey = f.key.replace('_count', '');
                const count = localPois.filter((p: NormalizedPoiPoint) => p[2] === shortKey || p[2] === f.key).length;
                updatedCounts[f.key] = count;
            });
        }
        onSaveMapData(localPois, updatedCounts);
        onClose();
    }, [fieldsConfig, localPois, onSaveMapData, onClose]);

    const filteredPois = useMemo(() => {
        return localPois.map((poi: NormalizedPoiPoint, idx) => ({ ...poi, originalIndex: idx })).filter((poi: NormalizedPoiPoint) => {
            const type = poi[2];
            return activeFilters[type] !== false;
        });
    }, [localPois, activeFilters]);

    const poiFields = useMemo(() => {
        return (fieldsConfig || []).filter((f: { is_osm?: boolean; data_type?: string }) => f.is_osm || f.data_type === 'number' || f.data_type === 'integer');
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