import React, { useMemo } from 'react';
import { FaCity, FaMap, FaMapMarkedAlt, FaCheckCircle, FaExclamationCircle, FaClock, FaChartBar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import MiniStatsChart from '../../ui/MiniStatsChart';
import { StatCard } from '../../ui/StatCard';
import { Badge } from '../../ui/Badge';
import { useAdmin } from '../../hooks/AdminContext';
import { useDashboard } from './useDashboard';

export default function DashboardTab() {
    const { t } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const { stats, chartData, loading, isSuperAdmin } = useDashboard(currentAdmin);

    const probColumns = useMemo(() => [
        { 
            header: t('admin_dashboard.tab.col_city'), 
            render: (d) => <span className="text-textMuted font-medium text-[0.95rem]">{d.cityName}</span> 
        },
        { 
            header: t('admin_dashboard.tab.col_district'), 
            render: (d) => <span className="font-bold text-textMain text-[0.95rem]">{d.name}</span> 
        },
        { 
            header: t('admin_dashboard.tab.col_status'), 
            render: (d) => d.isAvailable 
                ? <Badge variant="success">{t('admin_dashboard.tab.status_pub')}</Badge> 
                : <Badge variant="default">{t('admin_dashboard.tab.status_hidden')}</Badge>
        },
        { 
            header: t('admin_dashboard.tab.col_issues'), 
            render: (d) => (
                <div className="flex gap-2 flex-wrap">
                    {d.missingPhoto && <Badge variant="danger">{t('admin_dashboard.tab.issue_photo')}</Badge>}
                    {d.missingGeo && <Badge variant="warning">{t('admin_dashboard.tab.issue_geo')}</Badge>}
                </div>
            ) 
        }
    ], [t]);

    const outdatedColumns = useMemo(() => [
        { 
            header: t('admin_dashboard.tab.col_city'), 
            render: (d) => <span className="text-textMuted font-medium text-[0.95rem]">{d.cityName}</span> 
        },
        { 
            header: t('admin_dashboard.tab.col_district'), 
            render: (d) => <span className="font-bold text-textMain text-[0.95rem]">{d.name}</span> 
        },
        { 
            header: t('admin_dashboard.tab.last_parsed'), 
            render: (d) => d.lastUpdated 
                ? <span className="font-medium text-textMain text-[0.95rem]">{new Date(d.lastUpdated).toLocaleDateString('uk-UA')}</span> 
                : <Badge variant="danger">{t('admin_dashboard.tab.never')}</Badge>
        },
        {
            header: t('admin_dashboard.tab.col_status'),
            render: () => (
                <Badge variant="danger" className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-danger"></div> 
                    {t('admin_dashboard.tab.needs_update')}
                </Badge>
            )
        }
    ], [t]);

    if (loading) {
        return (
            <div className="py-20 px-5 text-[1rem] text-textMuted font-medium flex flex-col items-center gap-4 bg-surface rounded-xl border border-border shadow-sm">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin"></div>
                <div>{t('common.loading')}</div>
            </div>
        );
    }
    
    if (!stats) {
        return (
            <div className="p-16 text-danger text-center font-bold text-[1.1rem] bg-red-500/5 rounded-xl border border-red-500/20 flex flex-col items-center gap-4">
                <FaExclamationCircle className="text-[2.5rem] opacity-80" />
                <div>{t('common.error')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_ease-out]">
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-main text-textMain rounded-lg border border-border flex items-center justify-center text-[1.2rem]">
                    <FaChartBar />
                </div>
                <div>
                    <h2 className="m-0 text-[1.25rem] text-textMain font-bold tracking-tight">
                        {t('admin_dashboard.tab.title')}
                    </h2>
                    <p className="m-0 text-textMuted text-[0.9rem] mt-1">
                        {t('admin_dashboard.tab.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
                <StatCard 
                    title={t('admin_dashboard.tab.stats_countries')} 
                    value={stats.totalCountries} 
                    icon={FaMap} 
                    variant="primary" 
                />
                <StatCard 
                    title={t('admin_dashboard.tab.stats_cities')} 
                    value={stats.totalCities} 
                    icon={FaCity} 
                    variant="purple" 
                />
                <StatCard 
                    title={t('admin_dashboard.tab.stats_districts')} 
                    value={stats.totalDistricts} 
                    icon={FaMapMarkedAlt} 
                    variant="success" 
                />
                <StatCard 
                    title={t('admin_dashboard.tab.stats_published')} 
                    value={stats.publishedDistricts} 
                    icon={FaCheckCircle} 
                    variant="success" 
                    className="!bg-emerald-500/5"
                />
            </div>

            {isSuperAdmin && chartData.length > 0 && (
                <div className="w-full">
                    <MiniStatsChart 
                        title={t('admin_dashboard.tab.chart_title')} 
                        data={chartData} 
                    />
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6 flex-wrap">
                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="px-6 py-5 border-b border-border bg-surface flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-[#d97706]">
                                <FaExclamationCircle size={16} />
                            </div>
                            <h3 className="m-0 text-textMain text-[1.1rem] font-bold">
                                {t('admin_dashboard.tab.prob_title')} 
                            </h3>
                        </div>
                        <span className="bg-amber-500/10 text-[#d97706] py-0.5 px-2.5 rounded-md text-[0.85rem] font-bold border border-amber-500/20">
                            {stats.problematicDistricts.length}
                        </span>
                    </div>
                    
                    {stats.problematicDistricts.length === 0 ? (
                        <div className="p-16 text-center text-textMuted font-medium text-[1rem] flex flex-col items-center gap-4 flex-1 justify-center bg-main/20">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center text-[2rem] border border-border">🎉</div>
                            <div>{t('admin_dashboard.tab.empty_problems')}</div>
                        </div>
                    ) : (
                        <DataTable 
                            columns={probColumns} 
                            data={stats.problematicDistricts} 
                            emptyMessage={t('admin_dashboard.tab.empty_problems')} 
                        />
                    )}
                </div>

                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="px-6 py-5 border-b border-border bg-surface flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-danger">
                                <FaClock size={16} />
                            </div>
                            <h3 className="m-0 text-textMain text-[1.1rem] font-bold">
                                {t('admin_dashboard.tab.outdated_title')} 
                            </h3>
                        </div>
                        <span className="bg-red-500/10 text-danger py-0.5 px-2.5 rounded-md text-[0.85rem] font-bold border border-red-500/20">
                            {stats.outdatedDistricts?.length || 0}
                        </span>
                    </div>
                    
                    {(!stats.outdatedDistricts || stats.outdatedDistricts.length === 0) ? (
                        <div className="p-16 text-center text-textMuted font-medium text-[1rem] flex flex-col items-center gap-4 flex-1 justify-center bg-main/20">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center text-[2rem] border border-border">✨</div>
                            <div>{t('admin_dashboard.tab.all_fresh')}</div>
                        </div>
                    ) : (
                        <DataTable 
                            columns={outdatedColumns} 
                            data={stats.outdatedDistricts} 
                            emptyMessage={t('admin_dashboard.tab.all_fresh')} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}