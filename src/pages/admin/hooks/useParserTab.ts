import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParserLogic } from './useParserLogic';
import { useDynamicFields } from './useDynamicFields';
import { useAdmin } from './AdminContext';
import { useModals } from '../ui/ModalContext';

// @ts-ignore
import { api } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const safeJSONParse = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        return item && item !== 'undefined' ? JSON.parse(item) : null;
    } catch (e) { return null; }
};

export function useParserTab() {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const logic = useParserLogic();
    const { metricGroups } = useDynamicFields();
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const adminCityIds = currentAdmin?.cities || [];

    const [pbfFile, setPbfFile] = useState(() => localStorage.getItem('parser_file') || '');
    const [country, setCountry] = useState(() => safeJSONParse('parser_country'));
    const [city, setCity] = useState(() => safeJSONParse('parser_city'));
    const [region, setRegion] = useState(() => localStorage.getItem('parser_region') || '');
    const [selectedDistrictIds, setSelectedDistrictIds] = useState<string[]>([]);
    const [activeStep, setActiveStep] = useState<number>(1);
    
    // State for parser parameters previously in MetricsModal
    const [parserConfig, setParserConfig] = useState<any>(null);

    const allowedCities = useMemo(() => {
        return isSuperAdmin ? logic.cities : logic.cities.filter((c: any) => adminCityIds.includes(c.id));
    }, [isSuperAdmin, logic.cities, adminCityIds]);

    useEffect(() => {
        if (city?.id) {
            logic.fetchDbDistricts(city.id);
            if (activeStep === 1) setActiveStep(2);
        } else {
            setActiveStep(1);
        }
        localStorage.setItem('parser_city', JSON.stringify(city));
    }, [city]);

    useEffect(() => { localStorage.setItem('parser_country', JSON.stringify(country)); }, [country]);
    useEffect(() => { localStorage.setItem('parser_file', pbfFile); }, [pbfFile]);
    useEffect(() => { localStorage.setItem('parser_region', region); }, [region]);

    useEffect(() => {
        if (logic.dbDistricts.length > 0) {
            setSelectedDistrictIds(logic.dbDistricts.map((d: any) => d.id));
        } else {
            setSelectedDistrictIds([]);
        }
    }, [logic.dbDistricts]);

    useEffect(() => {
        if (logic.availableFiles.length > 0 && !pbfFile) setPbfFile(logic.availableFiles[0]);
    }, [logic.availableFiles]);

    const processedParsedData = useMemo(() => {
        return logic.parsedData.map((row: any) => ({
            ...(row.parsed_data || row.data || {}),
            ...row
        }));
    }, [logic.parsedData]);

    useEffect(() => {
        if (processedParsedData.length > 0 && activeStep === 4) {
            setActiveStep(5);
        }
    }, [processedParsedData]);

    const toggleSelectAll = useCallback((select: boolean) => {
        if (select) setSelectedDistrictIds(logic.dbDistricts.map((d: any) => d.id));
        else setSelectedDistrictIds([]);
    }, [logic.dbDistricts]);

    const toggleDistrictSelection = useCallback((id: string) => {
        setSelectedDistrictIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    const handleResetAll = useCallback(() => {
        showConfirm(
            t('common.warning'),
            t('admin_parser.tab.confirm_reset'),
            () => {
                setCity(null); setCountry(null); setRegion('');
                setPbfFile(logic.availableFiles[0] || ''); setSelectedDistrictIds([]);
                setActiveStep(1);
                setParserConfig(null);
                logic.clearAllData();
                localStorage.removeItem('parser_city');
                localStorage.removeItem('parser_country');
                localStorage.removeItem('parser_region');
            }
        );
    }, [t, showConfirm, logic]);

    const handleStartParser = useCallback((config: any = parserConfig) => {
        setActiveStep(4);
        setParserConfig(config);
        const payload = {
            cityName: city?.name,
            pbfFileName: pbfFile,
            districts: logic.dbDistricts.filter((d: any) => selectedDistrictIds.includes(d.id)),
            ...config
        };
        logic.runOfflineOsmParser(payload);
    }, [city, pbfFile, logic, selectedDistrictIds, parserConfig]);

    const handleSave = useCallback(async (rows: any[]) => {
        try {
            const allFields = metricGroups.flatMap((g: any) => g.fields);
            const payloadsToSave = [];
            const statusPromises = [];

            for (const row of rows) {
                const payload: any = { district_id: row.district_id };
                if (row.geojson !== undefined) payload.geojson = row.geojson;
                if (row.poi_data !== undefined) payload.poi_data = row.poi_data;
                else if (row.parsed_pois !== undefined) payload.poi_data = row.parsed_pois;

                const parseNumber = (val: any, isFloat: boolean) => {
                    if (val === null || val === undefined || val === '') return null;
                    const stringVal = String(val).replace(/\s/g, '').replace(',', '.');
                    const num = Number(stringVal);
                    if (isNaN(num)) return 0;
                    return isFloat ? num : Math.round(num);
                };

                allFields.forEach((field: any) => {
                    const key = field.key || field.field_code;
                    if (key in row) {
                        const type = field.type || field.data_type;
                        if (type === 'float' || type === 'numeric') {
                            payload[key] = parseNumber(row[key], true);
                        } else if (type === 'number' || type === 'integer') {
                            payload[key] = parseNumber(row[key], false);
                        } else {
                            payload[key] = row[key];
                        }
                    }
                });

                if (row.is_available !== undefined) {
                    statusPromises.push(api.geo.updateDistrictStatus(row.district_id, !!row.is_available));
                }
                payloadsToSave.push(payload);
            }

            const results = await Promise.all([
                ...statusPromises,
                api.geo.saveParsedResults(payloadsToSave)
            ]);

            const errors = results.filter((r: any) => r?.error || r?.data?.error);
            if (errors.length > 0) throw new Error((errors[0] as any)?.error?.message || (errors[0] as any)?.data?.error || 'Unknown error');

            if (rows.length > 1 || logic.parsedData.length <= 1) {
                logic.clearResultsSilent();
            }
            showAlert(t('common.success'), t('admin_parser.tab.save_success'), 'success');
        } catch (e: any) {
            showAlert(t('common.error'), `${t('admin_parser.tab.save_error')} ${e.message}`, 'error');
            throw e;
        }
    }, [metricGroups, logic, showAlert, t]);

    const handleEditRow = useCallback((districtId: string, key: string, value: any) => {
        logic.setParsedData((prev: any[]) =>
            prev.map((item: any) => item.district_id === districtId ? { ...item, [key]: value } : item)
        );
    }, [logic]);

    return {
        t,
        logic,
        isSuperAdmin,
        pbfFile, setPbfFile,
        country, setCountry,
        city, setCity,
        region, setRegion,
        selectedDistrictIds,
        activeStep, setActiveStep,
        parserConfig, setParserConfig,
        allowedCities,
        processedParsedData,
        toggleSelectAll,
        toggleDistrictSelection,
        handleResetAll,
        handleStartParser,
        handleSave,
        handleEditRow
    };
}