import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabaseClient';
// @ts-ignore
import { api } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import { useModals } from '../ui/ModalContext';

export const useParserLogic = () => {
    const { t, i18n } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [dbDistricts, setDbDistricts] = useState<any[]>([]);
    const [foundDistrictsOSM, setFoundDistrictsOSM] = useState<any[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const prevLogContentRef = useRef("");

    const { data: countries = [] } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('admin-geo-list', { body: { action: 'get_countries' } });
            if (error) throw error;
            return data.data || [];
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
                const parsedLogs = text.split('\n').filter(Boolean).map((line: string, i: number) => {
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
        refetchInterval: loading ? 2000 : false
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
            const { data, error } = await supabase.functions.invoke('admin-geo-list', { body: { action: 'get_cities', countryId } });
            if (error) throw error;
            setCities(data.data || []);
        } catch (e) {
            showAlert(t('common.error'), t('admin_parser.errors.load_cities'), 'error');
        }
    }, [showAlert, t]);

    const fetchDbDistricts = useCallback(async (cityId: string) => {
        if (!cityId) return;
        try {
            const { data, error } = await supabase.functions.invoke('admin-geo-list', { body: { action: 'get_districts', cityId } });
            if (error) throw error;
            setDbDistricts(data.data ? data.data.filter((d: any) => d.is_available) : []);
        } catch (e) {}
    }, []);

    const scanOSM = useCallback(async (cityName: string) => {
        setLoading(true);
        try {
            const res = await api.parser.findDistrictsOSM(cityName);
            setFoundDistrictsOSM(res.districts || []);
        } catch (e) {
            showAlert(t('common.error'), t('admin_parser.errors.scan_osm'), 'error');
        } finally {
            setLoading(false);
        }
    }, [showAlert, t]);

    const createDistrictsInDb = useCallback(async (districtObjects: any[], cityId: string) => {
        setLoading(true);
        try {
            const names = districtObjects.map(d => typeof d === 'string' ? d : d.name);
            const { error } = await supabase.functions.invoke('admin-geo-manage', {
                body: { action: 'create_districts', payload: { cityId, names } }
            });
            if (error) throw error;
            await fetchDbDistricts(cityId);
            setFoundDistrictsOSM(prev => prev.filter(d => !names.includes(typeof d === 'string' ? d : d.name)));
        } catch (e) {
            showAlert(t('common.error'), t('admin_parser.errors.create_districts'), 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchDbDistricts, showAlert, t]);

    const deleteDbDistrict = useCallback(async (id: string, cityId: string) => {
        showConfirm(t('parserLogic.deleteWarningTitle'), t('parserLogic.deleteWarningMessage'), async () => {
            try {
                const { error } = await supabase.functions.invoke('admin-geo-manage', {
                    body: { action: 'delete_district', payload: { districtId: id } }
                });
                if (error) throw error;
                await fetchDbDistricts(cityId);
            } catch (e: any) {
                showAlert(t('common.error'), e.message, 'error');
            }
        });
    }, [fetchDbDistricts, showConfirm, showAlert, t]);

    const clearLogs = useCallback(() => {
        setLogs([]);
        prevLogContentRef.current = "";
    }, []);

    const runOfflineOsmParser = useCallback(async (config: any) => {
        setLoading(true);
        setShowResults(false);
        clearLogs();
        try {
            await api.parser.deletePendingResults();
            await api.parser.runOfflineParser(config);
        } catch (e) {
            setLoading(false);
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
                .filter((f: any) => f.properties?.name)
                .map((f: any) => ({ name: f.properties.name, geojson: f }));
            const { data, error } = await supabase.functions.invoke('admin-geo-manage', {
                body: { action: 'import_geojson', payload: { cityId, features } }
            });
            if (error || data?.error) throw new Error(error?.message || data?.error);
            setLogs([{
                id: Date.now(),
                time: new Date().toLocaleTimeString(i18n.language === 'uk' ? 'uk-UA' : 'pl-PL', { hour12: false }),
                msg: t('parserLogic.importComplete', { count: data.count, defaultValue: `Імпортовано ${data.count} об'єктів` }),
                type: 'info'
            }]);
            await fetchDbDistricts(cityId);
        } catch (e: any) {
            setLogs([{ id: Date.now(), msg: e.message, type: 'error' }]);
        } finally {
            setLoading(false);
        }
    }, [clearLogs, fetchDbDistricts, t, i18n.language]);

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