import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../../services/api';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

    useEffect(() => {
        loadCountries();
        loadAvailableFiles();
        checkParserStatusAndResume();
    }, []);

    const checkParserStatusAndResume = async () => {
        await fetchCurrentLogs();
        await fetchPendingResults();
        try {
            const { isParsing } = await api.parser.getStatus();
            if (isParsing) setLoading(true);
        } catch (e) {}
    };

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                fetchCurrentLogs();
                fetchPendingResults(); 
            }, 1500);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [loading]);

    const fetchCurrentLogs = async () => {
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

            if (text.includes("✅ Парсинг завершено") || text.includes("❌ ПОМИЛКА:")) {
                setLoading(false);
            }
        } catch (e) {}
    };

    const loadAvailableFiles = async () => {
        try {
            const files = await api.parser.getPbfFiles();
            if (files) setAvailableFiles(files);
        } catch (e) {}
    };

    const loadCountries = async () => { try { setCountries(await api.geo.getCountries() || []); } catch (e) {} };

    const loadCities = async (countryId) => {
        if (!countryId) return setCities([]);
        try { setCities(await api.geo.getCities(countryId) || []); } catch (e) {}
    };

    const createCountry = async (name) => {
        try {
            const newC = await api.geo.createCountry(name);
            setCountries(prev => [...prev, newC]);
            return newC;
        } catch (e) { return null; }
    };

    const createCity = async (name, countryId) => {
        if (!countryId) return null;
        try {
            const newCity = await api.geo.createCity(name, countryId);
            setCities(prev => [...prev, newCity]);
            return newCity;
        } catch (e) { return null; }
    };

    const fetchDbDistricts = async (cityId) => {
        if (!cityId) return;
        try {
            const data = await api.geo.getDistricts(cityId);
            setDbDistricts(data ? data.filter(d => d.is_available) : []);
        } catch (e) {}
    };

    const deleteDbDistrict = async (id, cityId) => {
        if (!window.confirm("Обережно! Район буде видалено з БД назавжди.")) return;
        try {
            await api.geo.deleteDistrict(id);
            await fetchDbDistricts(cityId);
        } catch (e) {} 
    };

    const scanOSM = async (cityName) => {
        setLoading(true);
        try {
            const res = await api.parser.findDistrictsOSM(cityName);
            setFoundDistrictsOSM(res.districts || []);
        } catch (e) { 
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
        } catch(e) { 
        } finally { setLoading(false); }
    };

    const runOfflineOsmParser = async (config) => {
        setLoading(true);
        setShowResults(false);
        clearLogs();
        try {
            await api.parser.deletePendingResults();
            await api.parser.runOfflineParser(config);
        } catch (e) { setLoading(false); } 
    };

    const fetchPendingResults = async () => {
        try {
            const data = await api.parser.getPendingResults();
            if (data && data.length > 0) {
                setParsedData(data);
                setShowResults(true);
            }
        } catch (e) {}
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
        setParsedData([]);
        setShowResults(false);
        clearLogs();
        try { await api.parser.deletePendingResults(); } catch(e) {}
    };

    const clearResultsSilent = async () => {
        setParsedData([]);
        setShowResults(false);
        try { await api.parser.deletePendingResults(); } catch(e) {}
    };

    const clearLogs = () => {
        setLogs([]);
        prevLogContentRef.current = "";
    };

    const downloadLogs = () => window.open(`${BACKEND_URL.replace('/api', '')}/api/geo/download-log`, '_blank');

    return {
        loading, logs, downloadLogs, clearLogs,
        availableFiles, loadAvailableFiles,
        countries, cities, loadCities, createCountry, createCity,
        foundDistrictsOSM, setFoundDistrictsOSM,
        dbDistricts, fetchDbDistricts, deleteDbDistrict,
        createDistrictsInDb, scanOSM,
        runOfflineOsmParser, fetchPendingResults,
        parsedData, setParsedData, removeParsedItem,
        showResults, clearAllData, clearResultsSilent
    };
};