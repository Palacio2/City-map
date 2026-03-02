import React from 'react';
import styles from './ParserConsole.module.css';

export default function ParserConsole({ logs, loading, onClear, onDownload, onStartClick, isStartDisabled, selectedCount }) {
    return (
        <div className={styles.consoleSection}>
            <div className={styles.consoleTopRow}>
                <div className={styles.headerLeft}>
                    <div className={styles.stepHeader}>
                        <span className={styles.stepIcon}>🚀</span>
                        <h3 className={styles.consoleTitle}>Крок 4. Консоль Парсера</h3>
                    </div>
                    {loading && (
                        <div className={styles.liveIndicator}>
                            <div className={styles.liveSpinner}></div>
                            Парсинг у процесі...
                        </div>
                    )}
                </div>
                
                <div className={styles.consoleActions}>
                    <button onClick={onClear} className={`${styles.btn} ${styles.logBtn}`} title="Очистити">🧹</button>
                    <button onClick={onDownload} className={`${styles.btn} ${styles.logBtn}`}>⬇️ Завантажити Лог</button>
                    <button
                        className={`${styles.btn} ${styles.accentBtn}`}
                        onClick={onStartClick}
                        disabled={isStartDisabled}
                    >
                        {loading ? '⏳ ПРАЦЮЄ...' : `▶ ЗАПУСТИТИ (${selectedCount})`}
                    </button>
                </div>
            </div>
            
            <div className={`${styles.customConsole} ${loading ? styles.liveConsole : ''}`}>
                {logs.length === 0 ? (
                    <div className={styles.placeholder}>Готовий до запуску. Чекаю команд... █</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className={`${styles.logLine} ${
                            log.msg.includes('❌') ? styles.logError : 
                            log.msg.includes('✅') ? styles.logSuccess : ''
                        }`}>
                            <span className={styles.logTime}>[{log.time}]</span> {log.msg}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}