/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminGeoApi } from '@admin/core/api/adminGeoApi';

import { api } from '@services/api';
import { useTranslation } from 'react-i18next';
import { useModals } from '@admin/core/context/ModalContext';
import { useActionLogger } from '@admin/core/context/useActionLogger';
import { EntityItem, LogEntry, ParsedDistrictRowItem } from './types';

export const useParserLogic = () => {
    const { t, i18n } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const { withLogging } = useActionLogger();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [cities, setCities] = useState<EntityItem[]>([]);
    const [dbDistricts, setDbDistricts] = useState<EntityItem[]>([]);
    const [foundDistrictsOSM, setFoundDistrictsOSM] = useState<{name: string; [key: string]: unknown}[]>([]);
    const [parsedData, setParsedData] = useState<ParsedDistrictRowItem[]>([]);
    const [showResults, setShowResults] = useState(false);
    const prevLogContentRef = useRef("");

    const { data: countries = [] } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            return await adminGeoApi.getCountries();
        }
    });

    const { data: availableFiles = [], refetch: loadAvailableFiles } = useQuery({
        queryKey: ['pbfFiles'],
        queryFn: () => api.parser.getPbfFiles()
    });

    useQuery({
        queryKey: ['parserStatusPoll'],
        queryFn: async () => {
            const text = await api.parser.getCurrentLog().catch(() => "");
            if (text && text !== prevLogContentRef.current) {
                prevLogContentRef.current = text;
                const parsedLogs = text.split('\n').filter(Boolean).map((line: string, i: number): LogEntry => {
                    const match = line.match(/^\[(.*?)\] (.*)/);
                    return match ? { id: i, time: match[1], msg: match[2], type: 'info' } : { id: i, time: '', msg: line, type: 'info' };
                });
                setLogs(parsedLogs.reverse());
            }
            const status = await api.parser.getStatus();
            if (!status.isParsing && loading) {
                setLoading(false);
                const results = await api.parser.getPendingResults();
                if (results && results.length > 0) {
                    setParsedData(results);
                    setShowResults(true);
                }
            } else if (status.isParsing && !loading) {
                setLoading(true);
            }
            return status;
        },
        refetchInterval: loading ? 2000 : false,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true
    });

    useEffect(() => {
        const init = async () => {
            const status = await api.parser.getStatus();
            if (status.isParsing) setLoading(true);
            else {
                const results = await api.parser.getPendingResults();
                if (results && results.length > 0) {
                    setParsedData(results);
                    setShowResults(true);
                }
            }
        };
        init();
    }, []);

    const loadCities = useCallback(async (countryId: string) => {
        if (!countryId) return setCities([]);
        try {
            const citiesData = await adminGeoApi.getCities(countryId);
            setCities(citiesData as EntityItem[]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Error analyzing OSM data';
            showAlert(t('common.error'), msg, 'error');
        }
    }, [showAlert, t]);

    const fetchDbDistricts = useCallback(async (cityId: string) => {
        if (!cityId) return;
        try {
            const districts = await adminGeoApi.getDistricts(cityId);
            setDbDistricts(districts ? (districts as EntityItem[]).filter((d) => d.is_available) : []);
        } catch (err) { console.error('Error caught in empty catch block:', err); }
    }, []);

    const scanOSM = useCallback(async (cityName: string) => {
        setLoading(true);
        try {
            const res = await api.parser.findDistrictsOSM(cityName);
            setFoundDistrictsOSM(res.districts || []);
        } catch {
            showAlert(t('common.error'), t('admin_parser.errors.scan_osm'), 'error');
        } finally {
            setLoading(false);
        }
    }, [showAlert, t]);

    const createDistrictsInDb = useCallback(async (districtObjects: {name: string}[], cityId: string) => {
        setLoading(true);
        try {
            const names = districtObjects.map(d => typeof d === 'string' ? d : d.name);
            await withLogging('create_districts_from_osm', () => adminGeoApi.createDistricts(cityId, names as string[]), { cityId, names });
            await fetchDbDistricts(cityId);
            setFoundDistrictsOSM(prev => prev.filter(d => !names.includes(typeof d === 'string' ? d : d.name)));
        } catch {
            showAlert(t('common.error'), t('admin_parser.errors.create_districts'), 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchDbDistricts, showAlert, t, withLogging]);

    const deleteDbDistrict = useCallback(async (id: string, cityId: string) => {
        showConfirm(t('parserLogic.deleteWarningTitle'), t('parserLogic.deleteWarningMessage'), async () => {
            try {
                await withLogging('delete_district', () => adminGeoApi.deleteDistrict(id), { id });
                await fetchDbDistricts(cityId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Error creating districts';
                showAlert(t('common.error'), msg, 'error');
            }
        });
    }, [fetchDbDistricts, showConfirm, showAlert, t, withLogging]);

    const clearLogs = useCallback(() => {
        setLogs([]);
        prevLogContentRef.current = "";
    }, []);

    const runOfflineOsmParser = useCallback(async (config: Record<string, unknown>) => {
        setLoading(true);
        setShowResults(false);
        clearLogs();
        try {
            await api.parser.deletePendingResults();
            await api.parser.runOfflineParser(config);
        } catch (e: unknown) {
            setLoading(false);
            const msg = e instanceof Error ? e.message : 'Unknown error';
            setLogs([{ id: Date.now(), msg: `${t('admin_parser.errors.start_parser')}: ${msg}`, type: 'error' }]);
            showAlert(t('common.error'), t('admin_parser.errors.start_parser'), 'error');
        }
    }, [clearLogs, showAlert, t]);

    const importBoundariesGeoJSON = useCallback(async (file: File, cityId: string) => {
        setLoading(true);
        clearLogs();
        try {
            const text = await file.text();
            const geoJsonData = JSON.parse(text);
            const features = geoJsonData.features
                .filter((f: { properties?: { name?: string } }) => f.properties?.name)
                .map((f: { properties?: { name?: string } }) => ({ name: f.properties?.name, geojson: f }));
            
            const result = await withLogging('import_geojson_boundaries', () => adminGeoApi.importGeoJson(cityId, features), { cityId, count: features.length });
            
            setLogs([{
                id: Date.now(),
                time: new Date().toLocaleTimeString(i18n.language === 'uk' ? 'uk-UA' : 'pl-PL', { hour12: false }),
                msg: t('parserLogic.importComplete', { count: result.count }),
                type: 'info'
            }]);
            await fetchDbDistricts(cityId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Error';
            setLogs([{ id: Date.now(), msg, type: 'error' }]);
        } finally {
            setLoading(false);
        }
    }, [clearLogs, fetchDbDistricts, t, i18n.language, withLogging]);

    const removeParsedItem = useCallback((districtId: string) => {
        setParsedData(prev => {
            const newData = prev.filter(item => item.district_id !== districtId);
            api.parser.updatePending(newData).catch(() => {});
            if (newData.length === 0) setShowResults(false);
            return newData;
        });
    }, []);

    const clearAllData = useCallback(async () => {
        showConfirm(t('parserLogic.resetConfirmTitle'), t('parserLogic.resetConfirmMessage'), async () => {
            setParsedData([]);
            setShowResults(false);
            clearLogs();
            await api.parser.deletePendingResults().catch(() => {});
        });
    }, [clearLogs, showConfirm, t]);

    const clearResultsSilent = useCallback(async () => {
        setParsedData([]);
        setShowResults(false);
        await api.parser.deletePendingResults().catch(() => {});
    }, []);

    const downloadLogs = useCallback(async () => {
        try {
            const text = await api.parser.getCurrentLog();
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `parser_log_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch {
            showAlert(t('common.error'), t('admin_parser.errors.download_logs'), 'error');
        }
    }, [showAlert, t]);

    return {
        loading, logs, availableFiles, countries, cities, dbDistricts, foundDistrictsOSM, parsedData, showResults,
        loadCities, fetchDbDistricts, deleteDbDistrict, scanOSM, createDistrictsInDb, runOfflineOsmParser, importBoundariesGeoJSON,
        removeParsedItem, clearAllData, clearLogs, downloadLogs, setParsedData, setFoundDistrictsOSM, loadAvailableFiles,
        clearResultsSilent
    };
};
