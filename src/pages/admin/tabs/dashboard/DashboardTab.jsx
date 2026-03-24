import React, { useMemo } from 'react';
import { FaMapMarkedAlt, FaCity, FaMap, FaExclamationCircle, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import MiniStatsChart from '../../ui/MiniStatsChart';
import { StatCard } from '../../ui/StatCard';
import { Badge } from '../../ui/Badge';
import { useAdmin } from '../../hooks/AdminContext';
import { useDashboard } from './useDashboard';

export default function DashboardTab() {
    const { t } = useTranslation('adminDashboard');
    const { currentAdmin } = useAdmin();
    const { stats, chartData, loading, isSuperAdmin } = useDashboard(currentAdmin);

    const probColumns = useMemo(() => [
        { header: t('dashboardTab.colCity'), render: (d) => <span className="text-textMuted font-medium text-[0.95rem]">{d.cityName}</span> },
        { header: t('dashboardTab.colDistrict'), render: (d) => <span className="font-bold text-textMain text-[0.95rem]">{d.name}</span> },
        { 
            header: t('dashboardTab.colStatus'), 
            render: (d) => d.isAvailable ? <Badge variant="success">{t('dashboardTab.statusPub')}</Badge> : <Badge variant="default">{t('dashboardTab.statusHidden')}</Badge>
        },
        { 
            header: t('dashboardTab.colIssues'), 
            render: (d) => (
                <div className="flex gap-2 flex-wrap">
                    {d.missingPhoto && <Badge variant="danger">{t('dashboardTab.issuePhoto')}</Badge>}
                    {d.missingGeo && <Badge variant="warning">{t('dashboardTab.issueGeo')}</Badge>}
                </div>
            ) 
        }
    ], [t]);

    const outdatedColumns = useMemo(() => [
        { header: t('dashboardTab.colCity'), render: (d) => <span className="text-textMuted font-medium text-[0.95rem]">{d.cityName}</span> },
        { header: t('dashboardTab.colDistrict'), render: (d) => <span className="font-bold text-textMain text-[0.95rem]">{d.name}</span> },
        { 
            header: t('dashboardTab.lastParsed', {defaultValue: 'Last Parsed'}), 
            render: (d) => d.lastUpdated ? <span className="font-medium text-textMain text-[0.95rem]">{new Date(d.lastUpdated).toLocaleDateString('uk-UA')}</span> : <Badge variant="danger">{t('dashboardTab.never', {defaultValue: 'Never'})}</Badge>
        },
        {
            header: t('dashboardTab.colStatus'),
            render: () => (
                <Badge variant="danger">
                    <div className="w-2 h-2 rounded-full bg-danger"></div> 
                    {t('dashboardTab.needsUpdate', {defaultValue: 'Needs Update'})}
                </Badge>
            )
        }
    ], [t]);

    if (loading) {
        return (
            <div className="py-20 px-5 text-[1.1rem] text-primary text-center font-bold flex flex-col items-center gap-5 bg-surface rounded-lg border border-border shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                <div>{t('dashboardTab.loading')}</div>
            </div>
        );
    }
    
    if (!stats) {
        return (
            <div className="p-16 text-danger text-center font-bold text-[1.1rem] bg-red-500/5 rounded-lg border border-red-500/20 flex flex-col items-center gap-4">
                <FaExclamationCircle className="text-[2.5rem] opacity-80" />
                <div>{t('dashboardTab.error')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
                <StatCard 
                    title={t('dashboardTab.countries')} 
                    value={stats.totalCountries} 
                    icon={FaMap} 
                    variant="primary" 
                />
                <StatCard 
                    title={t('dashboardTab.cities')} 
                    value={stats.totalCities} 
                    icon={FaCity} 
                    variant="purple" 
                />
                <StatCard 
                    title={t('dashboardTab.districtsTotal')} 
                    value={stats.totalDistricts} 
                    icon={FaMapMarkedAlt} 
                    variant="success" 
                />
                <StatCard 
                    title={t('dashboardTab.published')} 
                    value={stats.publishedDistricts} 
                    icon={FaCheckCircle} 
                    variant="success" 
                    className="!bg-emerald-500/5"
                />
            </div>

            {isSuperAdmin && chartData.length > 0 && (
                <div className="w-full">
                    <MiniStatsChart 
                        title={t('dashboardTab.chartNewUsers')} 
                        data={chartData} 
                    />
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6 flex-wrap">
                <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-[#d97706]"><FaExclamationCircle size={16} /></div>
                        <h3 className="m-0 color-textMain text-[1.1rem] font-bold flex items-center gap-3">
                            {t('dashboardTab.problemsTitle')} 
                            <span className="bg-amber-500/10 text-[#d97706] py-0.5 px-2.5 rounded-full text-[0.85rem] font-bold">{stats.problematicDistricts.length}</span>
                        </h3>
                    </div>
                    
                    {stats.problematicDistricts.length === 0 ? (
                        <div className="p-16 text-center text-textMuted font-medium text-[1rem] flex flex-col items-center gap-4 flex-1 justify-center">
                            <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center text-[2rem]">🎉</div>
                            <div>{t('dashboardTab.emptyProblems')}</div>
                        </div>
                    ) : (
                        <DataTable 
                            columns={probColumns} 
                            data={stats.problematicDistricts} 
                            emptyMessage={t('dashboardTab.emptyProblems')} 
                        />
                    )}
                </div>

                <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-danger"><FaClock size={16} /></div>
                        <h3 className="m-0 color-textMain text-[1.1rem] font-bold flex items-center gap-3">
                            {t('dashboardTab.outdatedTitle')} 
                            <span className="bg-red-500/10 text-danger py-0.5 px-2.5 rounded-full text-[0.85rem] font-bold">{stats.outdatedDistricts?.length || 0}</span>
                        </h3>
                    </div>
                    
                    {(!stats.outdatedDistricts || stats.outdatedDistricts.length === 0) ? (
                        <div className="p-16 text-center text-textMuted font-medium text-[1rem] flex flex-col items-center gap-4 flex-1 justify-center">
                            <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center text-[2rem]">✨</div>
                            <div>{t('dashboardTab.allFresh')}</div>
                        </div>
                    ) : (
                        <DataTable 
                            columns={outdatedColumns} 
                            data={stats.outdatedDistricts} 
                            emptyMessage={t('dashboardTab.allFresh')} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}