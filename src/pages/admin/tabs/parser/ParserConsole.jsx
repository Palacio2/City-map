import React, { useEffect, useRef } from 'react';
import styles from './ParserConsole.module.css';
import { FiTrash2, FiDownload, FiPlay, FiLoader } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export default function ParserConsole({ logs, loading, onClear, onDownload, onStartClick, isStartDisabled, selectedCount }) {
    const { t } = useTranslation('admin');
    const consoleEndRef = useRef(null);

    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className={styles.consoleSection}>
            <div className={styles.consoleTopRow}>
                <div className={styles.headerLeft}>
                    <div className={styles.stepHeader}>
                        <span className={styles.stepIcon}>🚀</span>
                        <h3 className={styles.consoleTitle}>{t('parserConsole.title')}</h3>
                    </div>
                    {loading && (
                        <div className={styles.liveIndicator}>
                            <div className={styles.pulseDot}></div>
                            <span>{t('parserConsole.parsingInProcess')}</span>
                        </div>
                    )}
                </div>
                
                <div className={styles.consoleActions}>
                    <button onClick={onClear} disabled={loading} className={`${styles.btn} ${styles.logBtn}`} title={t('parserConsole.clearBtn')}>
                        <FiTrash2 size={16} />
                    </button>
                    <button onClick={onDownload} disabled={loading} className={`${styles.btn} ${styles.logBtn}`}>
                        <FiDownload size={16} /> {t('parserConsole.logBtn')}
                    </button>
                    <button
                        className={`${styles.btn} ${styles.accentBtn} ${loading ? styles.btnParsing : ''}`}
                        onClick={onStartClick}
                        disabled={isStartDisabled || loading}
                    >
                        {loading ? (
                            <>
                                <FiLoader className={styles.spinIcon} size={18} /> {t('parserConsole.workingBtn')}
                            </>
                        ) : (
                            <>
                                <FiPlay size={18} /> {t('parserConsole.startBtn')} ({selectedCount})
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className={`${styles.customConsole} ${loading ? styles.liveConsole : ''}`}>
                {logs.length === 0 ? (
                    <div className={styles.placeholder}>{t('parserConsole.readyPlaceholder')}</div>
                ) : (
                    <>
                        {logs.map((log, index) => (
                            <div key={index} className={`${styles.logLine} ${
                                log.msg.includes('❌') ? styles.logError : 
                                log.msg.includes('✅') ? styles.logSuccess : ''
                            }`}>
                                <span className={styles.logTime}>[{log.time}]</span> {log.msg}
                            </div>
                        ))}
                        <div ref={consoleEndRef} />
                    </>
                )}
            </div>
        </div>
    );
}