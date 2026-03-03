// ParserTab.jsx
import React, { useState, useEffect } from 'react';
import { useParserLogic } from '../../hooks/useParserLogic';
import ParserSettings from './ParserSettings';
import DistrictsManager from './DistrictsManager';
import ParserConsole from './ParserConsole';
import MetricsModal from './MetricsModal';
import ResultsTable from '../resultsTable/ResultsTable';
import { api } from '../../../../services/api';
import styles from './ParserTab.module.css';

export default function ParserTab() {
    const logic = useParserLogic();
    const [pbfFile, setPbfFile] = useState(() => localStorage.getItem('parser_file') || '');
    const [country, setCountry] = useState(() => JSON.parse(localStorage.getItem('parser_country')) || null);
    const [city, setCity] = useState(() => JSON.parse(localStorage.getItem('parser_city')) || null);
    const [region, setRegion] = useState(() => localStorage.getItem('parser_region') || '');
    const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const toggleSelectAll = (select) => {
        if (select) setSelectedDistrictIds(logic.dbDistricts.map(d => d.id));
        else setSelectedDistrictIds([]);
    };

    const toggleDistrictSelection = (id) => {
        setSelectedDistrictIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleResetAll = () => {
        if (!window.confirm("Скинути всі налаштування та очистити результати?")) return;
        setCity(null); setCountry(null); setRegion(''); setPbfFile(logic.availableFiles[0] || ''); setSelectedDistrictIds([]);
        logic.clearAllData(); 
        localStorage.removeItem('parser_city'); localStorage.removeItem('parser_country'); localStorage.removeItem('parser_region');
    };

    const handleStartParser = (config) => {
        setIsModalOpen(false);
        const payload = {
            cityName: city?.name,
            pbfFileName: pbfFile,
            districts: logic.dbDistricts.filter(d => selectedDistrictIds.includes(d.id)),
            ...config
        };
        logic.runOfflineOsmParser(payload);
    };

    const handleSave = async (rows) => {
        try {
            await api.geo.saveParsedResults(rows);
            if (rows.length > 1 || logic.parsedData.length <= 1) {
                logic.clearResultsSilent();
            }
        } catch (e) {
            alert(`Помилка збереження: ${e.message}`);
            throw e; 
        }
    };

return (
        <div className={styles.mainWrapper}>
            <div className={styles.pageHeader}>
                <div>
                    <h2 className={styles.pageTitle}>Парсер Даних</h2>
                    <p className={styles.pageSubtitle}>Автоматичний збір інфраструктури та цін для районів</p>
                </div>
                <button onClick={handleResetAll} className={`${styles.btn} ${styles.dangerBtn}`}>🔄 Скинути все</button>
            </div>

            <div className={styles.topGrid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.stepTitle}>
                            <span className={styles.stepNumber}>1</span>
                            <h3>Файл карти (.pbf)</h3>
                        </div>
                        <button onClick={logic.loadAvailableFiles} className={styles.iconBtnText}>🔄 Оновити</button>
                    </div>
                    <div className={styles.cardBody}>
                        {logic.availableFiles.length === 0 ? (
                            <div className={styles.emptyFolderBox}>Папка server/data порожня. Додайте .pbf файли.</div>
                        ) : (
                            <select className={styles.selectInput} value={pbfFile} onChange={(e) => setPbfFile(e.target.value)}>
                                {logic.availableFiles.map(file => <option key={file} value={file}>{file}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.stepTitle}>
                            <span className={styles.stepNumber}>2</span>
                            <h3>Локація</h3>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        <ParserSettings
                            country={country} setCountry={setCountry}
                            city={city} setCity={setCity}
                            region={region} setRegion={setRegion}
                            countriesList={logic.countries} citiesList={logic.cities}
                            onCountryChange={logic.loadCities}
                        />
                    </div>
                </div>
            </div>

            {city && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.stepTitle}>
                            <span className={styles.stepNumber}>3</span>
                            <h3>Управління районами ({city.name})</h3>
                        </div>
                    </div>
                    <div className={styles.cardBodyOutless}>
                        <DistrictsManager
                            foundDistricts={logic.foundDistrictsOSM} dbDistricts={logic.dbDistricts}
                            selectedIds={selectedDistrictIds} onToggleSelect={toggleDistrictSelection} onSelectAll={toggleSelectAll}
                            onScan={() => logic.scanOSM(city?.name)} onCreate={() => logic.createDistrictsInDb(logic.foundDistrictsOSM, city.id)}
                            onRemoveFromFound={(d) => logic.setFoundDistrictsOSM(prev => prev.filter(item => item !== d))}
                            onDeleteDbDistrict={(id) => logic.deleteDbDistrict(id, city.id)} 
                            onImportGeoJson={(file) => logic.importBoundariesGeoJSON(file, city.id)}
                            loading={logic.loading}
                        />
                    </div>
                </div>
            )}

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.stepTitle}>
                        <span className={styles.stepNumber}>4</span>
                        <h3>Логи парсера</h3>
                    </div>
                </div>
                <div className={styles.cardBodyOutless}>
                    <ParserConsole 
                        logs={logic.logs}
                        loading={logic.loading}
                        onClear={logic.clearLogs}
                        onDownload={logic.downloadLogs}
                        onStartClick={() => setIsModalOpen(true)}
                        isStartDisabled={logic.loading || !city || selectedDistrictIds.length === 0 || !pbfFile}
                        selectedCount={selectedDistrictIds.length}
                    />
                </div>
            </div>

            {logic.showResults && logic.parsedData.length > 0 && (
                <div className={`${styles.card} ${styles.resultsCard}`}>
                    <div className={styles.cardHeader}>
                        <div className={styles.stepTitle}>
                            <span className={`${styles.stepNumber} ${styles.stepNumberSuccess}`}>5</span>
                            <h3>Результати парсингу</h3>
                        </div>
                    </div>
                    <div className={styles.cardBodyOutless}>
                        <ResultsTable
                            data={logic.parsedData}
                            onEdit={(index, key, value) => logic.setParsedData(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))}
                            onSave={handleSave}
                            onRemove={logic.removeParsedItem}
                        />
                    </div>
                </div>
            )}

            <MetricsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onConfirm={handleStartParser} 
                country={country}
                city={city}
                region={region}
                selectedDistricts={logic.dbDistricts.filter(d => selectedDistrictIds.includes(d.id))}
            />
        </div>
    );
}