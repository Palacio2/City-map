import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { useDynamicFields } from './useDynamicFields';
import { useModals } from '../ui/ModalContext';
import * as turf from '@turf/turf';
import { normalizePoiData, assignColorsToFeatures } from '../utils/mapHelpers';

export function useMapTab() {
    const { t } = useTranslation('db');
    const { fieldsConfig } = useDynamicFields();
    const { showAlert } = useModals();
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [mapData, setMapData] = useState<any[]>([]);
    const [loadingMap, setLoadingMap] = useState(false);
    const [activeLayer, setActiveLayer] = useState<'polygons' | 'markers' | 'all'>('polygons');

    const getLabelForKey = useCallback((key: string) => {
        return fieldsConfig?.find((f: any) => f.key === key || f.key === `${key}_count`)?.label || key;
    }, [fieldsConfig]);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const { data: cData } = await supabase.functions.invoke('admin-cities-list', { body: {} });
                if (cData?.cities) {
                    const uniqueCountries = [...new Set(cData.cities.map((c: any) => c.countryName).filter(Boolean))] as string[];
                    setCountries(uniqueCountries);
                    setCities(cData.cities);
                }
            } catch (err) { console.error(err); }
        };
        fetchInitial();
    }, []);

    const fetchMapData = async () => {
        if (!selectedCity) return;
        setLoadingMap(true);
        try {
            const { data: res, error } = await supabase.functions.invoke('admin-map-data', { body: { cityId: selectedCity } });
            if (error || res?.error) throw new Error(res?.error || error?.message);
            const validData = (res?.data || []).map((d: any) => {
                if (!d.geojson) return null;
                try {
                    const geo = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
                    if (!geo.bbox) geo.bbox = turf.bbox(geo);
                    return {
                        ...d,
                        geojson: geo,
                        poi_data: normalizePoiData(d.poi_data)
                    };
                } catch (e) { return null; }
            }).filter(Boolean);
            setMapData(assignColorsToFeatures(validData));
        } catch (err: any) {
            showAlert(t('common.error'), err.message, 'error');
        } finally {
            setLoadingMap(false);
        }
    };

    useEffect(() => { fetchMapData(); }, [selectedCity]);

    const resetFilters = useCallback(() => {
        setSelectedCountry('');
        setSelectedCity('');
        setMapData([]);
        setActiveLayer('polygons');
    }, []);

    const filteredCities = useMemo(() => {
        if (!selectedCountry) return cities;
        return cities.filter((c: any) => c.countryName === selectedCountry);
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