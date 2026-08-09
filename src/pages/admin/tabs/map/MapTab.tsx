import { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkedAlt, FaSyncAlt, FaTimes } from 'react-icons/fa';
import { MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';
import { CustomSelect, SelectOption } from '../../ui/CustomSelect';
import { useMapTab } from '../../hooks/useMapTab';

export default function MapTab() {
    const logic = useMapTab();

    const countryOptions: SelectOption[] = useMemo(() => [
        { value: '', label: logic.t('admin_map.tab.country') },
        ...logic.countries.map(c => ({ value: c, label: c }))
    ], [logic.countries, logic.t]);

    const cityOptions: SelectOption[] = useMemo(() => [
        { value: '', label: logic.t('admin_map.tab.city') },
        ...logic.cities.map(c => ({ value: c.id, label: c.name }))
    ], [logic.cities, logic.t]);

    const markersList = useMemo(() => {
        if (logic.activeLayer !== 'markers' && logic.activeLayer !== 'all') return [];
        return logic.mapData.flatMap(dist => (dist.poi_data || []).map((poi: any, idx: number) => {
            if (!poi || poi.length < 3) return null;
            return (
                <Marker key={`${dist.id}-${idx}`} position={[poi[0], poi[1]]} icon={createEmojiIcon(poi[2], poi[3], logic.fieldsConfig)}>
                    <Tooltip direction="top" className="modern-tooltip">
                        <div className="text-center">
                            <span className="font-semibold text-xs text-textMain">{logic.getLabelForKey(poi[2])}</span>
                            <span className="text-[10px] text-textMuted font-normal block">{dist.name}</span>
                        </div>
                    </Tooltip>
                </Marker>
            );
        }).filter(Boolean));
    }, [logic.mapData, logic.activeLayer, logic.fieldsConfig, logic.getLabelForKey]);

    return (
        <div className="flex flex-col w-full h-[calc(100vh-100px)] relative rounded-xl overflow-hidden border border-border shadow-subtle">
            
            <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap gap-2.5 items-center justify-between bg-surface/95 backdrop-blur-md p-3 rounded-xl shadow-md border border-border">
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <div className="w-full sm:w-48">
                        <CustomSelect
                            options={countryOptions}
                            value={logic.selectedCountry}
                            onChange={(val) => { logic.setSelectedCountry(val); logic.setSelectedCity(''); }}
                            size="sm"
                        />
                    </div>
                    <div className="w-full sm:w-52">
                        <CustomSelect
                            options={cityOptions}
                            value={logic.selectedCity}
                            onChange={(val) => logic.setSelectedCity(val)}
                            disabled={!logic.selectedCountry}
                            size="sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="flex bg-main rounded-lg p-0.5 border border-border">
                        {(['polygons', 'markers', 'all'] as const).map(layer => (
                            <button
                                key={layer}
                                onClick={() => logic.setActiveLayer(layer)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    logic.activeLayer === layer 
                                        ? 'bg-primary text-white shadow-subtle' 
                                        : 'text-textMuted hover:text-textMain'
                                }`}
                            >
                                {layer === 'polygons' && logic.t('admin_map.tab.layer_polygons')}
                                {layer === 'markers' && logic.t('admin_map.tab.layer_markers', 'Об\'єкти')}
                                {layer === 'all' && logic.t('admin_map.tab.layer_all')}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={logic.fetchMapData}
                        disabled={!logic.selectedCity || logic.loadingMap}
                        className="p-1.5 bg-surface border border-border text-textMuted rounded-lg hover:text-textMain hover:border-primary/30 transition-colors disabled:opacity-50"
                        title={logic.t('admin_map.tab.refresh')}
                    >
                        <FaSyncAlt className={`text-xs ${logic.loadingMap ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={logic.resetFilters}
                        disabled={!logic.selectedCountry}
                        className="p-1.5 bg-surface border border-border text-textMuted rounded-lg hover:text-danger hover:border-danger/30 transition-colors disabled:opacity-50"
                        title={logic.t('common.reset')}
                    >
                        <FaTimes className="text-xs" />
                    </button>
                </div>
            </div>

            
            <div className="w-full h-full bg-main relative">
                <MapContainer center={[52.23, 21.01]} zoom={6} className="w-full h-full z-10" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {logic.mapData.map(dist => {
                        const isVisible = logic.activeLayer === 'polygons' || logic.activeLayer === 'all';
                        return (
                            <GeoJSON 
                                key={dist.id} 
                                data={dist.geojson} 
                                style={{ 
                                    color: dist.fillColor, 
                                    weight: isVisible ? 1.5 : 0, 
                                    fillOpacity: isVisible ? 0.15 : 0, 
                                    fillColor: dist.fillColor,
                                    opacity: isVisible ? 1 : 0
                                }}
                            >
                                {isVisible && (
                                    <Tooltip direction="top" sticky className="modern-tooltip">
                                        <span className="font-semibold text-xs text-textMain px-1">{dist.name}</span>
                                    </Tooltip>
                                )}
                            </GeoJSON>
                        );
                    })}
                    <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} showCoverageOnHover={false}>
                        {markersList}
                    </MarkerClusterGroup>
                    <MapFitBounds mapData={logic.mapData} />
                </MapContainer>

                {!logic.selectedCity && !logic.loadingMap && (
                    <div className="absolute inset-0 z-[400] flex items-center justify-center bg-surface/70 backdrop-blur-md">
                        <div className="flex flex-col items-center gap-3 text-center p-6 border border-border rounded-xl bg-surface shadow-2xl max-w-sm">
                            <div className="w-10 h-10 bg-primary-subtle text-primary rounded-lg border border-primary/20 flex items-center justify-center text-lg">
                                <FaMapMarkedAlt />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-textMain m-0">{logic.t('admin_map.tab.empty_title')}</h3>
                                <p className="text-xs text-textMuted m-0 mt-1 leading-relaxed">
                                    {logic.t('admin_map.tab.empty_desc', 'Оберіть країну та місто у верхній панелі для відображення геометрії та об\'єктів інфраструктури')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {logic.loadingMap && (
                    <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-surface/70 backdrop-blur-md">
                        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin mb-2" />
                        <span className="text-xs font-medium text-textMain bg-surface px-3 py-1 rounded-lg border border-border shadow-subtle">
                            {logic.t('admin_map.tab.loading')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}