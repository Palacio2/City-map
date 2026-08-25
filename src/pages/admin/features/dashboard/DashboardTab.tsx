import { useMemo, useState, useCallback } from 'react';
import {
    FaCity,
    FaMap,
    FaMapMarkedAlt,
    FaCheckCircle,
    FaExclamationCircle,
    FaChartBar,
    FaEdit,
    FaExclamationTriangle,
    FaFilter,
    FaRocket
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '@admin/core/ui/DataTable';
import MiniStatsChart from '@admin/core/ui/MiniStatsChart';
import { StatCard } from '@admin/core/ui/StatCard';
import { Badge } from '@admin/core/ui/Badge';
import { Button } from '@admin/core/ui/Button';
import { supabase } from '@supabaseClient';

import { useActionGuard } from '@admin/core/context/useActionGuard';
import { useModals } from '@admin/core/context/ModalContext';
import { useDashboard } from '@admin/features/dashboard/useDashboard';
import { DistrictRowData } from './types';

export default function DashboardTab() {
    const { t } = useTranslation('db');
    const { canDo } = useActionGuard();
    const { showAlert } = useModals();
    const { stats, chartData, loading, chartDays, setChartDays } = useDashboard();
    
    const [filterType, setFilterType] = useState<'all' | 'issues' | 'outdated'>('all');
    const [isDeploying, setIsDeploying] = useState(false);

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${apiUrl}/geo/deploy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Deploy failed: ${res.status}`);
            }
            showAlert(t('common.success', 'Успіх'), t('admin_dashboard.deploy.success', 'Зміни успішно відправлені на публікацію! Сайт оновиться через декілька хвилин.'), 'success');
        } catch (err) {
            showAlert(t('common.error', 'Помилка'), err instanceof Error ? err.message : t('admin_dashboard.deploy.error', 'Помилка при спробі публікації.'), 'error');
        } finally {
            setIsDeploying(false);
        }
    };

    const handleEditDistrict = useCallback((district: DistrictRowData) => {
        localStorage.setItem('admin_active_tab', 'manual');
        const params = new URLSearchParams();
        
        // Always ensure we set the IDs properly if they exist
        if (district.countryId) params.set('country', district.countryId);
        // Fallback for missing country name: use '...' to let ManualTab fetch it
        params.set('countryName', '...');
        
        if (district.cityId) params.set('city', district.cityId);
        if (district.cityName) params.set('cityName', district.cityName);
        else params.set('cityName', '...');
        
        if (district.id) params.set('district', district.id);
        if (district.name) params.set('districtName', district.name);
        else params.set('districtName', '...');
        
        window.location.href = `/admin?${params.toString()}`;
    }, []);

    const canEditManual = canDo('manual.edit');

    // Об'єднуємо обидва списки в один масив та дедуплікуємо за ID
    const combinedDistricts = useMemo(() => {
        if (!stats) return [];
        const map = new Map<string, DistrictRowData & { isOutdated?: boolean; isProblematic?: boolean }>();
        
        // Явно вказуємо тип (d: DistrictRowData)
        (stats.problematicDistricts || []).forEach((d: DistrictRowData) => {
            map.set(d.id, { ...d, isProblematic: true });
        });
        
        // Явно вказуємо тип (d: DistrictRowData)
        (stats.outdatedDistricts || []).forEach((d: DistrictRowData) => {
            const existing = map.get(d.id);
            if (existing) {
                existing.isOutdated = true;
            } else {
                map.set(d.id, { ...d, isOutdated: true });
            }
        });
        
        return Array.from(map.values());
    }, [stats]);

    const filteredDistricts = useMemo(() => {
        if (filterType === 'issues') return combinedDistricts.filter(d => d.isProblematic);
        if (filterType === 'outdated') return combinedDistricts.filter(d => d.isOutdated);
        return combinedDistricts;
    }, [combinedDistricts, filterType]);

    const columns = useMemo(() => {
        const cols = [
            {
                header: t('admin_dashboard.tab.col_city'),
                render: (d: DistrictRowData) => (
                    <span className="text-textMuted font-medium text-xs truncate max-w-[100px] block">
                        {d.cityName}
                    </span>
                )
            },
            {
                header: t('admin_dashboard.tab.col_district'),
                render: (d: DistrictRowData) => (
                    <span className="font-bold text-textMain text-xs truncate max-w-[130px] block">
                        {d.name}
                    </span>
                )
            },
            {
                header: t('admin_dashboard.tab.col_status'),
                render: (d: DistrictRowData) => d.isAvailable
                    ? <Badge variant="success">{t('admin_dashboard.tab.status_pub')}</Badge>
                    : <Badge variant="default">{t('admin_dashboard.tab.status_hidden')}</Badge>
            },
            {
                header: t('admin_dashboard.tab.last_parsed'),
                render: (d: DistrictRowData & { isOutdated?: boolean }) => d.lastUpdated
                    ? <span className={`font-mono text-xs font-semibold ${d.isOutdated ? 'text-rose-600' : 'text-textMain'}`}>{new Date(d.lastUpdated).toLocaleDateString('uk-UA')}</span>
                    : <Badge variant="danger">{t('admin_dashboard.tab.never')}</Badge>
            },
            {
                header: t('admin_dashboard.tab.col_issues'),
                render: (d: DistrictRowData & { isOutdated?: boolean; isProblematic?: boolean }) => (
                    <div className="flex gap-1.5 flex-wrap">
                        {d.missingPhoto && <Badge variant="danger">{t('admin_dashboard.tab.issue_photo')}</Badge>}
                        {d.missingGeo && <Badge variant="warning">{t('admin_dashboard.tab.issue_geo')}</Badge>}
                        {d.isOutdated && <Badge variant="danger">{t('admin_dashboard.tab.outdated_badge')}</Badge>}
                    </div>
                )
            }
        ];

        if (canEditManual) {
            cols.push({
                header: t('admin_dashboard.tab.col_edit'),
                render: (d: DistrictRowData) => (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => handleEditDistrict(d)}
                            className="p-1.5 text-textMuted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title={t('admin_dashboard.tab.btn_edit')}
                        >
                            <FaEdit className="text-xs" />
                        </button>
                    </div>
                )
            });
        }
        return cols;
    }, [t, canEditManual, handleEditDistrict]);

    if (loading) {
        return (
            <div className="py-20 text-xs text-textMuted font-mono font-bold flex flex-col items-center justify-center gap-3 bg-surface rounded-2xl sm:rounded-3xl border border-border shadow-2xs">
                <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
                <div>{t('common.loading')}</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 text-rose-600 text-center font-semibold text-xs bg-rose-500/10 rounded-2xl sm:rounded-3xl border border-rose-500/20 flex flex-col items-center gap-2">
                <FaExclamationCircle className="text-xl" />
                <div>{t('common.error')}</div>
            </div>
        );
    }

    const publishedPercentage = stats.totalDistricts > 0
        ? `${Math.round((stats.publishedDistricts / stats.totalDistricts) * 100)}%`
        : '0%';

    return (
        <div className="flex flex-col gap-4 sm:gap-6 w-full pb-8 flex-1 h-full animate-fadeIn">
            <div className="bg-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl border border-primary/20 flex items-center justify-center text-lg shadow-2xs shrink-0">
                        <FaChartBar />
                    </div>
                    <div>
                        <h2 className="m-0 text-base sm:text-lg font-bold text-textMain tracking-tight">
                            {t('admin_dashboard.tab.title')}
                        </h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5 font-medium">
                            {t('admin_dashboard.tab.subtitle')}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className={isDeploying ? 'opacity-70' : ''}
                    >
                        {isDeploying ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FaRocket className="text-xs" />
                        )}
                        {t('admin_dashboard.deploy.btn', 'Опублікувати зміни')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
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
                    variant="primary"
                />
                <StatCard
                    title={t('admin_dashboard.tab.stats_published')}
                    value={stats.publishedDistricts}
                    icon={FaCheckCircle}
                    variant="success"
                    badgeText={publishedPercentage}
                />
            </div>

            {chartData.length > 0 && (
                <div className="w-full">
                    <MiniStatsChart
                        title={t('admin_dashboard.tab.chart_title')}
                        data={chartData}
                        currentFilter={chartDays}
                        onFilterChange={setChartDays}
                    />
                </div>
            )}

            {/* Об'єднана секція районів, що потребують уваги */}
            <div className="min-w-0 bg-surface rounded-2xl sm:rounded-3xl border border-border shadow-2xs overflow-hidden flex flex-col">
                <div className="px-4 sm:px-5 py-3.5 border-b border-border bg-main/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FaExclamationTriangle className="text-amber-500 text-sm" />
                        <h3 className="m-0 text-textMain text-xs sm:text-sm font-bold tracking-tight">
                            {t('admin_dashboard.tab.attention_title')} ({combinedDistricts.length})
                        </h3>
                    </div>
                    
                    {/* Фільтри */}
                    <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border">
                        <FaFilter className="text-textMuted text-[10px] ml-1.5" />
                        <button
                            type="button"
                            onClick={() => setFilterType('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${filterType === 'all' ? 'bg-primary text-white shadow-2xs' : 'text-textMuted hover:text-textMain'}`}
                        >
                            {t('common.all')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('issues')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${filterType === 'issues' ? 'bg-primary text-white shadow-2xs' : 'text-textMuted hover:text-textMain'}`}
                        >
                            {t('admin_dashboard.tab.issues_filter')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('outdated')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${filterType === 'outdated' ? 'bg-primary text-white shadow-2xs' : 'text-textMuted hover:text-textMain'}`}
                        >
                            {t('admin_dashboard.tab.outdated_filter')}
                        </button>
                    </div>
                </div>

                {filteredDistricts.length === 0 ? (
                    <div className="p-12 text-center text-textMuted font-medium text-xs flex flex-col items-center gap-2 flex-1 justify-center min-h-[220px]">
                        <span className="text-2xl">🎉</span>
                        <span className="font-bold text-textMain">
                            {t('admin_dashboard.tab.all_fresh')}
                        </span>
                    </div>
                ) : (
                    <div className="p-3 sm:p-4 flex flex-col gap-3">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar rounded-2xl border border-border shadow-xs">
                            <DataTable
                                columns={columns}
                                data={filteredDistricts}
                                emptyMessage={t('admin_dashboard.tab.empty_problems')}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
