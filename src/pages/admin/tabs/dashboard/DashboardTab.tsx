import { useMemo } from 'react';
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
            render: (d: any) => <span className="text-textMuted font-medium">{d.cityName}</span>
        },
        {
            header: t('admin_dashboard.tab.col_district'),
            render: (d: any) => <span className="font-semibold text-textMain">{d.name}</span>
        },
        {
            header: t('admin_dashboard.tab.col_status'),
            render: (d: any) => d.isAvailable
                ? <Badge variant="success">{t('admin_dashboard.tab.status_pub')}</Badge>
                : <Badge variant="default">{t('admin_dashboard.tab.status_hidden')}</Badge>
        },
        {
            header: t('admin_dashboard.tab.col_issues'),
            render: (d: any) => (
                <div className="flex gap-1.5 flex-wrap">
                    {d.missingPhoto && <Badge variant="danger">{t('admin_dashboard.tab.issue_photo')}</Badge>}
                    {d.missingGeo && <Badge variant="warning">{t('admin_dashboard.tab.issue_geo')}</Badge>}
                </div>
            )
        }
    ], [t]);

    const outdatedColumns = useMemo(() => [
        {
            header: t('admin_dashboard.tab.col_city'),
            render: (d: any) => <span className="text-textMuted font-medium">{d.cityName}</span>
        },
        {
            header: t('admin_dashboard.tab.col_district'),
            render: (d: any) => <span className="font-semibold text-textMain">{d.name}</span>
        },
        {
            header: t('admin_dashboard.tab.last_parsed'),
            render: (d: any) => d.lastUpdated
                ? <span className="font-mono text-textMain">{new Date(d.lastUpdated).toLocaleDateString('uk-UA')}</span>
                : <Badge variant="danger">{t('admin_dashboard.tab.never')}</Badge>
        },
        {
            header: t('admin_dashboard.tab.col_status'),
            render: () => (
                <Badge variant="danger" className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                    {t('admin_dashboard.tab.needs_update')}
                </Badge>
            )
        }
    ], [t]);

    if (loading) {
        return (
            <div className="py-20 text-xs text-textMuted font-medium flex flex-col items-center gap-3 bg-surface rounded-xl border border-border">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                <div>{t('common.loading')}</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 text-danger text-center font-medium text-xs bg-danger-subtle rounded-xl border border-danger/20 flex flex-col items-center gap-2">
                <FaExclamationCircle className="text-xl" />
                <div>{t('common.error')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="bg-surface p-5 rounded-xl border border-border shadow-subtle flex items-center gap-3">
                <div className="w-10 h-10 bg-main text-primary rounded-lg border border-border flex items-center justify-center text-sm">
                    <FaChartBar />
                </div>
                <div>
                    <h2 className="m-0 text-base text-textMain font-semibold tracking-tight">
                        {t('admin_dashboard.tab.title')}
                    </h2>
                    <p className="m-0 text-textMuted text-xs mt-0.5">
                        {t('admin_dashboard.tab.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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
                />
            </div>

            {isSuperAdmin && chartData.length > 0 && (
                <div className="w-full bg-surface p-5 rounded-xl border border-border shadow-subtle">
                    <MiniStatsChart
                        title={t('admin_dashboard.tab.chart_title')}
                        data={chartData}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden flex flex-col">
                    <div className="px-4 py-3.5 border-b border-border bg-main/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FaExclamationCircle className="text-warning text-sm" />
                            <h3 className="m-0 text-textMain text-xs font-semibold">
                                {t('admin_dashboard.tab.prob_title')}
                            </h3>
                        </div>
                        <span className="bg-warning-subtle text-warning py-0.5 px-2 rounded text-[11px] font-medium border border-warning/20">
                            {stats.problematicDistricts.length}
                        </span>
                    </div>
                    {stats.problematicDistricts.length === 0 ? (
                        <div className="p-10 text-center text-textMuted font-medium text-xs flex flex-col items-center gap-2 flex-1 justify-center">
                            <span>🎉 {t('admin_dashboard.tab.empty_problems')}</span>
                        </div>
                    ) : (
                        <DataTable
                            columns={probColumns}
                            data={stats.problematicDistricts}
                            emptyMessage={t('admin_dashboard.tab.empty_problems')}
                        />
                    )}
                </div>

                <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden flex flex-col">
                    <div className="px-4 py-3.5 border-b border-border bg-main/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FaClock className="text-danger text-sm" />
                            <h3 className="m-0 text-textMain text-xs font-semibold">
                                {t('admin_dashboard.tab.outdated_title')}
                            </h3>
                        </div>
                        <span className="bg-danger-subtle text-danger py-0.5 px-2 rounded text-[11px] font-medium border border-danger/20">
                            {stats.outdatedDistricts?.length || 0}
                        </span>
                    </div>
                    {(!stats.outdatedDistricts || stats.outdatedDistricts.length === 0) ? (
                        <div className="p-10 text-center text-textMuted font-medium text-xs flex flex-col items-center gap-2 flex-1 justify-center">
                            <span>✨ {t('admin_dashboard.tab.all_fresh')}</span>
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