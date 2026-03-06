import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { FaMapMarkedAlt, FaCity, FaMap, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import styles from './DashboardTab.module.css';
import { useTranslation } from 'react-i18next';

export default function DashboardTab() {
    const { t } = useTranslation('admin');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.geo.getStats().then(data => {
            setStats(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.loadingState}>{t('dashboardTab.loading')}</div>;
    if (!stats) return <div className={styles.errorState}>{t('dashboardTab.error')}</div>;

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

            <div className={styles.problemsSection}>
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
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{t('dashboardTab.colCity')}</th>
                                    <th>{t('dashboardTab.colDistrict')}</th>
                                    <th>{t('dashboardTab.colStatus')}</th>
                                    <th>{t('dashboardTab.colIssues')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.problematicDistricts.map(d => (
                                    <tr key={d.id}>
                                        <td className={styles.cityCell}>{d.cityName}</td>
                                        <td className={styles.districtCell}>{d.name}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${d.isAvailable ? styles.statusPublished : styles.statusHidden}`}>
                                                {d.isAvailable ? t('dashboardTab.statusPub') : t('dashboardTab.statusHidden')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.issuesContainer}>
                                                {d.missingPhoto && <span className={`${styles.issueBadge} ${styles.issuePhoto}`}>{t('dashboardTab.issuePhoto')}</span>}
                                                {d.missingGeo && <span className={`${styles.issueBadge} ${styles.issueGeo}`}>{t('dashboardTab.issueGeo')}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}