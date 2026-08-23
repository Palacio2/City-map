import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { adminGeoApi } from '@admin/core/api/adminGeoApi';
import BaseModal from '@admin/core/ui/BaseModal';
import { useDynamicFields } from '@admin/core/hooks/useDynamicFields';
import { assignColorsToFeatures, parseAndFixGeoJSON } from '@admin/core/utils/mapHelpers';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { LeafletGeoViewer } from '@admin/core/ui/LeafletGeoViewer';
import { GeoFeatureData, NormalizedPoiPoint } from '@admin/core/types/geo.types';
import { FormattedFieldItem } from '@admin/core/types/ui.types';

interface CityMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    city: { id: string; name: string; [key: string]: unknown } | null;
}

export default function CityMapModal({ isOpen, onClose, city }: CityMapModalProps) {
    const { t } = useTranslation('db');
    const { fieldsConfig } = useDynamicFields();
    const [mapData, setMapData] = useState<GeoFeatureData[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeLayer, setActiveLayer] = useState<'polygons' | 'markers' | 'all'>('polygons');
    
    const getLabelForKey = useCallback((key: string) => {
        return fieldsConfig?.find((f: FormattedFieldItem) => f.key === key || f.key === `${key}_count`)?.label || key;
    }, [fieldsConfig]);
    
    useEffect(() => {
        if (!isOpen || !city) return;
        setActiveLayer('polygons');
        
        const loadData = async () => {
            setLoading(true);
            try {
                const res = await adminGeoApi.getMapData(city.id) as { data?: GeoFeatureData[] } | GeoFeatureData[];
                const dataArray = Array.isArray(res) ? res : (res?.data || []);
                const validData = dataArray.map(parseAndFixGeoJSON).filter(Boolean) as GeoFeatureData[];
                setMapData(assignColorsToFeatures(validData));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [city, isOpen]);
    
    const allPois = useMemo(() => {
        return mapData.flatMap(dist => dist.poi_data || []) as NormalizedPoiPoint[];
    }, [mapData]);
    
    const titleContent = (
        <div className="flex items-center gap-2">
            <FaMapMarkedAlt className="text-primary text-sm" />
            <span className="text-sm font-bold text-textMain">{city?.name} — {t('admin_map.tab.overview')}</span>
        </div>
    );
    
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={titleContent} maxWidth="85vw" noPadding>
            <div className="h-[80vh] w-full relative bg-main overflow-hidden">
                {!loading && mapData.length > 0 && (
                    <div className="absolute top-3 right-3 z-[400] flex bg-surface/95 backdrop-blur-md p-1 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-md">
                        {(['polygons', 'markers', 'all'] as const).map(layer => (
                            <button
                                key={layer}
                                onClick={() => setActiveLayer(layer)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    activeLayer === layer ? 'bg-primary text-white shadow-xs' : 'text-textMuted hover:text-textMain'
                                }`}
                            >
                                {layer === 'polygons' && t('admin_map.tab.layer_polygons')}
                                {layer === 'markers' && t('admin_map.tab.layer_markers')}
                                {layer === 'all' && t('admin_map.tab.layer_all')}
                            </button>
                        ))}
                    </div>
                )}
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-50 backdrop-blur-xs">
                        <div className="flex items-center gap-2.5 text-textMuted text-xs font-bold">
                            <div className="w-6 h-6 border-3 border-border border-t-primary rounded-full animate-spin" />
                            <span>{t('admin_map.tab.loading')}</span>
                        </div>
                    </div>
                ) : (
                    <LeafletGeoViewer
                        mapData={mapData}
                        pois={allPois}
                        activeLayer={activeLayer}
                        fieldsConfig={fieldsConfig}
                        getLabelForKey={getLabelForKey}
                    />
                )}
            </div>
        </BaseModal>
    );
}