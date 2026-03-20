import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_METRICS } from '../../config/metricsConfig';
import { generatePropertyLink } from '../../utils/countryHelpers';
import { getLabelForKey } from '../map/mapIcons'; 
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';
import styles from './ParserTab.module.css';
import { FaExternalLinkAlt } from 'react-icons/fa'; // ДОДАНО ІКОНКУ

const MetricsModal = ({ isOpen, onClose, onConfirm, selectedDistricts, country, city, region }) => {
    const { t } = useTranslation('admin');
    const [useOSM, setUseOSM] = useState(true);
    const [useWAQI, setUseWAQI] = useState(true);
    const [useOtodom, setUseOtodom] = useState(true);
    const [useGUS, setUseGUS] = useState(true);
    const [selectedMetrics, setSelectedMetrics] = useState(ALL_METRICS.map(m => m.db));
    const [otodomUrls, setOtodomUrls] = useState({});

    useEffect(() => {
        if (isOpen) {
            const urls = {};
            selectedDistricts.forEach(d => {
                urls[d.id] = generatePropertyLink(country?.name, city?.name, d.name, region);
            });
            setOtodomUrls(urls);
        }
    }, [isOpen, selectedDistricts, country, city, region]);

    const toggleMetric = (dbName) => {
        setSelectedMetrics(prev => prev.includes(dbName) ? prev.filter(m => m !== dbName) : [...prev, dbName]);
    };

    const handleConfirm = () => {
        onConfirm({ useOSM, useWAQI, useOtodom, useGUS, selectedMetrics, otodomUrls });
        onClose();
    };

    if (!isOpen) return null;

    const modalActions = (
        <>
            <button className={`${uiStyles.btn} ${uiStyles.btnCancel}`} onClick={onClose}>
                {t('metricsModal.cancel', {defaultValue: 'Скасувати'})}
            </button>
            <button className={`${uiStyles.btn} ${uiStyles.btnPrimary}`} onClick={handleConfirm}>
                {t('metricsModal.start', {defaultValue: 'Запустити парсер'})}
            </button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={t('metricsModal.title', {defaultValue: '⚙️ Налаштування Парсера'})} maxWidth="600px" actions={modalActions}>
            <div className={styles.metricsModalBody}>
                <div className={styles.metricsSection}>
                    <h4 className={styles.metricsTitle}>{t('metricsModal.dataSource', {defaultValue: 'Джерела даних'})}</h4>
                    <div className={styles.metricsGrid}>
                        <label className={styles.metricCheckbox}>
                            <input type="checkbox" checked={useOSM} onChange={(e) => setUseOSM(e.target.checked)} /> {t('metricsModal.osm', {defaultValue: '🗺️ OSM (Інфраструктура)'})}
                        </label>
                        <label className={styles.metricCheckbox}>
                            <input type="checkbox" checked={useWAQI} onChange={(e) => setUseWAQI(e.target.checked)} /> {t('metricsModal.waqi', {defaultValue: '🍃 WAQI (Повітря)'})}
                        </label>
                        <label className={styles.metricCheckbox}>
                            <input type="checkbox" checked={useOtodom} onChange={(e) => setUseOtodom(e.target.checked)} /> {t('metricsModal.otodom', {defaultValue: '🏠 Otodom (Ціни)'})}
                        </label>
                        <label className={styles.metricCheckbox}>
                            <input type="checkbox" checked={useGUS} onChange={(e) => setUseGUS(e.target.checked)} /> {t('metricsModal.gus', {defaultValue: '📈 GUS (Зарплата)'})}
                        </label>
                    </div>
                </div>

                {useOSM && (
                    <div className={styles.metricsSection}>
                        <h4 className={styles.metricsTitle}>{t('metricsModal.selectMetrics', {defaultValue: 'Оберіть метрики OSM'})}</h4>
                        <div className={styles.metricsGrid}>
                            {ALL_METRICS.map(m => (
    <label key={m.db} className={styles.metricCheckbox}>
        <input 
            type="checkbox" 
            checked={selectedMetrics.includes(m.db)} 
            onChange={() => toggleMetric(m.db)} 
        />
{t(`osmMetrics.${m.db}`, { defaultValue: m.label || getLabelForKey(m.db) })}    </label>
))}
                        </div>
                    </div>
                )}

                {useOtodom && selectedDistricts.length > 0 && (
                    <div className={styles.metricsSection}>
                        <h4 className={styles.metricsTitle}>{t('metricsModal.otodomCheck', {defaultValue: 'Перевірка посилань Otodom'})}</h4>
                        <div className={styles.urlList}>
                            {selectedDistricts.map(d => {
                                const currentUrl = otodomUrls[d.id] || '';
                                const isValidUrl = currentUrl.startsWith('http');

                                return (
                                    <div key={d.id} className={styles.urlRow} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <span className={styles.urlLabel} style={{ minWidth: '120px', fontWeight: '500' }}>{d.name}</span>
                                        <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                                            <input 
                                                type="text" 
                                                className={uiStyles.input}
                                                value={currentUrl} 
                                                onChange={(e) => setOtodomUrls(prev => ({...prev, [d.id]: e.target.value}))}
                                                placeholder="https://..."
                                                style={{ flex: 1, margin: 0 }}
                                            />
                                            {/* КНОПКА ПЕРЕХОДУ ПО ПОСИЛАННЮ */}
                                            <a 
                                                href={isValidUrl ? currentUrl : '#'} 
                                                target={isValidUrl ? "_blank" : "_self"} 
                                                rel="noopener noreferrer"
                                                className={`${uiStyles.btn}`}
                                                style={{ 
                                                    padding: '0 12px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    background: isValidUrl ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-main)',
                                                    color: isValidUrl ? 'var(--primary)' : 'var(--text-muted)',
                                                    border: `1px solid ${isValidUrl ? 'rgba(59, 130, 246, 0.3)' : 'var(--border)'}`,
                                                    cursor: isValidUrl ? 'pointer' : 'not-allowed',
                                                    opacity: isValidUrl ? 1 : 0.6
                                                }}
                                                title="Відкрити посилання у новій вкладці"
                                                onClick={(e) => !isValidUrl && e.preventDefault()}
                                            >
                                                <FaExternalLinkAlt />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default React.memo(MetricsModal);