import React, { useState, useEffect } from 'react';
import { ALL_METRICS } from '../../config/metricsConfig';
import { generatePropertyLink } from '../../utils/countryHelpers';
import styles from './MetricsModal.module.css';
import { useTranslation } from 'react-i18next';

export default function MetricsModal({ isOpen, onClose, onConfirm, selectedDistricts, country, city, region }) {
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

    if (!isOpen) return null;

    const toggleMetric = (dbName) => {
        setSelectedMetrics(prev => prev.includes(dbName) ? prev.filter(m => m !== dbName) : [...prev, dbName]);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3 className={styles.modalTitle}>{t('metricsModal.title')}</h3>
                
                <div className={styles.mainSettingsGrid}>
                    <label className={styles.toggleLabel}>
                        <input type="checkbox" checked={useOSM} onChange={e => setUseOSM(e.target.checked)} className={styles.checkbox}/> 
                        <span>{t('metricsModal.osm')}</span>
                    </label>
                    <label className={styles.toggleLabel}>
                        <input type="checkbox" checked={useWAQI} onChange={e => setUseWAQI(e.target.checked)} className={styles.checkbox}/> 
                        <span>{t('metricsModal.waqi')}</span>
                    </label>
                    <label className={styles.toggleLabel}>
                        <input type="checkbox" checked={useGUS} onChange={e => setUseGUS(e.target.checked)} className={styles.checkbox}/> 
                        <span>{t('metricsModal.gus')}</span>
                    </label>
                    <label className={styles.toggleLabel}>
                        <input type="checkbox" checked={useOtodom} onChange={e => setUseOtodom(e.target.checked)} className={styles.checkbox}/> 
                        <span>{t('metricsModal.otodom')}</span>
                    </label>
                </div>

                {useOSM && (
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>{t('metricsModal.osmMetrics')}</h4>
                        <div className={styles.metricsGrid}>
                            {ALL_METRICS.map(m => {
                                const isChecked = selectedMetrics.includes(m.db);
                                return (
                                    <label key={m.db} className={`${styles.metricLabel} ${isChecked ? styles.metricLabelHasChecked : ''}`}>
                                        <input type="checkbox" checked={isChecked} onChange={() => toggleMetric(m.db)} className={styles.checkbox}/>
                                        {m.db}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                {useOtodom && (
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>{t('metricsModal.otodomCheck')}</h4>
                        <div className={styles.urlList}>
                            {selectedDistricts.map(d => (
                                <div key={d.id} className={styles.urlItem}>
                                    <span className={styles.urlLabel}>{d.name}</span>
                                    <input 
                                        type="text" 
                                        className={styles.textInput} 
                                        value={otodomUrls[d.id] || ''} 
                                        onChange={(e) => setOtodomUrls(prev => ({...prev, [d.id]: e.target.value}))}
                                        placeholder="https://..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.modalActions}>
                    <button onClick={onClose} className={`${styles.btn} ${styles.defaultBtn}`}>{t('metricsModal.cancel')}</button>
                    <button onClick={() => onConfirm({ selectedMetrics, useOSM, useWAQI, useOtodom, useGUS, otodomUrls })} className={`${styles.btn} ${styles.primaryBtn}`}>
                        {t('metricsModal.start')}
                    </button>
                </div>
            </div>
        </div>
    );
}