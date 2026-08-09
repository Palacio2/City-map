import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { generatePropertyLink } from '../../utils/countryHelpers';
import { getCountryConfig } from '../../config/countryConfig';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { FaExternalLinkAlt, FaCheck, FaPlay } from 'react-icons/fa';

const CustomCheckbox = ({ checked, onChange, label }: any) => (
    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors select-none ${
        checked 
            ? 'bg-primary-subtle border-primary/30 text-primary font-medium shadow-2xs' 
            : 'bg-surface border-border hover:bg-hover text-textMain'
    }`}>
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={onChange} 
            className="accent-primary w-3.5 h-3.5 rounded cursor-pointer" 
        />
        <span className="truncate">{label}</span>
    </label>
);

export default function ParserParameters({ onConfirm, onStart, selectedDistricts, country, city, region }: any) {
    const { t } = useTranslation('db');
    const { fieldsConfig = [] } = useDynamicFields();
    const countryConfig = useMemo(() => getCountryConfig(country?.name), [country]);

    const allMetrics = useMemo(() => {
        return fieldsConfig.filter((f: any) => f.is_osm);
    }, [fieldsConfig]);

    const availableSources = useMemo(() => {
        const sources = new Set<string>();
        fieldsConfig.forEach((f: any) => {
            const s = (f.parser_config?.source || f.source_type || '').toLowerCase();
            if (s) sources.add(s === 'osm_pbf' ? 'osm' : s);
        });
        return Array.from(sources);
    }, [fieldsConfig]);

    const [scrapers, setScrapers] = useState<Record<string, boolean>>({});
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
    const [propertyUrls, setPropertyUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialScrapers: Record<string, boolean> = {};
        availableSources.forEach(s => { initialScrapers[s] = true; });
        setScrapers(initialScrapers);

        const urls: Record<string, string> = {};
        selectedDistricts.forEach((d: any) => {
            urls[d.id] = generatePropertyLink(country?.name, city?.name, d.name, region);
        });
        setPropertyUrls(urls);

        if (allMetrics?.length > 0) {
            setSelectedMetrics(allMetrics.map((m: any) => m.key));
        }
    }, [availableSources, selectedDistricts, country, city, region, allMetrics]);

    const toggleMetric = (key: string) => setSelectedMetrics(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
    const toggleScraper = (key: string) => setScrapers(prev => ({ ...prev, [key]: !prev[key] }));

    const getConfig = () => ({
        useOSM: scrapers.osm && countryConfig.features.hasOsm,
        useWAQI: (scrapers.waqi || scrapers.api) && countryConfig.features.hasWaqi,
        useOtodom: (scrapers.otodom || scrapers.scraper) && countryConfig.features.hasOtodom,
        useGUS: scrapers.gus && countryConfig.features.hasGus,
        useOlx: scrapers.olx && countryConfig.features.hasOlx,
        useDerzhstat: scrapers.derzhstat && countryConfig.features.hasDerzhstat,
        selectedMetrics,
        propertyUrls
    });

    const handleConfirm = () => {
        onConfirm(getConfig());
    };

    const handleStart = () => {
        onStart(getConfig());
    };

    const sourceLabels: Record<string, string> = {
        osm: t('admin_parser.sources.osm'),
        waqi: t('admin_parser.sources.waqi'),
        api: t('admin_parser.sources.api'),
        gus: t('admin_parser.sources.gus'),
        otodom: "Otodom.pl",
        scraper: t('admin_parser.sources.scraper'),
        olx: "OLX / DOM.RIA",
        derzhstat: t('admin_parser.sources.derzhstat')
    };

    const showUrlCheck = (countryConfig.features.hasOtodom && (scrapers.otodom || scrapers.scraper)) || (countryConfig.features.hasOlx && scrapers.olx);

    return (
        <div className="flex flex-col gap-5 p-4 bg-surface rounded-b-xl">
            <div className="flex flex-col gap-2">
                <h4 className="m-0 text-xs font-semibold text-textMain">
                    {t('admin_parser.metrics_modal.sources_title')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSources.map(source => {
                        const featureKey = source === 'api' ? 'hasWaqi' :
                                           source === 'osm' ? 'hasOsm' :
                                           source === 'gus' ? 'hasGus' :
                                           source === 'scraper' ? 'hasOtodom' : null;
                        if (featureKey && !(countryConfig.features as any)[featureKey]) return null;
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
                <div className="flex flex-col gap-2">
                    <h4 className="m-0 text-xs font-semibold text-textMain">
                        {t('admin_parser.metrics_modal.metrics_title')}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {allMetrics.map((m: any) => (
                            <CustomCheckbox
                                key={m.key}
                                checked={selectedMetrics.includes(m.key)}
                                onChange={() => toggleMetric(m.key)}
                                label={m.label}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showUrlCheck && selectedDistricts.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h4 className="m-0 text-xs font-semibold text-textMain">
                        {t('admin_parser.metrics_modal.otodom_title')}
                    </h4>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {selectedDistricts.map((d: any) => {
                            const currentUrl = propertyUrls[d.id] || '';
                            const isValidUrl = currentUrl.startsWith('http');
                            return (
                                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-main rounded-lg border border-border">
                                    <span className="w-32 truncate font-medium text-xs text-textMain">{d.name}</span>
                                    <div className="flex flex-1 gap-2">
                                        <Input
                                            type="text"
                                            value={currentUrl}
                                            onChange={(e: any) => setPropertyUrls(prev => ({...prev, [d.id]: e.target.value}))}
                                            placeholder="https://..."
                                            className="h-8 text-xs bg-surface font-mono"
                                        />
                                        <a
                                            href={isValidUrl ? currentUrl : '#'}
                                            target={isValidUrl ? "_blank" : "_self"}
                                            rel="noopener noreferrer"
                                            className={`p-2 rounded border flex items-center justify-center transition-colors ${
                                                isValidUrl 
                                                    ? 'bg-primary-subtle text-primary border-primary/20 hover:bg-primary hover:text-white' 
                                                    : 'bg-surface text-textMuted border-border opacity-50 cursor-not-allowed'
                                            }`}
                                            onClick={(e) => !isValidUrl && e.preventDefault()}
                                        >
                                            <FaExternalLinkAlt className="text-xs" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <Button variant="cancel" size="sm" onClick={handleConfirm}>
                    <FaCheck className="text-xs" /> {t('common.save')}
                </Button>
                <Button variant="success" size="sm" onClick={handleStart}>
                    <FaPlay className="text-xs" /> {t('admin_parser.metrics_modal.start')}
                </Button>
            </div>
        </div>
    );
}