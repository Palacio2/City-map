import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@supabaseClient';
import { useParserLogic } from '../../hooks/useParserLogic';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import ParserSettings from './ParserSettings';
import DistrictsManager from './DistrictsManager';
import ParserConsole from './ParserConsole';
import MetricsModal from './MetricsModal';
import DistrictRow from '../resultsTable/DistrictRow';
import { api } from '../../../../services/api';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/AdminContext';
import { useModals } from '../../ui/ModalContext';
import { FaSync, FaMapMarkedAlt, FaCogs, FaDatabase, FaListUl, FaChartBar } from 'react-icons/fa';

const safeJSONParse = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item && item !== 'undefined' ? JSON.parse(item) : null;
    } catch (e) { return null; }
};

export default function ParserTab() {
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
    const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const allowedCities = useMemo(() => {
        return isSuperAdmin ? logic.cities : logic.cities.filter(c => adminCityIds.includes(c.id));
    }, [isSuperAdmin, logic.cities, adminCityIds]);

    useEffect(() => {
        if (city?.id) logic.fetchDbDistricts(city.id);
        localStorage.setItem('parser_city', JSON.stringify(city));
    }, [city]);

    useEffect(() => { localStorage.setItem('parser_country', JSON.stringify(country)); }, [country]);
    useEffect(() => { localStorage.setItem('parser_file', pbfFile); }, [pbfFile]);
    useEffect(() => { localStorage.setItem('parser_region', region); }, [region]);

    useEffect(() => {
        if (logic.dbDistricts.length > 0) setSelectedDistrictIds(logic.dbDistricts.map(d => d.id));
        else setSelectedDistrictIds([]);
    }, [logic.dbDistricts]);

    useEffect(() => {
        if (logic.availableFiles.length > 0 && !pbfFile) setPbfFile(logic.availableFiles[0]);
    }, [logic.availableFiles]);

    const processedParsedData = useMemo(() => {
        return logic.parsedData.map(row => ({
            ...(row.parsed_data || row.data || {}),
            ...row
        }));
    }, [logic.parsedData]);

    const toggleSelectAll = useCallback((select) => {
        if (select) setSelectedDistrictIds(logic.dbDistricts.map(d => d.id));
        else setSelectedDistrictIds([]);
    }, [logic.dbDistricts]);

    const toggleDistrictSelection = useCallback((id) => {
        setSelectedDistrictIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    const handleResetAll = useCallback(() => {
        showConfirm(
            t('common.warning'),
            t('admin_parser.tab.confirm_reset'),
            () => {
                setCity(null); setCountry(null); setRegion('');
                setPbfFile(logic.availableFiles[0] || ''); setSelectedDistrictIds([]);
                logic.clearAllData(); 
                localStorage.removeItem('parser_city'); 
                localStorage.removeItem('parser_country'); 
                localStorage.removeItem('parser_region');
            }
        );
    }, [t, showConfirm, logic]);

    const handleStartParser = useCallback((config) => {
        setIsModalOpen(false);
        const payload = {
            cityName: city?.name,
            pbfFileName: pbfFile,
            districts: logic.dbDistricts.filter(d => selectedDistrictIds.includes(d.id)),
            ...config
        };
        logic.runOfflineOsmParser(payload);
    }, [city, pbfFile, logic, selectedDistrictIds]);

    const handleSave = useCallback(async (rows) => {
        try {
            const allFields = metricGroups.flatMap(g => g.fields);
            const payloadsToSave = [];
            const statusPromises = [];
            
            for (const row of rows) {
                const payload = { district_id: row.district_id };
                
                if (row.geojson !== undefined) payload.geojson = row.geojson;
                if (row.poi_data !== undefined) payload.poi_data = row.poi_data;
                else if (row.parsed_pois !== undefined) payload.poi_data = row.parsed_pois;

                const parseNumber = (val, isFloat) => {
                    if (val === null || val === undefined || val === '') return null; 
                    const stringVal = String(val).replace(/\s/g, '').replace(',', '.');
                    const num = Number(stringVal);
                    if (isNaN(num)) return 0;
                    return isFloat ? num : Math.round(num);
                };

                // ОНОВЛЕНА ЛОГІКА: Безпечно дістаємо ключі та типи для збереження
                allFields.forEach(field => {
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
            
            // ОНОВЛЕНА ЛОГІКА: Відправляємо єдиний запит на наш бекенд
            const results = await Promise.all([
                ...statusPromises,
                api.geo.saveParsedResults(payloadsToSave)
            ]);
            
            const errors = results.filter(r => r?.error || r?.data?.error);
            if (errors.length > 0) throw new Error(errors[0]?.error?.message || errors[0]?.data?.error || 'Unknown error');
            
            if (rows.length > 1 || logic.parsedData.length <= 1) {
                logic.clearResultsSilent();
            }
            
            showAlert(t('common.success'), t('admin_parser.tab.save_success'), 'success');
        } catch (e) {
            showAlert(t('common.error'), `${t('admin_parser.tab.save_error')} ${e.message}`, 'error');
            throw e; 
        }
    }, [metricGroups, logic, showAlert, t]);

    const handleEditRow = useCallback((districtId, key, value) => {
        logic.setParsedData(prev => 
            prev.map(item => item.district_id === districtId ? { ...item, [key]: value } : item)
        );
    }, [logic]);

    return (
        <div className="flex flex-col gap-6 pb-10 animate-fadeInOverlay">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface p-6 rounded-xl shadow-sm border border-border gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-primary border border-blue-500/20 flex items-center justify-center text-[1.4rem]">
                        <FaCogs />
                    </div>
                    <div>
                        <h2 className="m-0 mb-1 text-[1.4rem] text-textMain font-extrabold tracking-tight">{t('admin_parser.tab.title')}</h2>
                        <p className="m-0 text-textMuted text-[0.95rem] font-medium">{t('admin_parser.tab.subtitle')}</p>
                    </div>
                </div>
                <Button variant="danger" onClick={handleResetAll} className="w-full sm:w-auto !shadow-none !px-5">
                    {t('admin_parser.tab.reset_all')}
                </Button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-main/50 border-b border-border flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-500/10 text-primary border border-blue-500/20 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[1rem]"><FaDatabase size={12}/></span>
                            <h3 className="m-0 text-[1.1rem] text-textMain font-bold tracking-tight">{t('admin_parser.tab.step1')}</h3>
                        </div>
                        <button onClick={logic.loadAvailableFiles} className="bg-transparent border-none text-primary font-bold text-[0.85rem] cursor-pointer hover:underline flex items-center gap-1.5"><FaSync/> {t('admin_parser.tab.refresh')}</button>
                    </div>
                    <div className="p-6 flex-1 bg-surface">
                        {logic.availableFiles.length === 0 ? (
                            <div className="p-6 text-center text-textMuted bg-main rounded-lg border border-dashed border-border font-medium">{t('admin_parser.tab.empty_folder')}</div>
                        ) : (
                            <Select value={pbfFile} onChange={(e) => setPbfFile(e.target.value)}>
                                {logic.availableFiles.map(file => <option key={file} value={file}>{file}</option>)}
                            </Select>
                        )}
                    </div>
                </div>

                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-main/50 border-b border-border flex items-center gap-3">
                        <span className="bg-blue-500/10 text-primary border border-blue-500/20 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[1rem]"><FaMapMarkedAlt size={12}/></span>
                        <h3 className="m-0 text-[1.1rem] text-textMain font-bold tracking-tight">{t('admin_parser.tab.step2')}</h3>
                    </div>
                    <div className="p-6 flex-1 bg-surface">
                        <ParserSettings
                            country={country} setCountry={setCountry}
                            city={city} setCity={setCity}
                            region={region} setRegion={setRegion}
                            countriesList={logic.countries} citiesList={allowedCities}
                            onCountryChange={logic.loadCities}
                        />
                    </div>
                </div>
            </div>

            {city && (
                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-main/50 border-b border-border flex items-center gap-3">
                        <span className="bg-blue-500/10 text-primary border border-blue-500/20 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[1rem]"><FaListUl size={12}/></span>
                        <h3 className="m-0 text-[1.1rem] text-textMain font-bold tracking-tight">{t('admin_parser.tab.step3')} <span className="text-primary">({city.name})</span></h3>
                    </div>
                    <div className="p-0">
                        <DistrictsManager
                            foundDistricts={logic.foundDistrictsOSM} dbDistricts={logic.dbDistricts}
                            selectedIds={selectedDistrictIds} onToggleSelect={toggleDistrictSelection} onSelectAll={toggleSelectAll}
                            onScan={() => logic.scanOSM(city?.name)} onCreate={(districtsToCreate) => logic.createDistrictsInDb(districtsToCreate, city.id)}
                            onRemoveFromFound={(d) => logic.setFoundDistrictsOSM(prev => prev.filter(item => item !== d))}
                            onDeleteDbDistrict={(id) => logic.deleteDbDistrict(id, city.id)} 
                            onImportGeoJson={(file) => logic.importBoundariesGeoJSON(file, city.id)}
                            loading={logic.loading}
                            isSuperAdmin={isSuperAdmin}
                        />
                    </div>
                </div>
            )}

            <div className="p-0">
                <ParserConsole 
                    logs={logic.logs} loading={logic.loading} onClear={logic.clearLogs}
                    onDownload={logic.downloadLogs} onStartClick={() => setIsModalOpen(true)}
                    isStartDisabled={logic.loading || !city || selectedDistrictIds.length === 0 || !pbfFile}
                    selectedCount={selectedDistrictIds.length}
                />
            </div>

            {logic.showResults && processedParsedData.length > 0 && (
                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col mt-6">
                    <div className="p-4 bg-emerald-500/5 border-b border-border flex items-center gap-3">
                        <span className="bg-emerald-500/10 text-success border border-emerald-500/20 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[1rem]"><FaChartBar size={12}/></span>
                        <h3 className="m-0 text-[1.1rem] text-success font-extrabold tracking-tight">{t('admin_parser.tab.step5')}</h3>
                    </div>
                    <div className="p-4 bg-surface flex flex-col gap-4">
                        {processedParsedData.map(row => (
                            <DistrictRow
                                key={row.district_id}
                                row={row}
                                onEdit={handleEditRow}
                                onSave={handleSave}
                                onRemove={logic.removeParsedItem}
                            />
                        ))}
                    </div>
                </div>
            )}

            <MetricsModal 
                isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleStartParser} 
                country={country} city={city} region={region} selectedDistricts={logic.dbDistricts.filter(d => selectedDistrictIds.includes(d.id))}
            />
        </div>
    );
}