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

    if (loading) return <div style={{ padding: '40px', fontSize: '1.2rem', color: '#64748b', textAlign: 'center' }}>⏳ Завантаження статистики...</div>;
    if (!stats) return <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>❌ Помилка завантаження даних. Перевірте з'єднання з сервером.</div>;

    return (
        <div className={styles.container}>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <p className={styles.statTitle}><FaMap size={22} color="#3b82f6"/> Країни</p>
                    <h3 className={styles.statValue}>{stats.totalCountries}</h3>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statTitle}><FaCity size={22} color="#8b5cf6"/> Міста</p>
                    <h3 className={styles.statValue}>{stats.totalCities}</h3>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statTitle}><FaMapMarkedAlt size={22} color="#10b981"/> Райони (Всього)</p>
                    <h3 className={styles.statValue}>{stats.totalDistricts}</h3>
                </div>
                <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
                    <p className={`${styles.statTitle} ${styles.statTitleSuccess}`}><FaCheckCircle size={22} color="#166534"/> Опубліковані</p>
                    <h3 className={`${styles.statValue} ${styles.statValueSuccess}`}>{stats.publishedDistricts}</h3>
                </div>
            </div>

            <div className={styles.problemsSection}>
                <div className={styles.problemsHeader}>
                    <FaExclamationCircle size={24} color="#ef4444" />
                    <h3 className={styles.problemsTitle}>Потребують доопрацювання ({stats.problematicDistricts.length})</h3>
                </div>
                
                {stats.problematicDistricts.length === 0 ? (
                    <div className={styles.emptyState}>🎉 Усі райони повністю заповнені! Ви чудово попрацювали.</div>
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
                                                {d.isAvailable ? 'Опубліковано' : 'Приховано'}
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