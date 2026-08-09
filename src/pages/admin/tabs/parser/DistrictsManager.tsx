import { useState, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { SearchInput } from '../../ui/SearchInput';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaPlus, FaTrash, FaCheckSquare, FaSquare, FaUpload } from 'react-icons/fa';

export default function DistrictsManager({
    foundDistricts = [], dbDistricts = [], selectedIds = [],
    onToggleSelect, onSelectAll, onScan, onCreate, onRemoveFromFound,
    onDeleteDbDistrict, onImportGeoJson, loading, isSuperAdmin
}: any) {
    const { t } = useTranslation('db');
    const [searchTermFound, setSearchTermFound] = useState('');
    const [searchTermDb, setSearchTermDb] = useState('');
    const [fileUploadKey, setFileUploadKey] = useState(Date.now());

    const filteredFound = useMemo(() => {
        if (!searchTermFound.trim()) return foundDistricts;
        const lower = searchTermFound.toLowerCase();
        return foundDistricts.filter((d: any) => (typeof d === 'string' ? d : d.name).toLowerCase().includes(lower));
    }, [foundDistricts, searchTermFound]);

    const filteredDb = useMemo(() => {
        if (!searchTermDb.trim()) return dbDistricts;
        const lower = searchTermDb.toLowerCase();
        return dbDistricts.filter((d: any) => d.name.toLowerCase().includes(lower));
    }, [dbDistricts, searchTermDb]);

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            onImportGeoJson(file);
            setFileUploadKey(Date.now());
        }
    };

    const allSelected = dbDistricts.length > 0 && selectedIds.length === dbDistricts.length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border bg-surface rounded-b-xl overflow-hidden">
            {/* Ліва колонка: Знанайдені в OSM */}
            <div className="p-4 flex flex-col gap-3 bg-main/20">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h4 className="m-0 text-xs font-semibold text-textMain flex items-center gap-1.5">
                            <span>{t('admin_parser.districts.found_osm', 'Знайдено в OSM')}</span>
                            <span className="bg-primary-subtle text-primary border border-primary/20 text-[10px] font-mono px-1.5 py-0.5 rounded">
                                {foundDistricts.length}
                            </span>
                        </h4>
                        <p className="text-[11px] text-textMuted m-0 mt-0.5">
                            {t('admin_parser.districts.found_subtitle', 'Результати автоматичного сканування')}
                        </p>
                    </div>

                    <Button variant="primary" size="sm" onClick={onScan} disabled={loading}>
                        <FaSearch className="text-[10px]" /> {t('admin_parser.districts.scan_osm', 'Сканувати OSM')}
                    </Button>
                </div>

                <SearchInput value={searchTermFound} onChange={(e: any) => setSearchTermFound(e.target.value)} placeholder={t('admin_parser.districts.search', 'Пошук...')} />

                <div className="flex-1 min-h-[220px] max-h-[320px] overflow-y-auto border border-border rounded-lg bg-surface scrollbar-thin p-1">
                    {filteredFound.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                            {filteredFound.map((d: any, i: number) => {
                                const name = typeof d === 'string' ? d : d.name;
                                return (
                                    <div key={`found-${i}`} className="flex justify-between items-center px-3 py-1.5 hover:bg-hover rounded-md group transition-colors text-xs text-textMain">
                                        <span className="font-medium truncate">{name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => onCreate([d])}
                                                disabled={loading}
                                                className="p-1 text-success hover:bg-success-subtle rounded transition-colors"
                                                title={t('admin_parser.districts.add_to_db', 'Додати в БД')}
                                            >
                                                <FaPlus className="text-[10px]" />
                                            </button>
                                            <button
                                                onClick={() => onRemoveFromFound(d)}
                                                disabled={loading}
                                                className="p-1 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
                                                title={t('admin_parser.districts.hide', 'Сховати')}
                                            >
                                                <FaTrash className="text-[10px]" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-textMuted text-xs italic p-4 text-center">
                            {foundDistricts.length === 0 ? t('admin_parser.districts.scan_prompt', 'Натисніть сканувати для пошуку') : t('admin_parser.districts.not_found', 'Нічого не знайдено')}
                        </div>
                    )}
                </div>

                {filteredFound.length > 0 && (
                    <Button variant="success" size="sm" onClick={() => onCreate(filteredFound)} disabled={loading} className="w-full">
                        <FaPlus className="text-xs" /> {t('admin_parser.districts.add_filtered', 'Додати всі знайдені')}
                    </Button>
                )}
            </div>

            {/* Права колонка: Райони в базі даних */}
            <div className="p-4 flex flex-col gap-3 bg-surface">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h4 className="m-0 text-xs font-semibold text-textMain flex items-center gap-1.5">
                            <span>{t('admin_parser.districts.in_db', 'Райони в БД')}</span>
                            <span className="bg-success-subtle text-success border border-success/20 text-[10px] font-mono px-1.5 py-0.5 rounded">
                                {dbDistricts.length}
                            </span>
                        </h4>
                        <p className="text-[11px] text-textMuted m-0 mt-0.5">
                            {t('admin_parser.districts.db_subtitle', 'Обрані райони для поточного міста')}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <input type="file" accept=".geojson,application/geo+json" id="geojson-upload" className="hidden" onChange={handleFileUpload} key={fileUploadKey} />
                        <label
                            htmlFor="geojson-upload"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                loading 
                                    ? 'bg-main text-textMuted border-border pointer-events-none' 
                                    : 'bg-surface border-border text-textMain hover:bg-hover hover:border-primary/30'
                            }`}
                        >
                            <FaUpload className="text-[10px]" /> {t('admin_parser.districts.import_geojson', 'Імпорт GeoJSON')}
                        </label>
                    </div>
                </div>

                <SearchInput value={searchTermDb} onChange={(e: any) => setSearchTermDb(e.target.value)} placeholder={t('admin_parser.districts.search', 'Пошук...')} />

                <div className="flex-1 min-h-[220px] max-h-[320px] overflow-y-auto border border-border rounded-lg bg-surface scrollbar-thin p-1">
                    <div className="px-3 py-1.5 border-b border-border mb-1 sticky top-0 bg-surface/90 backdrop-blur-xs z-10">
                        <button
                            type="button"
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-xs font-semibold text-textMain"
                            onClick={() => onSelectAll(!allSelected)}
                        >
                            <span className={allSelected ? 'text-primary' : 'text-textMuted'}>
                                {allSelected ? <FaCheckSquare className="text-xs" /> : <FaSquare className="text-xs" />}
                            </span>
                            <span>{t('admin_parser.districts.select_all', 'Вибрати всі')}</span>
                        </button>
                    </div>

                    {filteredDb.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                            {filteredDb.map((d: any) => {
                                const isSelected = selectedIds.includes(d.id);
                                return (
                                    <div
                                        key={d.id}
                                        className={`flex justify-between items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors text-xs group ${
                                            isSelected ? 'bg-primary-subtle font-medium text-primary' : 'hover:bg-hover text-textMain'
                                        }`}
                                        onClick={() => onToggleSelect(d.id)}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className={isSelected ? 'text-primary' : 'text-textMuted'}>
                                                {isSelected ? <FaCheckSquare className="text-xs" /> : <FaSquare className="text-xs" />}
                                            </span>
                                            <span className="truncate">{d.name}</span>
                                        </div>

                                        {isSuperAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteDbDistrict(d.id); }}
                                                disabled={loading}
                                                className="p-1 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                                title={t('admin_parser.districts.delete_permanent', 'Видалити з БД')}
                                            >
                                                <FaTrash className="text-[10px]" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-20 text-textMuted text-xs italic p-4 text-center">
                            {dbDistricts.length === 0 ? t('admin_parser.districts.empty_db', 'База містить 0 районів') : t('admin_parser.districts.not_found', 'Нічого не знайдено')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}