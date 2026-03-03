import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { FaMapMarkedAlt, FaCity, FaMap, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import styles from './DashboardTab.module.css';

export default function DashboardTab() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.geo.getStats().then(data => {
            setStats(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.loadingState}>⏳ Завантаження статистики...</div>;
    if (!stats) return <div className={styles.errorState}>❌ Помилка завантаження даних. Перевірте з'єднання з сервером.</div>;

    return (
        <div className={styles.container}>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconBlue}`}><FaMap size={20} /></div>
                        <p className={styles.statTitle}>Країни</p>
                    </div>
                    <h3 className={styles.statValue}>{stats.totalCountries}</h3>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconPurple}`}><FaCity size={20} /></div>
                        <p className={styles.statTitle}>Міста</p>
                    </div>
                    <h3 className={styles.statValue}>{stats.totalCities}</h3>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconEmerald}`}><FaMapMarkedAlt size={20} /></div>
                        <p className={styles.statTitle}>Райони (Всього)</p>
                    </div>
                    <h3 className={styles.statValue}>{stats.totalDistricts}</h3>
                </div>
                <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.iconWrapper} ${styles.iconGreen}`}><FaCheckCircle size={20} /></div>
                        <p className={`${styles.statTitle} ${styles.statTitleSuccess}`}>Опубліковані</p>
                    </div>
                    <h3 className={`${styles.statValue} ${styles.statValueSuccess}`}>{stats.publishedDistricts}</h3>
                </div>
            </div>

            <div className={styles.problemsSection}>
                <div className={styles.problemsHeader}>
                    <div className={styles.iconWrapperError}><FaExclamationCircle size={20} /></div>
                    <h3 className={styles.problemsTitle}>Потребують доопрацювання <span className={styles.badge}>{stats.problematicDistricts.length}</span></h3>
                </div>
                
                {stats.problematicDistricts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🎉</div>
                        <div>Усі райони повністю заповнені! Ви чудово попрацювали.</div>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Місто</th>
                                    <th>Район</th>
                                    <th>Статус</th>
                                    <th>Проблеми</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.problematicDistricts.map(d => (
                                    <tr key={d.id}>
                                        <td className={styles.cityCell}>{d.cityName}</td>
                                        <td className={styles.districtCell}>{d.name}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${d.isAvailable ? styles.statusPublished : styles.statusHidden}`}>
                                                {d.isAvailable ? '🟢 Опубліковано' : '⚪ Приховано'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.issuesContainer}>
                                                {d.missingPhoto && <span className={`${styles.issueBadge} ${styles.issuePhoto}`}>📸 Немає фото</span>}
                                                {d.missingGeo && <span className={`${styles.issueBadge} ${styles.issueGeo}`}>🗺️ Немає GeoJSON</span>}
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