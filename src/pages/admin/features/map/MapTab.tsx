// src/pages/admin/features/map/MapTab.tsx
import { useMemo } from 'react';
import { FaSyncAlt, FaTimes, FaLayerGroup, FaMapPin, FaDrawPolygon, FaCompass } from 'react-icons/fa';
import { CustomSelect, SelectOption } from '@admin/core/ui/CustomSelect';
import { useMapTab } from '@admin/features/map/useMapTab';
import { LeafletGeoViewer } from '@admin/core/ui/LeafletGeoViewer';
import { NormalizedPoiPoint } from '@admin/core/types/geo.types';

export default function MapTab() {
    const logic = useMapTab();

    const countryOptions: SelectOption[] = useMemo(() => [
        { value: '', label: logic.t('admin_map.tab.country') },
        ...logic.countries.map(c => ({ value: c, label: c }))
    ], [logic]);

    const cityOptions: SelectOption[] = useMemo(() => [
        { value: '', label: logic.t('admin_map.tab.city') },
        ...logic.cities.map(c => ({ value: c.id, label: c.name }))
    ], [logic]);

    const totalPoisCount = useMemo(() => {
        return logic.mapData.reduce((acc, dist) => acc + (dist.poi_data?.length || 0), 0);
    }, [logic.mapData]);

    // Витягуємо всі POI у єдиний плоский масив для універсального компонента
    const allPois = useMemo(() => {
        return logic.mapData.flatMap(dist => dist.poi_data || []) as NormalizedPoiPoint[];
    }, [logic.mapData]);

    return (
        <div className="flex flex-col w-full h-full relative bg-surface">
            {/* Панель керування */}
            <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-30 flex flex-col lg:flex-row gap-2.5 lg:items-center lg:justify-between pointer-events-none">
                
                {/* Вибір міста/країни */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-surface p-2 rounded-2xl border border-border shadow-md pointer-events-auto w-full lg:w-auto">
                    <div className="w-full sm:w-44">
                        <CustomSelect
                            options={countryOptions}
                            value={logic.selectedCountry}
                            onChange={(val) => { logic.setSelectedCountry(val as string); logic.setSelectedCity(''); }}
                            size="sm"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <CustomSelect
                            options={cityOptions}
                            value={logic.selectedCity}
                            onChange={(val) => logic.setSelectedCity(val as string)}
                            disabled={!logic.selectedCountry}
                            size="sm"
                        />
                    </div>
                </div>

                {/* Перемикач шарів та кнопки дій */}
                <div className="flex items-center justify-between sm:justify-end gap-2 bg-surface p-1.5 sm:p-2 rounded-2xl border border-border shadow-md pointer-events-auto self-end lg:self-auto w-full sm:w-auto">
                    <div className="flex bg-main p-0.5 sm:p-1 rounded-xl border border-border gap-0.5">
                        <button
                            type="button"
                            onClick={() => logic.setActiveLayer('polygons')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                logic.activeLayer === 'polygons' ? 'bg-surface text-primary border border-border shadow-2xs font-bold' : 'text-textMuted hover:text-textMain'
                            }`}
                            title={logic.t('admin_map.tab.layer_polygons')}
                        >
                            <FaDrawPolygon className="text-xs shrink-0" />
                            <span className="hidden sm:inline">{logic.t('admin_map.tab.layer_polygons')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => logic.setActiveLayer('markers')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                logic.activeLayer === 'markers' ? 'bg-surface text-primary border border-border shadow-2xs font-bold' : 'text-textMuted hover:text-textMain'
                            }`}
                            title={logic.t('admin_map.tab.layer_markers')}
                        >
                            <FaMapPin className="text-xs shrink-0" />
                            <span className="hidden sm:inline">{logic.t('admin_map.tab.layer_markers')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => logic.setActiveLayer('all')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                logic.activeLayer === 'all' ? 'bg-surface text-primary border border-border shadow-2xs font-bold' : 'text-textMuted hover:text-textMain'
                            }`}
                            title={logic.t('admin_map.tab.layer_all')}
                        >
                            <FaLayerGroup className="text-xs shrink-0" />
                            <span className="hidden sm:inline">{logic.t('admin_map.tab.layer_all')}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={logic.fetchMapData}
                            disabled={!logic.selectedCity || logic.loadingMap}
                            className="p-2 bg-surface border border-border text-textMuted rounded-xl hover:text-primary hover:border-primary/40 transition-colors shadow-2xs disabled:opacity-35 cursor-pointer"
                            title={logic.t('admin_map.tab.refresh')}
                        >
                            <FaSyncAlt className={`text-xs ${logic.loadingMap ? 'animate-spin text-primary' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={logic.resetFilters}
                            disabled={!logic.selectedCountry}
                            className="p-2 bg-surface border border-border text-textMuted rounded-xl hover:text-rose-600 hover:border-rose-500/40 transition-colors shadow-2xs disabled:opacity-35 cursor-pointer"
                            title={logic.t('common.reset')}
                        >
                            <FaTimes className="text-xs" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Статистика */}
            {Boolean(logic.selectedCity) && logic.mapData.length > 0 && (
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 flex items-center gap-2 bg-surface px-3.5 py-2 rounded-xl border border-border shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-textMain">{logic.mapData.length} {logic.t('admin_map.tab.districts_text')}</span>
                    <span className="text-border text-xs">•</span>
                    <span className="text-xs font-mono font-semibold text-textMuted">{totalPoisCount} POI</span>
                </div>
            )}

            {/* Карта */}
            <div className="w-full h-full relative">
                <LeafletGeoViewer
                    mapData={logic.mapData}
                    pois={allPois}
                    activeLayer={logic.activeLayer}
                    fieldsConfig={logic.fieldsConfig}
                    getLabelForKey={logic.getLabelForKey}
                />

                {!logic.selectedCity && !logic.loadingMap && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
                        <div className="flex flex-col items-center gap-3 text-center p-6 sm:p-7 border border-border rounded-3xl bg-surface shadow-xl max-w-xs sm:max-w-sm pointer-events-auto">
                            <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl border border-primary/20 flex items-center justify-center text-lg shadow-2xs">
                                <FaCompass />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-textMain tracking-tight m-0">
                                    {logic.t('admin_map.tab.empty_title')}
                                </h3>
                                <p className="text-xs text-textMuted m-0 mt-1 leading-relaxed font-medium">
                                    {logic.t('admin_map.tab.empty_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {logic.loadingMap && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20">
                        <div className="flex items-center gap-3 bg-surface px-4 py-2.5 rounded-2xl border border-border shadow-xl">
                            <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                            <span className="text-xs font-mono font-bold text-textMain">
                                {logic.t('admin_map.tab.loading')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}