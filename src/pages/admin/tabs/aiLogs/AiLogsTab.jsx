import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import styles from './AiLogsTab.module.css';
import { FaRobot, FaPowerOff, FaHistory, FaTools } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import uiStyles from '../../ui/AdminUI.module.css';
import { useAdmin } from '../../hooks/AdminContext'; 

export default function AiLogsTab() {
    const { t } = useTranslation('admin');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

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
        } finally {
            setLoading(false);
        }
    };

    const toggleAi = async () => {
        if (!isSuperAdmin) return; 
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

    const columns = [
        { header: t('aiLogsTab.colTime'), render: (log) => <span className={styles.timeCell}>{new Date(log.created_at).toLocaleString('uk-UA')}</span> },
        { 
            header: t('aiLogsTab.colType'), 
            render: (log) => log.log_type === 'system' 
                ? <span className={styles.badgeSystem}><FaTools/> {t('aiLogsTab.typeSystem')}</span> 
                : <span className={styles.badgeChat}>{t('aiLogsTab.typeChat')}</span>
        },
        { header: t('aiLogsTab.colUser'), render: (log) => <span className={styles.userCell}>{log.user_email || t('aiLogsTab.unknownUser')}</span> },
        { 
            header: t('aiLogsTab.colDetails'), 
            render: (log) => log.log_type === 'system' ? (
                <strong className={log.system_action === 'enabled_ai' ? styles.textSuccess : styles.textDanger}>
                    {log.system_action === 'enabled_ai' ? t('aiLogsTab.aiEnabled') : t('aiLogsTab.aiDisabled')}
                </strong>
            ) : (
                <div className={styles.detailsCell}>
                    <div className={styles.promptText}><strong style={{color: 'var(--primary)'}}>Q:</strong> {log.prompt}</div>
                    <div className={styles.responseText}><strong style={{color: 'var(--success)'}}>A:</strong> {log.response?.substring(0, 100)}...</div>
                </div>
            ) 
        }
    ];

    if (loading && logs.length === 0) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <div>{t('aiLogsTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.settingsCard}>
                <div className={styles.settingsInfo}>
                    <div className={styles.iconWrapper}>
                        <FaRobot className={styles.robotIcon} />
                    </div>
                    <div>
                        <h3 className={styles.cardTitle}>{t('aiLogsTab.globalStatus')}</h3>
                        <p className={styles.cardDesc}>{t('aiLogsTab.globalDesc')}</p>
                    </div>
                </div>
                {isSuperAdmin && (
                    <button 
                        onClick={toggleAi} 
                        disabled={saving}
                        className={`${uiStyles.btn} ${aiEnabled ? uiStyles.btnDanger : uiStyles.btnPrimary} ${styles.toggleBtn}`}
                    >
                        <FaPowerOff />
                        {saving ? t('aiLogsTab.processing') : (aiEnabled ? t('aiLogsTab.turnOff') : t('aiLogsTab.turnOn'))}
                    </button>
                )}
            </div>

            <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                    <div className={styles.historyTitleWrapper}>
                        <div className={styles.iconWrapperSmall}>
                            <FaHistory />
                        </div>
                        <h3 className={styles.historyTitle}>{t('aiLogsTab.historyTitle')}</h3>
                    </div>
                    <button onClick={fetchData} className={`${uiStyles.btn} ${uiStyles.btnCancel}`}>
                        {t('aiLogsTab.refresh')}
                    </button>
                </div>

                <div className={styles.tableWrapper}>
                    <DataTable 
                        columns={columns} 
                        data={logs} 
                        emptyMessage={t('aiLogsTab.emptyHistory')}
                        rowClassName={(log) => log.log_type === 'system' ? styles.systemRow : ''}
                    />
                </div>
            </div>
        </div>
    );
}