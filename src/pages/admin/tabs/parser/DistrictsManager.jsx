import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { SearchInput } from '../../ui/SearchInput';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaPlus, FaTrash, FaCheckSquare, FaSquare, FaUpload } from 'react-icons/fa';

const DistrictsManager = ({ 
    foundDistricts = [], dbDistricts = [], selectedIds = [], 
    onToggleSelect, onSelectAll, onScan, onCreate, onRemoveFromFound, 
    onDeleteDbDistrict, onImportGeoJson, loading, isSuperAdmin 
}) => {
    const { t } = useTranslation('db');
    const [searchTermFound, setSearchTermFound] = useState('');
    const [searchTermDb, setSearchTermDb] = useState('');
    const [fileUploadKey, setFileUploadKey] = useState(Date.now());

    const filteredFound = useMemo(() => {
        if (!searchTermFound.trim()) return foundDistricts;
        const lower = searchTermFound.toLowerCase();
        return foundDistricts.filter(d => (typeof d === 'string' ? d : d.name).toLowerCase().includes(lower));
    }, [foundDistricts, searchTermFound]);

    const filteredDb = useMemo(() => {
        if (!searchTermDb.trim()) return dbDistricts;
        const lower = searchTermDb.toLowerCase();
        return dbDistricts.filter(d => d.name.toLowerCase().includes(lower));
    }, [dbDistricts, searchTermDb]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            onImportGeoJson(file);
            setFileUploadKey(Date.now());
        }
    };

    const allSelected = dbDistricts.length > 0 && selectedIds.length === dbDistricts.length;

    return (
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border bg-surface">
            <div className="flex-1 p-6 flex flex-col gap-5 bg-main/30">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h4 className="m-0 text-[1.05rem] font-extrabold text-textMain flex items-center gap-2">
                            {t('admin_parser.districts.found_osm')}
                            <span className="bg-blue-500/10 border border-blue-500/20 text-primary py-0.5 px-2 rounded-md text-[0.8rem]">{foundDistricts.length}</span>
                        </h4>
                        <p className="text-[0.85rem] text-textMuted m-0 mt-1">{t('admin_parser.districts.found_subtitle')}</p>
                    </div>
                    <Button variant="primary" onClick={onScan} disabled={loading} className="!py-2 !px-4 !text-[0.85rem] shadow-sm">
                        <FaSearch /> {t('admin_parser.districts.scan_osm')}
                    </Button>
                </div>

                <SearchInput value={searchTermFound} onChange={e => setSearchTermFound(e.target.value)} placeholder={t('admin_parser.districts.search')} className="!bg-surface shadow-sm"/>

                <div className="flex-1 min-h-[250px] max-h-[400px] overflow-y-auto border border-border rounded-xl bg-surface shadow-inner scrollbar-thin p-1">
                    {filteredFound.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {filteredFound.map((d, i) => {
                                const name = typeof d === 'string' ? d : d.name;
                                return (
                                    <div key={`found-${i}`} className="flex justify-between items-center p-2.5 px-4 hover:bg-hover rounded-lg group transition-colors border border-transparent hover:border-border">
                                        <span className="text-[0.9rem] font-bold text-textMain">{name}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onCreate([d])} disabled={loading} className="w-7 h-7 bg-emerald-500/10 text-success rounded-md border border-emerald-500/20 flex items-center justify-center hover:bg-success hover:text-white cursor-pointer transition-colors" title={t('admin_parser.districts.add_to_db')}>
                                                <FaPlus size={12} />
                                            </button>
                                            <button onClick={() => onRemoveFromFound(d)} disabled={loading} className="w-7 h-7 bg-surface text-textMuted rounded-md border border-border flex items-center justify-center hover:bg-red-500/10 hover:text-danger hover:border-red-500/20 cursor-pointer transition-colors" title={t('admin_parser.districts.hide')}>
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-textMuted text-[0.95rem] font-bold p-4 text-center">
                            {foundDistricts.length === 0 ? t('admin_parser.districts.scan_prompt') : t('admin_parser.districts.not_found')}
                        </div>
                    )}
                </div>

                {filteredFound.length > 0 && (
                    <Button variant="success" onClick={() => onCreate(filteredFound)} disabled={loading} className="w-full shadow-sm">
                        <FaPlus /> {t('admin_parser.districts.add_filtered')}
                    </Button>
                )}
            </div>

            <div className="flex-1 p-6 flex flex-col gap-5 bg-surface">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h4 className="m-0 text-[1.05rem] font-extrabold text-textMain flex items-center gap-2">
                            {t('admin_parser.districts.in_db')}
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-success py-0.5 px-2 rounded-md text-[0.8rem]">{dbDistricts.length}</span>
                        </h4>
                        <p className="text-[0.85rem] text-textMuted m-0 mt-1">{t('admin_parser.districts.db_subtitle')}</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <input type="file" accept=".geojson,application/geo+json" id="geojson-upload" className="hidden" onChange={handleFileUpload} key={fileUploadKey} />
                        <label htmlFor="geojson-upload" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[0.85rem] font-bold cursor-pointer transition-all border shadow-sm ${loading ? 'bg-main text-textMuted border-border pointer-events-none' : 'bg-surface text-textMain border-border hover:bg-main hover:text-primary hover:border-primary/30'}`}>
                            <FaUpload /> {t('admin_parser.districts.import_geojson')}
                        </label>
                    </div>
                </div>

                <SearchInput value={searchTermDb} onChange={e => setSearchTermDb(e.target.value)} placeholder={t('admin_parser.districts.search')} className="shadow-sm" />

                <div className="flex-1 min-h-[250px] max-h-[400px] overflow-y-auto border border-border rounded-xl bg-main/50 shadow-inner scrollbar-thin p-1">
                    <div className="p-2 border-b border-border mb-1 sticky top-0 bg-main/90 backdrop-blur-sm z-10">
                        <div 
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-border"
                            onClick={() => onSelectAll(!allSelected)}
                        >
                            <span className={`text-[1.1rem] transition-colors ${allSelected ? 'text-primary' : 'text-textMuted'}`}>
                                {allSelected ? <FaCheckSquare /> : <FaSquare />}
                            </span>
                            <span className="font-extrabold text-[0.9rem] text-textMain select-none">{t('admin_parser.districts.select_all')}</span>
                        </div>
                    </div>

                    {filteredDb.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {filteredDb.map((d) => {
                                const isSelected = selectedIds.includes(d.id);
                                return (
                                    <div 
                                        key={d.id} 
                                        className={`flex justify-between items-center p-2.5 px-4 rounded-lg cursor-pointer transition-all border-2 group ${isSelected ? 'bg-blue-500/5 border-primary shadow-sm' : 'border-transparent hover:bg-surface hover:border-border'}`}
                                        onClick={() => onToggleSelect(d.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[1.1rem] transition-colors ${isSelected ? 'text-primary' : 'text-textMuted opacity-50 group-hover:opacity-100'}`}>
                                                {isSelected ? <FaCheckSquare /> : <FaSquare />}
                                            </span>
                                            <span className={`text-[0.9rem] ${isSelected ? 'font-extrabold text-primary' : 'font-bold text-textMain'}`}>{d.name}</span>
                                        </div>
                                        {isSuperAdmin && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteDbDistrict(d.id); }} 
                                                disabled={loading} 
                                                className="w-7 h-7 bg-surface text-textMuted rounded-md border border-border flex items-center justify-center hover:bg-red-500/10 hover:text-danger hover:border-red-500/20 cursor-pointer transition-colors opacity-0 group-hover:opacity-100" 
                                                title={t('admin_parser.districts.delete_permanent')}
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-20 text-textMuted text-[0.95rem] font-bold p-4 text-center">
                            {dbDistricts.length === 0 ? t('admin_parser.districts.empty_db') : t('admin_parser.districts.not_found')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(DistrictsManager);