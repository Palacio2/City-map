import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { adminUsersAPI } from '@api/adminUsersAPI';
import { FaHistory, FaUserSecret, FaSync, FaCodeBranch } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import uiStyles from '../../ui/AdminUI.module.css';
import styles from './AuditLogsTab.module.css';
import { useTranslation } from 'react-i18next';

export default function AuditLogsTab() {
    const { t } = useTranslation('admin');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminMap, setAdminMap] = useState({});

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data: logsData, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            const usersData = await adminUsersAPI.getUsers();
            const users = usersData.users || [];
            
            const emailMap = {};
            users.forEach(u => {
                emailMap[u.id] = u.email;
            });
            
            setAdminMap(emailMap);
            setLogs(logsData || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action) => {
        let badgeClass = styles.badgeDefault; 
        if (action.includes('GRANT') || action.includes('CREATE')) badgeClass = styles.badgeSuccess; 
        if (action.includes('DELETE') || action.includes('REMOVE')) badgeClass = styles.badgeDanger; 
        if (action.includes('UPDATE')) badgeClass = styles.badgeWarning; 

        return (
            <span className={`${styles.actionBadge} ${badgeClass}`}>
                {action}
            </span>
        );
    };

    const formatDetails = (newData) => {
        if (!newData) return '-';
        try {
            if (newData.value && Array.isArray(newData.value)) return t('auditLogsTab.assignedItems', { count: newData.value.length });
            if (newData.plan) return t('auditLogsTab.planDetails', { plan: newData.plan, days: newData.days });
            if (newData.code) return t('auditLogsTab.codeDetails', { code: newData.code, discount: newData.percent_off });
            return JSON.stringify(newData).substring(0, 60) + '...';
        } catch {
            return t('auditLogsTab.complexData');
        }
    };

    const columns = useMemo(() => [
        { 
            header: t('auditLogsTab.colTime'), 
            render: (log) => <span className={styles.timeCell}>{new Date(log.created_at).toLocaleString('uk-UA')}</span> 
        },
        { 
            header: t('auditLogsTab.colAdmin'), 
            render: (log) => (
                <div className={styles.adminCell}>
                    <FaUserSecret className={styles.adminIcon} />
                    <strong>{adminMap[log.admin_id] || log.admin_id?.substring(0,8) || t('auditLogsTab.systemUser')}</strong>
                </div>
            )
        },
        { 
            header: t('auditLogsTab.colAction'), 
            render: (log) => getActionBadge(log.action) 
        },
        { 
            header: t('auditLogsTab.colTarget'), 
            render: (log) => (
                <span className={styles.targetCell}>
                    <FaCodeBranch /> {log.target_table || '-'}
                </span>
            )
        },
        { 
            header: t('auditLogsTab.colDetails'), 
            render: (log) => <span className={styles.detailsCell}>{formatDetails(log.new_data)}</span> 
        }
    ], [adminMap, t]); 

    if (loading && logs.length === 0) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <div>{t('auditLogsTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerCard}>
                <div className={styles.headerInfo}>
                    <div className={styles.iconWrapper}>
                        <FaHistory className={styles.headerIcon} />
                    </div>
                    <div>
                        <h2 className={styles.title}>{t('auditLogsTab.title')}</h2>
                        <p className={styles.subtitle}>{t('auditLogsTab.subtitle')}</p>
                    </div>
                </div>
                <button onClick={fetchLogs} className={`${uiStyles.btn} ${uiStyles.btnCancel} ${styles.refreshBtn}`}>
                    <FaSync /> {t('auditLogsTab.refresh')}
                </button>
            </div>

            <div className={styles.tableContainer}>
                <DataTable 
                    columns={columns} 
                    data={logs} 
                    emptyMessage={t('auditLogsTab.empty')} 
                />
            </div>
        </div>
    );
}