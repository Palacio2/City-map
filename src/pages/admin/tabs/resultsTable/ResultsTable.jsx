import React, { useMemo } from 'react';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaMapMarkedAlt, FaSpinner } from 'react-icons/fa';
import { Button } from '../../ui/Button';
import { useTranslation } from 'react-i18next';

const ResultsTable = React.memo(({ districts, onEdit, onDelete, onToggleStatus, isLoading, fieldsConfig = [] }) => {
    const { t } = useTranslation('db');

    const tableColumns = useMemo(() => {
        return fieldsConfig
            .filter(f => f.is_visible_table)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [fieldsConfig]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[250px] text-textMuted gap-4">
                <FaSpinner className="animate-spin text-[2rem] text-primary" />
                <span className="text-[0.95rem] font-bold tracking-wide">{t('admin_parser.table.loading')}</span>
            </div>
        );
    }

    if (!districts.length) {
        return (
            <div className="flex items-center justify-center h-[200px] text-textMuted font-bold text-[1rem] bg-surface rounded-xl border border-dashed border-border/70">
                {t('admin_parser.table.not_found')}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="w-full min-w-[1000px] border-collapse bg-surface text-[0.85rem]">
                <thead className="bg-main/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
                    <tr>
                        <th className="py-3 px-4 text-left font-extrabold text-textMuted w-[60px] uppercase text-[0.7rem] tracking-widest">{t('admin_parser.table.status')}</th>
                        <th className="py-3 px-4 text-left font-extrabold text-textMuted min-w-[180px] uppercase text-[0.7rem] tracking-widest">{t('admin_parser.table.name')}</th>
                        <th className="py-3 px-4 text-center font-extrabold text-textMuted w-[70px] uppercase text-[0.7rem] tracking-widest">{t('admin_parser.table.geo')}</th>
                        
                        {tableColumns.map(col => (
                            <th key={col.key} className="py-3 px-3 text-left font-extrabold text-textMuted whitespace-nowrap uppercase text-[0.7rem] tracking-widest">
                                {col.icon && <span className="mr-1.5 opacity-80 text-[0.9rem]">{col.icon}</span>}
                                {col.label}
                            </th>
                        ))}
                        
                        <th className="py-3 px-4 text-right font-extrabold text-textMuted w-[100px] uppercase text-[0.7rem] tracking-widest">{t('admin_parser.table.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {districts.map((district) => {
                        const filterData = district.district_filter_data?.[0] || {};
                        const geoData = district.district_geo_data?.[0];
                        const hasGeo = district.geojson || geoData?.geojson;

                        return (
                            <tr key={district.id} className="hover:bg-main/40 transition-colors group border-b border-border/50 last:border-none">
                                <td className="py-2.5 px-4">
                                    <button 
                                        onClick={() => onToggleStatus(district.id, district.is_available)}
                                        className="focus:outline-none transition-transform hover:scale-110 cursor-pointer flex items-center justify-center w-full"
                                    >
                                        {district.is_available ? 
                                            <FaCheckCircle className="text-success text-[1.2rem] shadow-sm rounded-full bg-white" /> : 
                                            <FaTimesCircle className="text-textMuted opacity-30 text-[1.2rem]" />
                                        }
                                    </button>
                                </td>
                                <td className="py-2.5 px-4">
                                    <div className="font-extrabold text-textMain text-[0.95rem]">{district.name}</div>
                                    <div className="text-[0.7rem] text-textMuted font-mono mt-0.5">{t('common.labels.id_prefix')}: {district.id.substring(0,8)}</div>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                    <FaMapMarkedAlt className={`inline-block text-[1.1rem] ${hasGeo ? 'text-primary drop-shadow-sm' : 'text-textMuted opacity-20'}`} />
                                </td>

                                {tableColumns.map(col => {
                                    const value = district[col.key] !== undefined ? district[col.key] : filterData[col.key];
                                    let displayValue = value;
                                    if (col.type === 'boolean') displayValue = value ? t('admin_parser.table.yes') : t('admin_parser.table.no');

                                    return (
                                        <td key={col.key} className="py-2.5 px-3 text-textMain font-semibold">
                                            {displayValue !== null && displayValue !== undefined && displayValue !== '' ? displayValue : <span className="opacity-20">-</span>}
                                        </td>
                                    );
                                })}

                                <td className="py-2.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="cancel" onClick={() => onEdit(district)} className="!p-2 !bg-blue-500/10 !text-primary hover:!bg-primary hover:!text-white !border-transparent !rounded-lg">
                                            <FaEdit size={12} />
                                        </Button>
                                        <Button variant="cancel" onClick={() => onDelete(district.id)} className="!p-2 !bg-red-500/10 !text-danger hover:!bg-danger hover:!text-white !border-transparent !rounded-lg">
                                            <FaTrash size={12} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});

export default ResultsTable;