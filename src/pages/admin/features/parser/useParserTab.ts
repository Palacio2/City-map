import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParserLogic } from '@admin/features/parser/useParserLogic';
import { useDynamicFields } from '@admin/core/hooks/useDynamicFields';
import { useAdmin } from '@admin/core/context/AdminContext';
import { useModals } from '@admin/core/context/ModalContext';
import { api } from '@services/api';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '@admin/core/hooks/useLocalStorage';
import { EntityItem, ParsedDistrictRowItem } from './types';
import { FormattedFieldItem } from '@admin/core/types/ui.types';

const parseNumber = (val: unknown, isFloat: boolean) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(String(val).replace(/\s/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : (isFloat ? num : Math.round(num));
};

export function useParserTab() {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const logic = useParserLogic();
    const { metricGroups } = useDynamicFields();
    const { currentAdmin } = useAdmin();
    
    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const adminCityIds = useMemo(() => currentAdmin?.cities || [], [currentAdmin?.cities]);
    
    const [pbfFile, setPbfFile] = useLocalStorage<string>('parser_file', '');
    const [country, setCountry] = useLocalStorage<EntityItem | null>('parser_country', null);
    const [city, setCity] = useLocalStorage<EntityItem | null>('parser_city', null);
    const [region, setRegion] = useLocalStorage<string>('parser_region', '');
    const [selectedDistrictIds, setSelectedDistrictIds] = useLocalStorage<string[]>('parser_selected_districts', []);
    const [activeStep, setActiveStep] = useState<number>(1);
    const [parserConfig, setParserConfig] = useState<Record<string, unknown> | null>({
        useOSM: true, useWAQI: true, useGUS: true, useOtodom: true
    });
    
    const {
        fetchDbDistricts, loadCities, dbDistricts, availableFiles,
        parsedData, runOfflineOsmParser, clearAllData, clearResultsSilent, setParsedData
    } = logic;
    
    const allowedCities = useMemo(() => {
        return isSuperAdmin ? logic.cities : logic.cities.filter((c: EntityItem) => adminCityIds.includes(c.id));
    }, [isSuperAdmin, logic.cities, adminCityIds]);
    
    useEffect(() => {
        if (city?.id) fetchDbDistricts(city.id);
        else setActiveStep(1);
    }, [city?.id, fetchDbDistricts]);
    
    useEffect(() => {
        if (country?.id && allowedCities.length === 0) loadCities(country.id);
    }, [country?.id, allowedCities.length, loadCities]);
    
    useEffect(() => {
        if (dbDistricts.length > 0) {
            const validIds = selectedDistrictIds.filter(id => dbDistricts.some((d: EntityItem) => d.id === id));
            if (validIds.length === 0) {
                setSelectedDistrictIds(dbDistricts.map((d: EntityItem) => d.id));
            }
        }
    }, [dbDistricts, selectedDistrictIds, setSelectedDistrictIds]);
    
    useEffect(() => {
        if (availableFiles.length > 0 && !pbfFile) setPbfFile(availableFiles[0]);
    }, [availableFiles, pbfFile, setPbfFile]);
    
    const processedParsedData = useMemo(() => {
        return parsedData.map((row: ParsedDistrictRowItem) => ({
            ...((row.parsed_data as Record<string, unknown>) || (row.data as Record<string, unknown>) || {}),
            ...row
        }));
    }, [parsedData]);
    
    const toggleSelectAll = useCallback((select: boolean) => {
        setSelectedDistrictIds(select ? dbDistricts.map((d: EntityItem) => d.id) : []);
    }, [dbDistricts, setSelectedDistrictIds]);
    
    const toggleDistrictSelection = useCallback((id: string) => {
        setSelectedDistrictIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, [setSelectedDistrictIds]);
    
    const handleResetAll = useCallback(() => {
        showConfirm(t('common.warning'), t('admin_parser.tab.confirm_reset'), () => {
            setCity(null); setCountry(null); setRegion('');
            setPbfFile(availableFiles[0] || ''); setSelectedDistrictIds([]);
            setActiveStep(1); setParserConfig(null); clearAllData();
        });
    }, [t, showConfirm, setCity, setCountry, setRegion, setPbfFile, availableFiles, setSelectedDistrictIds, setActiveStep, setParserConfig, clearAllData]);
    
    const handleStartParser = useCallback((config: unknown = parserConfig) => {
        setActiveStep(4);
        setParserConfig(config as Record<string, unknown>);
        runOfflineOsmParser({
            cityName: city?.name,
            pbfFileName: pbfFile,
            districts: dbDistricts.filter((d: EntityItem) => selectedDistrictIds.includes(d.id)),
            ...(config as Record<string, unknown>)
        });
    }, [city, pbfFile, dbDistricts, selectedDistrictIds, parserConfig, runOfflineOsmParser]);
    
    const handleSave = useCallback(async (rows: Record<string, unknown>[]) => {
        try {
            const allFields = metricGroups.flatMap((g: { fields: FormattedFieldItem[] }) => g.fields);
            const payloadsToSave = [];
            const statusPromises = [];
            
            for (const row of rows) {
                const payload: Record<string, unknown> = { district_id: row.district_id };
                
                if (row.geojson !== undefined) payload.geojson = row.geojson;
                if (row.poi_data !== undefined || row.parsed_pois !== undefined) {
                    payload.poi_data = row.poi_data || row.parsed_pois;
                }
                
                allFields.forEach((f: FormattedFieldItem) => {
                    const key = f.key;
                    if (key && key in row) {
                        const type = f.type;
                        payload[key] = (type === 'float' || type === 'numeric' || type === 'number' || type === 'integer')
                            ? parseNumber(row[key], type === 'float' || type === 'numeric')
                            : row[key];
                    }
                });
                
                if (row.is_available !== undefined) {
                    statusPromises.push(api.geo.updateDistrictStatus(row.district_id as string, !!row.is_available));
                }
                payloadsToSave.push(payload);
            }
            
            await Promise.all([...statusPromises, api.geo.saveParsedResults(payloadsToSave)]);
            
            if (rows.length > 1 || parsedData.length <= 1) clearResultsSilent();
            showAlert(t('common.success'), t('admin_parser.tab.save_success'), 'success');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Error';
            showAlert(t('common.error'), `${t('admin_parser.tab.save_error')} ${msg}`, 'error');
        }
    }, [metricGroups, parsedData.length, clearResultsSilent, showAlert, t]);
    
    const handleEditRow = useCallback((districtId: string, key: string, value: unknown) => {
        setParsedData((prev: ParsedDistrictRowItem[]) =>
            prev.map(item => item.district_id === districtId ? { ...item, [key]: value } : item)
        );
    }, [setParsedData]);
    
    return {
        t, logic, isSuperAdmin, pbfFile, setPbfFile, country, setCountry, city, setCity, region, setRegion,
        selectedDistrictIds, activeStep, setActiveStep, parserConfig, setParserConfig, allowedCities,
        processedParsedData, toggleSelectAll, toggleDistrictSelection, handleResetAll, handleStartParser,
        handleSave, handleEditRow
    };
}