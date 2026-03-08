import React, { useMemo } from 'react';
import styles from './MiniStatsChart.module.css';

const MiniStatsChart = ({ data, title }) => {
    // Мемоізація максимального значення для уникнення зайвих обчислень при рендері
    const maxValue = useMemo(() => {
        return Math.max(...data.map(item => item.value), 1);
    }, [data]);

    return (
        <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>{title}</h4>
            <div className={styles.barContainer}>
                {data.map((item, index) => (
                    <div key={index} className={styles.barGroup}>
                        <div className={styles.barWrapper}>
                            <div 
                                className={styles.bar} 
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                            >
                                <span className={styles.tooltip}>{item.value}</span>
                            </div>
                        </div>
                        <span className={styles.label}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(MiniStatsChart);