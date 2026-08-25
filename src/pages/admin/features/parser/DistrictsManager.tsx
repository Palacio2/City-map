import { useState, useMemo } from 'react';
import { Button } from '@admin/core/ui/Button';
import { SearchInput } from '@admin/core/ui/SearchInput';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaPlus, FaTrash, FaCheckSquare, FaSquare, FaUpload } from 'react-icons/fa';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { DistrictManagerProps } from './types';

export default function DistrictsManager({
    foundDistricts = [], dbDistricts = [], selectedIds = [],
    onToggleSelect, onSelectAll, onScan, onCreate, onRemoveFromFound, onDeleteDbDistrict, onImportGeoJson, loading
}: DistrictManagerProps) {
    const { t } = useTranslation('db');
    const { canDo } = useActionGuard();
    const [searchTermFound, setSearchTermFound] = useState('');
    const [searchTermDb, setSearchTermDb] = useState('');
    const [fileUploadKey, setFileUploadKey] = useState(Date.now());

    const filteredFound = useMemo(() => {
        if (!searchTermFound.trim()) return foundDistricts;
        const lower = searchTermFound.toLowerCase();
        return foundDistricts.filter((d: string | { name: string; [key: string]: unknown }) => (typeof d === 'string' ? d : d.name).toLowerCase().includes(lower));
    }, [foundDistricts, searchTermFound]);

    const filteredDb = useMemo(() => {
        if (!searchTermDb.trim()) return dbDistricts;
        const lower = searchTermDb.toLowerCase();
        return dbDistricts.filter((d: { id: string; name: string; [key: string]: unknown }) => d.name.toLowerCase().includes(lower));
    }, [dbDistricts, searchTermDb]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportGeoJson(file);
            setFileUploadKey(Date.now());
        }
    };

    const allSelected = dbDistricts.length > 0 && selectedIds.length === dbDistricts.length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#d6ccbf] dark:divide-[#4a3f37] bg-surface rounded-b-2xl overflow-hidden">
            <div className="p-4 flex flex-col gap-3 bg-main/20">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h4 className="m-0 text-xs font-bold text-textMain flex items-center gap-1.5">
                            <span>{t('admin_parser.districts.found_osm')}</span>
                            <span className="bg-primary-subtle text-primary border border-primary/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                                {foundDistricts.length}
                            </span>
                        </h4>
                        <p className="text-[11px] text-textMuted m-0 mt-0.5 font-medium">
                            {t('admin_parser.districts.found_subtitle')}
                        </p>
                    </div>
                    {canDo('parser.scan_osm') && (
                        <Button variant="primary" size="sm" onClick={onScan} disabled={loading}>
                            {loading ? (
                                <FaSearch className="text-[10px] animate-spin" />
                            ) : (
                                <FaSearch className="text-[10px]" />
                            )}
                            {loading ? t('common.loading') : t('admin_parser.districts.scan_osm')}
                        </Button>
                    )}
                </div>
                <SearchInput value={searchTermFound} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTermFound(e.target.value)} placeholder={t('admin_parser.districts.search')} />
                <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto border border-[#d6ccbf] dark:border-[#4a3f37] rounded-xl bg-surface scrollbar-thin p-1">
                    {filteredFound.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                            {filteredFound.map((d: string | { name: string; [key: string]: unknown }, i: number) => {
                                const name = typeof d === 'string' ? d : d.name;
                                return (
                                    <div key={`found-${i}`} className="flex justify-between items-center px-3 py-1.5 hover:bg-hover rounded-lg group transition-colors text-xs text-textMain">
                                        <span className="font-semibold truncate">{name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            {canDo('parser.create_districts') && (
                                                <button
                                                    onClick={() => onCreate([d])}
                                                    disabled={loading}
                                                    className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded-md transition-colors"
                                                    title={t('admin_parser.districts.add_to_db')}
                                                >
                                                    <FaPlus className="text-[10px]" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onRemoveFromFound(d)}
                                                disabled={loading}
                                                className="p-1 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"
                                                title={t('admin_parser.districts.hide')}
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
                            {foundDistricts.length === 0 ? t('admin_parser.districts.scan_prompt') : t('admin_parser.districts.not_found')}
                        </div>
                    )}
                </div>
                {filteredFound.length > 0 && (
                    <Button variant="success" size="sm" onClick={() => onCreate(filteredFound)} disabled={loading} className="w-full">
                        <FaPlus className="text-xs" /> {t('admin_parser.districts.add_filtered')}
                    </Button>
                )}
            </div>

            <div className="p-4 flex flex-col gap-3 bg-surface">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h4 className="m-0 text-xs font-bold text-textMain flex items-center gap-1.5">
                            <span>{t('admin_parser.districts.in_db')}</span>
                            <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                                {dbDistricts.length}
                            </span>
                        </h4>
                        <p className="text-[11px] text-textMuted m-0 mt-0.5 font-medium">
                            {t('admin_parser.districts.db_subtitle')}
                        </p>
                    </div>
                    {canDo('parser.import_geojson') && (
                        <div className="flex gap-2">
                            <input type="file" accept=".geojson,application/geo+json" id="geojson-upload" className="hidden" onChange={handleFileUpload} key={fileUploadKey} />
                            <label
                                htmlFor="geojson-upload"
                                title={t('admin_parser.districts.import_geojson_tooltip')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d6ccbf] dark:border-[#4a3f37] text-xs font-semibold cursor-pointer transition-colors shadow-2xs ${
                                    loading
                                        ? 'bg-main text-textMuted pointer-events-none'
                                        : 'bg-surface text-textMain hover:bg-hover hover:border-primary/40'
                                }`}
                            >
                                <FaUpload className="text-[10px]" /> {t('admin_parser.districts.import_geojson')}
                            </label>
                        </div>
                    )}
                </div>
                <SearchInput value={searchTermDb} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTermDb(e.target.value)} placeholder={t('admin_parser.districts.search')} />
                <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto border border-[#d6ccbf] dark:border-[#4a3f37] rounded-xl bg-surface scrollbar-thin p-1">
                    <div className="px-3 py-1.5 border-b border-[#d6ccbf] dark:border-[#4a3f37] mb-1 sticky top-0 bg-surface/90 backdrop-blur-xs z-10">
                        <button
                            type="button"
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-xs font-bold text-textMain"
                            onClick={() => onSelectAll(!allSelected)}
                        >
                            <span className={allSelected ? 'text-primary' : 'text-textMuted'}>
                                {allSelected ? <FaCheckSquare className="text-xs" /> : <FaSquare className="text-xs" />}
                            </span>
                            <span>{t('admin_parser.districts.select_all')}</span>
                        </button>
                    </div>
                    {filteredDb.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                            {filteredDb.map((d: { id: string; name: string; [key: string]: unknown }) => {
                                const isSelected = selectedIds.includes(d.id);
                                return (
                                    <div
                                        key={d.id}
                                        className={`flex justify-between items-center px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs group ${
                                            isSelected ? 'bg-primary-subtle font-semibold text-primary' : 'hover:bg-hover text-textMain'
                                        }`}
                                        onClick={() => onToggleSelect(d.id)}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className={isSelected ? 'text-primary' : 'text-textMuted'}>
                                                {isSelected ? <FaCheckSquare className="text-xs" /> : <FaSquare className="text-xs" />}
                                            </span>
                                            <span className="truncate">{d.name}</span>
                                        </div>
                                        {canDo('parser.delete_districts') && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteDbDistrict(d.id); }}
                                                disabled={loading}
                                                className="p-1 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                                title={t('admin_parser.districts.delete_permanent')}
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
                            {dbDistricts.length === 0 ? t('admin_parser.districts.empty_db') : t('admin_parser.districts.not_found')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}