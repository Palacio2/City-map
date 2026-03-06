import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../../services/api';

export const useParserLogic = () => {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [foundDistrictsOSM, setFoundDistrictsOSM] = useState([]);
    const [parsedData, setParsedData] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const prevLogContentRef = useRef("");
    const pollingInterval = useRef(null);

    const fetchCurrentLogs = useCallback(async () => {
        try {
            const text = await api.parser.getCurrentLog();
            if (text && text !== prevLogContentRef.current) {
                prevLogContentRef.current = text;
                const parsedLogs = text.split('\n').filter(Boolean).map((line, i) => {
                    const match = line.match(/^\[(.*?)\] (.*)/);
                    return match 
                        ? { id: i, time: match[1], msg: match[2], type: 'info' }
                        : { id: i, time: '', msg: line, type: 'info' };
                });
                setLogs(parsedLogs.reverse());
            }
        } catch {
        }
    }, []);

    const fetchPendingResults = useCallback(async () => {
        try {
            const data = await api.parser.getPendingResults();
            if (data && Array.isArray(data) && data.length > 0) {
                setParsedData(data);
                setShowResults(true);
            } else {
                setShowResults(false);
            }
        } catch (e) {
            console.error("Помилка завантаження результатів:", e);
        }
    }, []);

    const checkInitialStatus = useCallback(async () => {
        try {
            const { isParsing } = await api.parser.getStatus();
            if (isParsing) {
                setLoading(true);
            } else {
                fetchPendingResults();
            }
        } catch {
        }
        await fetchCurrentLogs();
    }, [fetchPendingResults, fetchCurrentLogs]);

    const stopPolling = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        if (pollingInterval.current) return;
        
        pollingInterval.current = setInterval(async () => {
            await fetchCurrentLogs();
            
            try {
                const status = await api.parser.getStatus();
                if (!status.isParsing) {
                    stopPolling();
                    setLoading(false);
                    setTimeout(() => {
                        fetchPendingResults();
                    }, 1000);
                }
            } catch (e) {
                console.error("Помилка перевірки статусу:", e);
            }
        }, 2000);
    }, [fetchCurrentLogs, stopPolling, fetchPendingResults]);

    const loadCountries = useCallback(async () => {
        try { setCountries(await api.geo.getCountries() || []); } catch {}
    }, []);

    const loadAvailableFiles = useCallback(async () => {
        try { setAvailableFiles(await api.parser.getPbfFiles() || []); } catch {}
    }, []);

    useEffect(() => {
        loadCountries();
        loadAvailableFiles();
        checkInitialStatus();
        return stopPolling;
    }, [loadCountries, loadAvailableFiles, checkInitialStatus, stopPolling]);

    useEffect(() => {
        if (loading) {
            startPolling();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [loading, startPolling, stopPolling]);

    const loadCities = async (countryId) => {
        if (!countryId) return setCities([]);
        try { setCities(await api.geo.getCities(countryId) || []); } catch {}
    };

    const fetchDbDistricts = async (cityId) => {
        if (!cityId) return;
        try {
            const data = await api.geo.getDistricts(cityId);
            setDbDistricts(data ? data.filter(d => d.is_available) : []);
        } catch {}
    };

    const scanOSM = async (cityName) => {
        setLoading(true);
        try {
            const res = await api.parser.findDistrictsOSM(cityName);
            setFoundDistrictsOSM(res.districts || []);
        } catch {
        } finally { setLoading(false); }
    };

    const createDistrictsInDb = async (districtObjects, cityId) => {
        setLoading(true);
        try {
            for (const d of districtObjects) {
                const name = typeof d === 'string' ? d : d.name;
                await api.geo.createDistrict(name, cityId, null);
            }
            await fetchDbDistricts(cityId);
            setFoundDistrictsOSM([]);
        } catch {
        } finally { setLoading(false); }
    };

    const deleteDbDistrict = async (id, cityId) => {
        if (!window.confirm("Обережно! Район буде видалено з БД назавжди.")) return;
        try { await api.geo.deleteDistrict(id); await fetchDbDistricts(cityId); } catch {} 
    };

    const runOfflineOsmParser = async (config) => {
        setLoading(true);
        setShowResults(false);
        clearLogs();
        try {
            await api.parser.deletePendingResults();
            await api.parser.runOfflineParser(config);
        } catch { setLoading(false); } 
    };

    const importBoundariesGeoJSON = async (file, cityId) => {
        setLoading(true);
        clearLogs();
        try {
            const text = await file.text();
            const geoJsonData = JSON.parse(text);
            if (!geoJsonData.features) throw new Error('Неправильний формат GeoJSON');

            let currentDistricts = await api.geo.getDistricts(cityId) || [];
            let successCount = 0;
            let currentLogs = [];

            const addLog = (msg) => {
                currentLogs.unshift({ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString('uk-UA', { hour12: false }), msg, type: 'info' });
                setLogs([...currentLogs]);
            };

            for (const feature of geoJsonData.features) {
                const osmName = feature.properties?.name;
                if (!osmName) continue;
                if (osmName.toLowerCase().includes('parafia')) { addLog(`⏭️ Пропущено (парафія): ${osmName}`); continue; }

                let dbDistrict = currentDistricts.find(d => d.name.trim().toLowerCase() === osmName.trim().toLowerCase());

                if (!dbDistrict) {
                    addLog(`✨ Створюю новий район: ${osmName}`);
                    dbDistrict = await api.geo.createDistrict(osmName, cityId);
                    if (dbDistrict) currentDistricts.push(dbDistrict);
                }

                if (dbDistrict) {
                    try {
                        await api.geo.saveParsedResults([{ district_id: dbDistrict.id, district_name: dbDistrict.name, geojson: feature }]);
                        successCount++;
                        addLog(`✅ Збережено межі для: ${osmName}`);
                    } catch (err) { addLog(`❌ Помилка збереження ${osmName}: ${err.message}`); }
                }
            }
            addLog(`🎉 Імпорт завершено. Успішно опрацьовано: ${successCount} районів.`);
            await fetchDbDistricts(cityId);
        } catch (e) {
            setLogs([{ id: Date.now(), time: new Date().toLocaleTimeString('uk-UA', { hour12: false }), msg: `❌ ПОМИЛКА: ${e.message}`, type: 'error' }]);
        } finally { setLoading(false); }
    };

    const removeParsedItem = useCallback((districtId) => {
        setParsedData(prev => {
            const newData = prev.filter(item => item.district_id !== districtId);
            api.parser.updatePending(newData).catch(()=>{});
            if (newData.length === 0) setShowResults(false);
            return newData;
        });
    }, []);

    const clearAllData = async () => {
        if (!window.confirm("Скинути всі результати парсингу?")) return;
        setParsedData([]); setShowResults(false); clearLogs();
        try { await api.parser.deletePendingResults(); } catch {}
    };

    const clearResultsSilent = async () => {
        setParsedData([]); setShowResults(false);
        try { await api.parser.deletePendingResults(); } catch {}
    };

    const clearLogs = () => { setLogs([]); prevLogContentRef.current = ""; };

    const downloadLogs = async () => {
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
        } catch { alert("Не вдалося завантажити логи."); }
    };

    return {
        loading, logs, availableFiles, countries, cities, dbDistricts, foundDistrictsOSM, parsedData, showResults,
        loadCities, fetchDbDistricts, deleteDbDistrict, scanOSM, createDistrictsInDb, runOfflineOsmParser, importBoundariesGeoJSON,
        removeParsedItem, clearAllData, clearResultsSilent, clearLogs, downloadLogs, setParsedData, setFoundDistrictsOSM, loadAvailableFiles
    };
};