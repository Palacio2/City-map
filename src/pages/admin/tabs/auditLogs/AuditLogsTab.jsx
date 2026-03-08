import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { adminUsersAPI } from '@api/adminUsersAPI';
import { FaHistory, FaUserSecret, FaSync, FaCodeBranch } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import uiStyles from '../../ui/AdminUI.module.css';
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
        let color = '#3b82f6'; 
        if (action.includes('GRANT') || action.includes('CREATE')) color = '#10b981'; 
        if (action.includes('DELETE') || action.includes('REMOVE')) color = '#ef4444'; 
        if (action.includes('UPDATE')) color = '#f59e0b'; 

        return (
            <span style={{
                background: `${color}20`, color: color, padding: '4px 8px',
                borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.5px'
            }}>
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
            return JSON.stringify(newData).substring(0, 50) + '...';
        } catch {
            return t('auditLogsTab.complexData');
        }
    };

    const columns = useMemo(() => [
        { header: t('auditLogsTab.colTime'), render: (log) => <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString('uk-UA')}</span> },
        { header: t('auditLogsTab.colAdmin'), render: (log) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUserSecret style={{ color: 'var(--primary)' }} />
                <strong>{adminMap[log.admin_id] || log.admin_id?.substring(0,8) || t('auditLogsTab.systemUser')}</strong>
            </div>
        )},
        { header: t('auditLogsTab.colAction'), render: (log) => getActionBadge(log.action) },
        { header: t('auditLogsTab.colTarget'), render: (log) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <FaCodeBranch /> {log.target_table || '-'}
            </span>
        )},
        { header: t('auditLogsTab.colDetails'), render: (log) => <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--bg-main)', padding: '4px 8px', borderRadius: '4px' }}>{formatDetails(log.new_data)}</span> }
    ], [adminMap, t]); // Додано t та adminMap в залежності

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                        <FaHistory style={{ color: 'var(--primary)' }} /> {t('auditLogsTab.title')}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {t('auditLogsTab.subtitle')}
                    </p>
                </div>
                <button onClick={fetchLogs} className={`${uiStyles.btn} ${uiStyles.btnCancel}`}>
                    <FaSync /> {t('auditLogsTab.refresh')}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('auditLogsTab.loading')}</div>
            ) : (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <DataTable columns={columns} data={logs} emptyMessage={t('auditLogsTab.empty')} />
                </div>
            )}
        </div>
    );
}