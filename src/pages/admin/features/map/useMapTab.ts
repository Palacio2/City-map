import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { adminGeoApi } from '@admin/core/api/adminGeoApi';
import { useDynamicFields } from '@admin/core/hooks/useDynamicFields';
import { useModals } from '@admin/core/context/ModalContext';
import { assignColorsToFeatures, parseAndFixGeoJSON } from '@admin/core/utils/mapHelpers';
import { GeoFeatureData } from '@admin/core/types/geo.types';

export function useMapTab() {
    const { t } = useTranslation('db');
    const { fieldsConfig } = useDynamicFields();
    const { showAlert } = useModals();
    
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<{ id: string; name: string; countryName?: string }[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [mapData, setMapData] = useState<GeoFeatureData[]>([]);
    const [loadingMap, setLoadingMap] = useState(false);
    const [activeLayer, setActiveLayer] = useState<'polygons' | 'markers' | 'all'>('polygons');
    
    const getLabelForKey = useCallback((key: string) => {
        return fieldsConfig?.find((f: { key: string; label?: string }) => f.key === key || f.key === `${key}_count`)?.label || key;
    }, [fieldsConfig]);
    
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const cData = await adminGeoApi.getCitiesList(true);
                if (cData?.cities) {
                    const uniqueCountries = [...new Set(cData.cities.map((c: { countryName?: string }) => c.countryName).filter(Boolean))] as string[];
                    setCountries(uniqueCountries);
                    setCities(cData.cities);
                }
            } catch (err) { console.error(err); }
        };
        fetchInitial();
    }, []);
    
    const fetchMapData = useCallback(async () => {
        if (!selectedCity) return;
        setLoadingMap(true);
        try {
            const res = await adminGeoApi.getMapData(selectedCity) as { data?: GeoFeatureData[] } | GeoFeatureData[];
            const dataArray = Array.isArray(res) ? res : (res?.data || []);
            const validData = dataArray.map(parseAndFixGeoJSON).filter(Boolean) as GeoFeatureData[];
            setMapData(assignColorsToFeatures(validData));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error loading map data';
            showAlert(t('common.error'), msg, 'error');
        } finally {
            setLoadingMap(false);
        }
    }, [selectedCity, t, showAlert]);
    
    useEffect(() => { fetchMapData(); }, [selectedCity, fetchMapData]);
    
    const resetFilters = useCallback(() => {
        setSelectedCountry('');
        setSelectedCity('');
        setMapData([]);
        setActiveLayer('polygons');
    }, []);
    
    const filteredCities = useMemo(() => {
        if (!selectedCountry) return cities;
        return cities.filter((c: { countryName?: string }) => c.countryName === selectedCountry);
    }, [cities, selectedCountry]);
    
    return {
        t,
        fieldsConfig,
        countries,
        cities: filteredCities,
        selectedCountry,
        setSelectedCountry,
        selectedCity,
        setSelectedCity,
        mapData,
        loadingMap,
        activeLayer,
        setActiveLayer,
        getLabelForKey,
        fetchMapData,
        resetFilters
    };
}