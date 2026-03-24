import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { generatePropertyLink } from '../../utils/countryHelpers';
import { getCountryConfig } from '../../config/countryConfig';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { FaExternalLinkAlt } from 'react-icons/fa';

const CustomCheckbox = ({ checked, onChange, label }) => (
    <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all select-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-main ${checked ? 'bg-blue-500/5 border-primary shadow-sm' : 'bg-main border-transparent hover:bg-surface hover:border-border'}`}>
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
            <div className="w-5 h-5 rounded-md border-2 border-border bg-surface transition-all peer-checked:bg-primary peer-checked:border-primary shadow-sm"></div>
            {checked && <span className="absolute w-1.5 h-2.5 border-solid border-white border-0 border-r-2 border-b-2 rotate-45 mb-0.5"></span>}
        </div>
        <span className={`font-bold text-[0.9rem] ${checked ? 'text-primary' : 'text-textMain'}`}>{label}</span>
    </label>
);

const MetricsModal = ({ isOpen, onClose, onConfirm, selectedDistricts, country, city, region }) => {
    const { t } = useTranslation('adminParser');
    const { fieldsConfig = [] } = useDynamicFields();
    
    const countryConfig = useMemo(() => getCountryConfig(country?.name), [country]);

    // 1. Формуємо allMetrics з fieldsConfig
    const allMetrics = useMemo(() => {
        return fieldsConfig.filter(f => f.is_osm);
    }, [fieldsConfig]);

    // 2. Динамічно визначаємо, які типи джерел взагалі є в базі
    const availableSources = useMemo(() => {
        const sources = new Set();
        fieldsConfig.forEach(f => {
            const s = (f.parser_config?.source || f.source_type || '').toLowerCase();
            if (s) sources.add(s === 'osm_pbf' ? 'osm' : s);
        });
        return Array.from(sources);
    }, [fieldsConfig]);

    const [scrapers, setScrapers] = useState({});
    const [selectedMetrics, setSelectedMetrics] = useState([]);
    const [propertyUrls, setPropertyUrls] = useState({});

    // Ініціалізація станів при відкритті
    useEffect(() => {
        if (isOpen) {
            // Вмикаємо всі доступні скрапери за замовчуванням
            const initialScrapers = {};
            availableSources.forEach(s => { initialScrapers[s] = true; });
            setScrapers(initialScrapers);

            const urls = {};
            selectedDistricts.forEach(d => {
                urls[d.id] = generatePropertyLink(country?.name, city?.name, d.name, region);
            });
            setPropertyUrls(urls);
            
            if (allMetrics?.length > 0) {
                // Використовуємо .key замість .db
                setSelectedMetrics(allMetrics.map(m => m.key));
            }
        }
    }, [isOpen, availableSources, selectedDistricts, country, city, region, allMetrics]);

    const toggleMetric = (key) => setSelectedMetrics(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
    const toggleScraper = (key) => setScrapers(prev => ({ ...prev, [key]: !prev[key] }));

    const handleConfirm = () => {
        onConfirm({ 
            // Відправляємо прапорці тільки для тих джерел, які підтримує країна
            useOSM: scrapers.osm && countryConfig.features.hasOsm, 
            useWAQI: (scrapers.waqi || scrapers.api) && countryConfig.features.hasWaqi, 
            useOtodom: (scrapers.otodom || scrapers.scraper) && countryConfig.features.hasOtodom, 
            useGUS: scrapers.gus && countryConfig.features.hasGus,
            useOlx: scrapers.olx && countryConfig.features.hasOlx,
            useDerzhstat: scrapers.derzhstat && countryConfig.features.hasDerzhstat,
            selectedMetrics, 
            propertyUrls 
        });
    };

    if (!isOpen) return null;

    // Мапа назв для джерел (можна винести в переклади)
    const sourceLabels = {
        osm: "OSM (Інфрастр.)",
        waqi: "WAQI (Екологія)",
        api: "API / WAQI",
        gus: "GUS (Статистика)",
        otodom: "Otodom",
        scraper: "Скрапер (Нерухомість)",
        olx: "OLX / DOM.RIA",
        derzhstat: "Держстат"
    };

    const showUrlCheck = (countryConfig.features.hasOtodom && (scrapers.otodom || scrapers.scraper)) || (countryConfig.features.hasOlx && scrapers.olx);

    const modalActions = (
        <>
            <Button variant="cancel" onClick={onClose}>{t('metricsModal.cancel')}</Button>
            <Button variant="primary" onClick={handleConfirm}>{t('metricsModal.start')}</Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={t('metricsModal.title')} maxWidth="700px" actions={modalActions}>
            <div className="flex flex-col gap-8 p-2 sm:p-6">
                <div className="flex flex-col gap-4">
                    <h4 className="m-0 text-[1.1rem] text-textMain font-extrabold tracking-tight">{t('metricsModal.dataSource')}</h4>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                        {availableSources.map(source => {
                            // Перевіряємо чи підтримує поточна країна це джерело
                            const featureKey = source === 'api' ? 'hasWaqi' : 
                                               source === 'osm' ? 'hasOsm' : 
                                               source === 'gus' ? 'hasGus' : 
                                               source === 'scraper' ? 'hasOtodom' : null;
                            
                            if (featureKey && !countryConfig.features[featureKey]) return null;

                            return (
                                <CustomCheckbox 
                                    key={source}
                                    checked={!!scrapers[source]} 
                                    onChange={() => toggleScraper(source)} 
                                    label={sourceLabels[source] || source.toUpperCase()} 
                                />
                            );
                        })}
                    </div>
                </div>

                {countryConfig.features.hasOsm && scrapers.osm && (
                    <div className="flex flex-col gap-4">
                        <h4 className="m-0 text-[1.1rem] text-textMain font-extrabold tracking-tight">{t('metricsModal.selectMetrics')}</h4>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin p-1">
                            {allMetrics.map(m => (
                                <CustomCheckbox 
                                    key={m.key} 
                                    checked={selectedMetrics.includes(m.key)} 
                                    onChange={() => toggleMetric(m.key)} 
                                    label={t(`osmMetrics.${m.key}`, { defaultValue: m.label })} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {showUrlCheck && selectedDistricts.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h4 className="m-0 text-[1.1rem] text-textMain font-extrabold tracking-tight">{t('metricsModal.propertyUrlCheck')}</h4>
                        <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                            {selectedDistricts.map(d => {
                                const currentUrl = propertyUrls[d.id] || '';
                                const isValidUrl = currentUrl.startsWith('http');
                                return (
                                    <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-main p-3 rounded-xl border border-border shadow-sm">
                                        <span className="min-w-[120px] font-bold text-[0.95rem] text-textMain">{d.name}</span>
                                        <div className="flex flex-1 gap-2">
                                            <Input 
                                                type="text" 
                                                value={currentUrl} 
                                                onChange={(e) => setPropertyUrls(prev => ({...prev, [d.id]: e.target.value}))}
                                                placeholder="https://..."
                                                className="!py-2 !bg-surface"
                                            />
                                            <a 
                                                href={isValidUrl ? currentUrl : '#'} 
                                                target={isValidUrl ? "_blank" : "_self"} 
                                                rel="noopener noreferrer"
                                                className={`flex items-center justify-center px-4 rounded-md transition-all ${isValidUrl ? 'bg-blue-500/10 text-primary border border-blue-500/30 hover:bg-primary hover:text-white' : 'bg-surface text-textMuted border border-border opacity-60 cursor-not-allowed'}`}
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