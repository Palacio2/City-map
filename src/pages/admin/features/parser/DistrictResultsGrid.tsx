import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@admin/core/ui/Button';
import { FaSave, FaTrash, FaEdit } from 'react-icons/fa';
import { ParsedDistrictRowItem } from './types';

interface DistrictResultsGridProps {
    data: ParsedDistrictRowItem[];
    onSave: (rows: unknown[]) => Promise<void>;
    onRemove: (districtId: string) => void;
}

export default function DistrictResultsGrid({ data, onSave, onRemove }: DistrictResultsGridProps) {
    const { t } = useTranslation('db');
    const [saving, setSaving] = useState(false);
    const [editableData, setEditableData] = useState<ParsedDistrictRowItem[]>([]);

    // Sync state with props when data changes
    useEffect(() => {
        setEditableData(data);
    }, [data]);

    const columns = Array.from(new Set(data.flatMap(row => Object.keys(row)))).filter(key => 
        !['district_id', 'is_available', 'poi_data', 'geojson'].includes(key)
    );

    const handleSaveAll = async () => {
        setSaving(true);
        await onSave(editableData);
        setSaving(false);
    };

    const handleInputChange = (districtId: string, col: string, value: string) => {
        setEditableData(prev => prev.map(row => {
            if (row.district_id === districtId) {
                return { ...row, [col]: value };
            }
            return row;
        }));
    };

    return (
        <div className="flex flex-col gap-4 w-full animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface p-4 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-sm gap-4">
                <div>
                    <h3 className="m-0 text-base font-bold text-textMain">{t('admin_parser.results.title')}</h3>
                    <p className="text-xs text-textMuted mt-1">{t('admin_parser.results.processed')}: {editableData.length}</p>
                </div>
                <Button variant="success" size="md" onClick={handleSaveAll} disabled={saving || editableData.length === 0}>
                    <FaSave className="text-xs mr-2" /> {t('admin_parser.results.save_db')}
                </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#d6ccbf] dark:border-[#4a3f37] bg-surface shadow-xs scrollbar-thin">
                <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                        <tr className="bg-main/20 border-b border-[#d6ccbf] dark:border-[#4a3f37]">
                            <th className="py-2 px-3 font-semibold text-textMain whitespace-nowrap sticky left-0 bg-surface z-10 border-r border-[#d6ccbf] dark:border-[#4a3f37] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-10 text-center">{t('common.actions')}</th>
                            {columns.map(col => (
                                <th key={col} className="py-2 px-2 font-semibold text-textMain whitespace-nowrap border-r border-[#d6ccbf]/50 dark:border-[#4a3f37]/50 last:border-r-0 text-center">
                                    {col === 'district_name' ? t('admin_parser.results.col_district') : col.replace('_count', '')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {editableData.map((row, idx) => (
                            <tr key={row.district_id as string} className={`hover:bg-hover transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-main/5'} ${idx !== editableData.length - 1 ? 'border-b border-[#d6ccbf]/50 dark:border-[#4a3f37]/50' : ''}`}>
                                <td className="py-1 px-2 whitespace-nowrap sticky left-0 bg-surface z-10 border-r border-[#d6ccbf] dark:border-[#4a3f37] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="danger" size="sm" onClick={() => onRemove(row.district_id as string)} className="h-6 w-6 p-0 flex justify-center items-center rounded-md" title={t('admin_parser.results.remove')}>
                                            <FaTrash className="text-[9px]" />
                                        </Button>
                                    </div>
                                </td>
                                {columns.map(col => (
                                    <td key={col} className="p-0 border-r border-[#d6ccbf]/50 dark:border-[#4a3f37]/50 last:border-r-0 text-textMain whitespace-nowrap text-center">
                                        {col === 'district_name' ? (
                                            <span className="font-bold px-3">{String(row[col] || '-')}</span>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={row[col] === null || row[col] === undefined ? '' : String(row[col])}
                                                onChange={(e) => handleInputChange(row.district_id as string, col, e.target.value)}
                                                className="w-[70px] bg-transparent border-none text-center hover:bg-main/10 focus:bg-surface focus:ring-1 focus:ring-main/50 py-1.5 outline-none transition-all text-[11px]"
                                                placeholder="-"
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
