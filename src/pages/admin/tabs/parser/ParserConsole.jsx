import React, { useEffect, useRef, useMemo } from 'react';
import styles from './ParserConsole.module.css';
import uiStyles from '../../ui/AdminUI.module.css';
import { FiTrash2, FiDownload, FiPlay, FiLoader } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const ParserConsole = ({ logs = [], loading, onClear, onDownload, onStartClick, isStartDisabled, selectedCount }) => {
    const { t } = useTranslation('admin');
    const consoleEndRef = useRef(null);

    // ОПТИМІЗАЦІЯ: Мемоізація сортування логів
    const sortedLogs = useMemo(() => {
        return [...logs].sort((a, b) => {
            if (!a.time || !b.time) return 0;
            return a.time.localeCompare(b.time);
        });
    }, [logs]);

    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [sortedLogs]);

    const renderLogMessage = (rawMsg) => {
        if (!rawMsg) return { header: '', message: '' };

        const lastBracketIndex = rawMsg.lastIndexOf(']');
        
        if (lastBracketIndex !== -1) {
            const header = rawMsg.substring(0, lastBracketIndex + 1);
            const body = rawMsg.substring(lastBracketIndex + 1).trim();

            let translatedBody = body;
            // Проста перевірка на локалізацію логів, якщо вони йдуть в форматі "logs.something"
            if (body.startsWith('logs.')) {
                const [key, ...params] = body.split('|');
                const paramObj = {};
                params.forEach(p => {
                    const [k, v] = p.split(':');
                    if (k && v) paramObj[k] = v;
                });
                translatedBody = t(key, paramObj);
            }

            return { header, message: translatedBody };
        }
        
        return { header: '', message: rawMsg };
    };

    return (
        <div className={styles.consoleSection}>
            <div className={styles.consoleTopRow}>
                <div className={styles.headerLeft}>
                    <div className={styles.stepHeader}>
                        <FiPlay className={styles.stepIcon} style={{ color: 'var(--primary)' }} />
                        <h3 className={styles.consoleTitle}>{t('parserConsole.title', {defaultValue: 'Parser Console'})}</h3>
                    </div>
                    {loading && (
                        <div className={styles.liveIndicator}>
                            <FiLoader className={styles.spinner} />
                            <span>{t('parserConsole.parsing', {defaultValue: 'Parsing in progress...'})}</span>
                        </div>
                    )}
                </div>
                
                <div className={styles.consoleActions}>
                    <button onClick={onClear} className={`${uiStyles.btn} ${styles.actionBtn}`} title="Clear Logs">
                        <FiTrash2 /> {t('parserConsole.clear')}
                    </button>
                    <button onClick={onDownload} className={`${uiStyles.btn} ${styles.actionBtn}`} title="Download Logs">
                        <FiDownload /> {t('parserConsole.download')}
                    </button>
                    <button 
                        onClick={onStartClick} 
                        disabled={isStartDisabled || loading} 
                        className={`${uiStyles.btn} ${uiStyles.btnPrimary} ${styles.startBtn}`}
                    >
                        {loading ? <FiLoader className={styles.spinner}/> : <FiPlay />}
                        {t('parserConsole.startParsing')} ({selectedCount})
                    </button>
                </div>
            </div>
            
            <div className={styles.customConsole}>
                {sortedLogs.length === 0 ? (
                    <div className={styles.placeholder}>{t('parserConsole.readyPlaceholder')}</div>
                ) : (
                    <div className={styles.logContainer}>
                        {sortedLogs.map((log, index) => {
                            const { header, message } = renderLogMessage(log.msg);
                            const isError = log.msg.includes('[ERROR]');
                            const isSuccess = log.msg.includes('[SUCCESS]');
                            const isWarning = log.msg.includes('[WARNING]');

                            return (
                                <div key={index} className={`${styles.logLine} ${
                                    isError ? styles.logError : 
                                    isSuccess ? styles.logSuccess : 
                                    isWarning ? styles.logWarning : ''
                                }`}>
                                    <span className={styles.logTime}>[{log.time}]</span>
                                    <span className={styles.logHeader}>{header}</span>
                                    <span className={styles.logBody}>{message}</span>
                                </div>
                            );
                        })}
                        <div ref={consoleEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ParserConsole);