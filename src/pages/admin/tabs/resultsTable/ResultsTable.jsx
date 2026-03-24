import React from 'react';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaMapMarkedAlt, FaSpinner } from 'react-icons/fa';
import { Button } from '../../ui/Button';

const ResultsTable = ({ districts, onEdit, onDelete, onToggleStatus, isLoading, fieldsConfig = [] }) => {
    const tableColumns = fieldsConfig
        .filter(f => f.is_visible_table)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-textMuted gap-3">
                <FaSpinner className="animate-spin text-[2rem] text-primary" />
                <span>Завантаження районів...</span>
            </div>
        );
    }

    if (!districts.length) {
        return (
            <div className="flex items-center justify-center h-[300px] text-textMuted font-medium">
                Районів не знайдено
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
                <thead className="bg-main sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="py-3 px-4 text-left font-bold text-textMuted border-b border-border w-[60px]">Статус</th>
                        <th className="py-3 px-4 text-left font-bold text-textMuted border-b border-border min-w-[180px]">Назва району</th>
                        <th className="py-3 px-4 text-center font-bold text-textMuted border-b border-border w-[80px]">Гео</th>
                        
                        {tableColumns.map(col => (
                            <th key={col.key} className="py-3 px-4 text-left font-bold text-textMuted border-b border-border whitespace-nowrap">
                                {col.icon && <span className="mr-1">{col.icon}</span>}
                                {col.label}
                            </th>
                        ))}
                        
                        <th className="py-3 px-4 text-right font-bold text-textMuted border-b border-border w-[120px]">Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {districts.map((district) => {
                        const filterData = district.district_filter_data?.[0] || {};
                        const geoData = district.district_geo_data?.[0];
                        const hasGeo = district.geojson || geoData?.geojson;

                        return (
                            <tr key={district.id} className="hover:bg-main/50 transition-colors group">
                                <td className="py-3 px-4 border-b border-border">
                                    <button 
                                        onClick={() => onToggleStatus(district.id, district.is_available)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                        title={district.is_available ? "Сховати" : "Опублікувати"}
                                    >
                                        {district.is_available ? 
                                            <FaCheckCircle className="text-success text-[1.2rem]" /> : 
                                            <FaTimesCircle className="text-textMuted opacity-50 text-[1.2rem]" />
                                        }
                                    </button>
                                </td>
                                <td className="py-3 px-4 border-b border-border">
                                    <div className="font-bold text-textMain text-[0.95rem]">{district.name}</div>
                                    <div className="text-[0.8rem] text-textMuted">ID: {district.id.substring(0,8)}...</div>
                                </td>
                                <td className="py-3 px-4 border-b border-border text-center">
                                    <FaMapMarkedAlt className={`inline-block text-[1.1rem] ${hasGeo ? 'text-primary' : 'text-textMuted opacity-30'}`} />
                                </td>

                                {tableColumns.map(col => {
                                    const value = district[col.key] !== undefined ? district[col.key] : filterData[col.key];
                                    
                                    let displayValue = value;
                                    if (col.type === 'boolean') {
                                        displayValue = value ? 'Так' : 'Ні';
                                    }

                                    return (
                                        <td key={col.key} className="py-3 px-4 border-b border-border text-textMain text-[0.9rem]">
                                            {displayValue !== null && displayValue !== undefined && displayValue !== '' ? displayValue : <span className="opacity-30">-</span>}
                                        </td>
                                    );
                                })}

                                <td className="py-3 px-4 border-b border-border text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="secondary" onClick={() => onEdit(district)} className="!p-2 text-primary hover:bg-primary/10" title="Редагувати">
                                            <FaEdit />
                                        </Button>
                                        <Button variant="secondary" onClick={() => onDelete(district.id)} className="!p-2 text-danger hover:bg-danger/10" title="Видалити">
                                            <FaTrash />
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
};

export { ResultsTable };
export default ResultsTable;