import React, { useMemo } from 'react';
import { FaFilter } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export interface MiniStatsChartProps {
    data: Array<{ label: string; value: number }>;
    title: string;
    currentFilter?: number;
    onFilterChange?: (days: number) => void;
}

const MiniStatsChart: React.FC<MiniStatsChartProps> = ({ data, title, currentFilter = 7, onFilterChange }) => {
    const { t } = useTranslation('db');
    const [isOpen, setIsOpen] = React.useState(false);

    const maxValue = useMemo(() => {
        return Math.max(...data.map(item => item.value), 1);
    }, [data]);

    const filterOptions = [
        { label: t('admin.ui.mini_stats_chart.filter_7_days'), value: 7 },
        { label: t('admin.ui.mini_stats_chart.filter_14_days'), value: 14 },
        { label: t('admin.ui.mini_stats_chart.filter_30_days'), value: 30 },
    ];

    const currentLabel = filterOptions.find(opt => opt.value === currentFilter)?.label || t('admin.ui.mini_stats_chart.filter');

    return (
        <div className="bg-surface p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="m-0 text-sm sm:text-base font-semibold text-textMain tracking-tight">
                    {title}
                </h3>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                        <FaFilter className="text-[10px]" />
                        <span>{currentLabel}</span>
                    </button>
                    {isOpen && (
                        <div className="absolute right-0 mt-1.5 w-44 bg-surface border border-primary/20 rounded-2xl shadow-xl shadow-black/10 z-50 py-1.5 backdrop-blur-md">
                            {filterOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onFilterChange?.(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-primary/5 transition-colors ${currentFilter === opt.value ? 'text-primary font-bold bg-primary/10' : 'text-textMain'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="relative w-full h-[180px] sm:h-[220px] flex flex-col justify-end pt-8 pb-2">
                <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between pointer-events-none opacity-50">
                    <div className="border-b border-dashed border-primary/20 w-full"></div>
                    <div className="border-b border-dashed border-primary/20 w-full"></div>
                    <div className="border-b border-dashed border-primary/20 w-full"></div>
                    <div className="border-b border-primary/20 w-full"></div>
                </div>
                <div className="flex items-end justify-between gap-1.5 sm:gap-4 h-full relative z-10 px-2">
                    {data.map((item, index) => {
                        const heightPct = Math.max((item.value / maxValue) * 100, 6);
                        const opacityClass = index > data.length - 3
                            ? 'bg-primary shadow-md shadow-primary/40'
                            : 'bg-primary/20 hover:bg-primary/50';
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                                <div className="w-full flex items-end justify-center h-full relative">
                                    <div
                                        className={`w-full max-w-[44px] rounded-t-lg transition-all duration-500 ease-out cursor-pointer ${opacityClass}`}
                                        style={{ height: `${heightPct}%` }}
                                    >
                                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] sm:text-xs font-semibold py-0.5 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-20 whitespace-nowrap">
                                            {item.value}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-primary/60 mt-2 truncate text-center w-full">
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(MiniStatsChart);