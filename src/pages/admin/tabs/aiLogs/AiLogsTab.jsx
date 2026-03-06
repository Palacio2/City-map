import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import styles from './AiLogsTab.module.css';
import { FaRobot, FaPowerOff, FaHistory, FaTools } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function AiLogsTab() {
    const { t } = useTranslation('admin');
    const [aiEnabled, setAiEnabled] = useState(true);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: dbLogs } = await supabase
                .from('ai_system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (dbLogs) {
                setLogs(dbLogs);
                const lastSystemLog = dbLogs.find(l => l.log_type === 'system');
                if (lastSystemLog) {
                    setAiEnabled(lastSystemLog.system_action === 'enabled_ai');
                }
            }
        } catch {
            // 
        } finally {
            setLoading(false);
        }
    };

    const toggleAi = async () => {
        if (!window.confirm(t('aiLogsTab.confirmToggle'))) return;
        
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const newAction = aiEnabled ? 'disabled_ai' : 'enabled_ai';
            
            const { error } = await supabase.from('ai_system_logs').insert({
                user_id: user.id,
                user_email: user.email,
                log_type: 'system',
                system_action: newAction
            });

            if (error) throw error;
            setAiEnabled(!aiEnabled);
            fetchData();
        } catch {
            alert(t('aiLogsTab.saveError'));
        } finally {
            setSaving(false);
        }
    };

    if (loading && logs.length === 0) return <div className={styles.loader}>{t('aiLogsTab.loading')}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.settingsCard}>
                <div className={styles.settingsInfo}>
                    <FaRobot className={styles.robotIcon} />
                    <div>
                        <h3>{t('aiLogsTab.globalStatus')}</h3>
                        <p>{t('aiLogsTab.globalDesc')}</p>
                    </div>
                </div>
                <button 
                    onClick={toggleAi} 
                    disabled={saving}
                    className={`${styles.toggleBtn} ${aiEnabled ? styles.btnOff : styles.btnOn}`}
                >
                    <FaPowerOff />
                    {saving ? t('aiLogsTab.processing') : (aiEnabled ? t('aiLogsTab.turnOff') : t('aiLogsTab.turnOn'))}
                </button>
            </div>

            <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                    <FaHistory />
                    <h3>{t('aiLogsTab.historyTitle')}</h3>
                    <button onClick={fetchData} className={styles.refreshBtn}>{t('aiLogsTab.refresh')}</button>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t('aiLogsTab.colTime')}</th>
                                <th>{t('aiLogsTab.colType')}</th>
                                <th>{t('aiLogsTab.colUser')}</th>
                                <th>{t('aiLogsTab.colDetails')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className={log.log_type === 'system' ? styles.systemRow : ''}>
                                    <td className={styles.timeCell}>
                                        {new Date(log.created_at).toLocaleString('uk-UA')}
                                    </td>
                                    <td>
                                        {log.log_type === 'system' 
                                            ? <span className={styles.badgeSystem}><FaTools/> {t('aiLogsTab.typeSystem')}</span> 
                                            : <span className={styles.badgeChat}>{t('aiLogsTab.typeChat')}</span>}
                                    </td>
                                    <td>{log.user_email || t('aiLogsTab.unknownUser')}</td>
                                    <td className={styles.detailsCell}>
                                        {log.log_type === 'system' ? (
                                            <strong>{log.system_action === 'enabled_ai' ? t('aiLogsTab.aiEnabled') : t('aiLogsTab.aiDisabled')}</strong>
                                        ) : (
                                            <>
                                                <div className={styles.promptText}><strong>Q:</strong> {log.prompt}</div>
                                                <div className={styles.responseText}><strong>A:</strong> {log.response?.substring(0, 100)}...</div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan="4" className={styles.empty}>{t('aiLogsTab.emptyHistory')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}