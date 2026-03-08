import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { adminUsersAPI } from '@api/adminUsersAPI'; 
import { FaMapMarkedAlt, FaCity, FaMap, FaExclamationCircle, FaCheckCircle, FaClock } from 'react-icons/fa';
import styles from './DashboardTab.module.css';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import MiniStatsChart from '../../ui/MiniStatsChart';
import { useAdmin } from '../../hooks/AdminContext';

export default function DashboardTab() {
    const { t } = useTranslation('admin');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const geoStats = await api.geo.getStats();
                setStats(geoStats);

                if (isSuperAdmin) {
                    const usersResponse = await adminUsersAPI.getUsers();
                    const users = usersResponse.users || [];

                    const last7Days = [...Array(7)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)); 
                        return localDate.toISOString().split('T')[0]; 
                    });

                    const formattedChartData = last7Days.map(dateStr => {
                        const count = users.filter(u => u.created_at && u.created_at.startsWith(dateStr)).length;
                        const [, month, day] = dateStr.split('-');
                        return {
                            label: `${day}.${month}`,
                            value: count
                        };
                    });

                    setChartData(formattedChartData);
                }
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [isSuperAdmin]);

    if (loading) return <div className={styles.loadingState}>{t('dashboardTab.loading')}</div>;
    if (!stats) return <div className={styles.errorState}>{t('dashboardTab.error')}</div>;

    const probColumns = [
        { header: t('dashboardTab.colCity'), render: (d) => <span className={styles.cityCell}>{d.cityName}</span> },
        { header: t('dashboardTab.colDistrict'), render: (d) => <span className={styles.districtCell}>{d.name}</span> },
        { 
            header: t('dashboardTab.colStatus'), 
            render: (d) => (
                <span className={`${styles.statusBadge} ${d.isAvailable ? styles.statusPublished : styles.statusHidden}`}>
                    {d.isAvailable ? t('dashboardTab.statusPub') : t('dashboardTab.statusHidden')}
                </span>
            ) 
        },
        { 
            header: t('dashboardTab.colIssues'), 
            render: (d) => (
                <div className={styles.issuesContainer}>
                    {d.missingPhoto && <span className={`${styles.issueBadge} ${styles.issuePhoto}`}>{t('dashboardTab.issuePhoto')}</span>}
                    {d.missingGeo && <span className={`${styles.issueBadge} ${styles.issueGeo}`}>{t('dashboardTab.issueGeo')}</span>}
                </div>
            ) 
        }
    ];

    const outdatedColumns = [
        { header: t('dashboardTab.colCity'), render: (d) => <span className={styles.cityCell}>{d.cityName}</span> },
        { header: t('dashboardTab.colDistrict'), render: (d) => <span className={styles.districtCell}>{d.name}</span> },
        { 
            header: t('dashboardTab.lastParsed', {defaultValue: 'Last Parsed'}), 
            render: (d) => d.lastUpdated ? new Date(d.lastUpdated).toLocaleDateString('uk-UA') : t('dashboardTab.never', {defaultValue: 'Never'})
        },
        {
            header: t('dashboardTab.colStatus'),
            render: () => <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 'bold'}}><div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444'}}></div> {t('dashboardTab.needsUpdate', {defaultValue: 'Needs Update'})}</span>
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconBlue}`}><FaMap size={20} /></div>
                        <p className={styles.statTitle}>{t('dashboardTab.countries')}</p>
                    </div>
                    <h3 className={styles.statValue}>{stats.totalCountries}</h3>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconPurple}`}><FaCity size={20} /></div>
                        <p className={styles.statTitle}>{t('dashboardTab.cities')}</p>
                    </div>
                    <h3 className={styles.statValue}>{stats.totalCities}</h3>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconEmerald}`}><FaMapMarkedAlt size={20} /></div>
                        <p className={styles.statTitle}>{t('dashboardTab.districtsTotal')}</p>
                    </div>
                    <h3 className={styles.statValue}>{stats.totalDistricts}</h3>
                </div>
                <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconGreen}`}><FaCheckCircle size={20} /></div>
                        <p className={`${styles.statTitle} ${styles.statTitleSuccess}`}>{t('dashboardTab.published')}</p>
                    </div>
                    <h3 className={`${styles.statValue} ${styles.statValueSuccess}`}>{stats.publishedDistricts}</h3>
                </div>
            </div>

            {isSuperAdmin && chartData.length > 0 && (
                <div className={styles.chartsRow} style={{ width: '100%', maxWidth: '800px' }}>
                    <MiniStatsChart 
                        title={t('dashboardTab.chartNewUsers')} 
                        data={chartData} 
                    />
                </div>
            )}

            <div className={styles.chartsRow} style={{ flexWrap: 'nowrap' }}>
                <div className={styles.problemsSection} style={{ flex: 1 }}>
                    <div className={styles.problemsHeader}>
                        <div className={styles.iconWrapperError}><FaExclamationCircle size={20} /></div>
                        <h3 className={styles.problemsTitle}>{t('dashboardTab.problemsTitle')} <span className={styles.badge}>{stats.problematicDistricts.length}</span></h3>
                    </div>
                    
                    {stats.problematicDistricts.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🎉</div>
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

                <div className={styles.problemsSection} style={{ flex: 1 }}>
                    <div className={styles.problemsHeader} style={{borderBottomColor: '#fecaca'}}>
                        <div className={styles.iconWrapperError} style={{background: '#fee2e2', color: '#ef4444'}}><FaClock size={20} /></div>
                        <h3 className={styles.problemsTitle}>{t('dashboardTab.outdatedTitle')} <span className={styles.badge} style={{background: '#ef4444'}}>{stats.outdatedDistricts?.length || 0}</span></h3>
                    </div>
                    
                    {(!stats.outdatedDistricts || stats.outdatedDistricts.length === 0) ? (
                        <div className={styles.emptyState} style={{color: '#10b981', background: '#ecfdf5'}}>
                            <div className={styles.emptyIcon}>✨</div>
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