import React, { useMemo } from 'react';
import { FaHistory, FaSync, FaUserSecret } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from './useAuditLogs';

export default function AuditLogsTab() {
    const { t } = useTranslation('db');
    const { logs, loading, adminMap, fetchLogs } = useAuditLogs();

    const getActionBadge = (action) => {
        let variant = "primary"; 
        if (action.includes('GRANT') || action.includes('CREATE')) variant = "success"; 
        if (action.includes('DELETE') || action.includes('REMOVE')) variant = "danger"; 
        if (action.includes('UPDATE')) variant = "warning"; 

        return <Badge variant={variant}>{action}</Badge>;
    };

    const formatDetails = (newData) => {
        if (!newData) return '-';
        try {
            if (newData.value && Array.isArray(newData.value)) {
                return t('admin_audit.tab.assigned_items', { count: newData.value.length });
            }
            if (newData.plan) {
                return t('admin_audit.tab.plan_details', { plan: newData.plan, days: newData.days });
            }
            if (newData.code) {
                return t('admin_audit.tab.code_details', { code: newData.code, discount: newData.percent_off });
            }
            if (newData.role) {
                return t('admin_audit.tab.role_details', { role: newData.role });
            }
            return typeof newData === 'object' ? JSON.stringify(newData) : String(newData);
        } catch (e) {
            return String(newData);
        }
    };

    const columns = useMemo(() => [
        { 
            header: t('admin_audit.tab.col_admin'), 
            render: (log) => (
                <div className="flex items-center gap-2">
                    <span className="bg-main border border-border px-2 py-1 rounded-md text-[0.8rem] font-bold text-textMuted flex items-center gap-2">
                        <FaUserSecret className="text-primary"/> {adminMap[log.admin_id] || log.admin_id}
                    </span>
                </div>
            )
        },
        { 
            header: t('admin_audit.tab.col_action'), 
            render: (log) => getActionBadge(log.action)
        },
        { 
            header: t('admin_audit.tab.col_target'), 
            render: (log) => <span className="font-extrabold text-textMain text-[0.9rem] uppercase tracking-wide">{log.target_table}</span> 
        },
        { 
            header: t('admin_audit.tab.col_details'), 
            render: (log) => <span className="text-[0.85rem] font-medium text-textMuted max-w-[250px] truncate block" title={formatDetails(log.new_data)}>{formatDetails(log.new_data)}</span> 
        },
        { 
            header: t('admin_audit.tab.col_date'), 
            render: (log) => <span className="text-[0.85rem] font-bold text-textMuted bg-main px-2 py-1 rounded-md border border-border">{new Date(log.created_at).toLocaleString()}</span> 
        }
    ], [t, adminMap]);

    if (loading) {
        return (
            <div className="py-20 px-5 text-[1.1rem] text-primary font-bold flex flex-col items-center gap-4 bg-surface rounded-2xl border border-border shadow-sm animate-[fadeIn_0.3s_ease-out]">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                <div>{t('admin_audit.tab.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex justify-between items-center flex-wrap gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-amber-500/10 text-[#d97706] rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                        <FaHistory className="text-[1.5rem]" />
                    </div>
                    <div>
                        <h2 className="m-0 text-textMain text-[1.5rem] font-extrabold tracking-tight">{t('admin_audit.tab.title')}</h2>
                        <p className="m-0 text-textMuted text-[0.95rem] font-medium">{t('admin_audit.tab.subtitle')}</p>
                    </div>
                </div>
                <Button variant="primary" onClick={fetchLogs} className="w-full md:w-auto !py-2.5 !px-6 shadow-md relative z-10">
                    <FaSync className="mr-2" /> {t('admin_audit.tab.refresh')}
                </Button>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={logs} 
                    emptyMessage={t('admin_audit.tab.empty')} 
                />
            </div>
        </div>
    );
}