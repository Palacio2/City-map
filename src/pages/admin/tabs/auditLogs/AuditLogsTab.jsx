import React, { useMemo } from 'react';
import { FaHistory, FaUserSecret, FaSync, FaCodeBranch } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from './useAuditLogs';

export default function AuditLogsTab() {
    const { t } = useTranslation('adminAudit');
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
            render: (log) => <span className="text-textMuted text-[0.85rem] font-medium whitespace-nowrap">{new Date(log.created_at).toLocaleString('uk-UA')}</span> 
        },
        { 
            header: t('auditLogsTab.colAdmin'), 
            render: (log) => (
                <div className="flex items-center gap-2 text-textMain font-semibold text-[0.9rem]">
                    <div className="w-6 h-6 rounded-full bg-main border border-border flex items-center justify-center"><FaUserSecret className="text-textMuted text-[0.8rem]" /></div>
                    <span>{adminMap[log.admin_id] || log.admin_id?.substring(0,8) || t('auditLogsTab.systemUser')}</span>
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
                <span className="flex items-center gap-1.5 text-[0.85rem] text-textMuted font-medium">
                    <FaCodeBranch className="opacity-50" /> {log.target_table || '-'}
                </span>
            )
        },
        { 
            header: t('auditLogsTab.colDetails'), 
            render: (log) => <span className="font-mono text-[0.8rem] text-textMuted block max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap" title={formatDetails(log.new_data)}>{formatDetails(log.new_data)}</span> 
        }
    ], [adminMap, t]); 

    if (loading && logs.length === 0) {
        return (
            <div className="py-20 px-5 text-[1.1rem] text-primary text-center font-bold flex flex-col items-center gap-5 bg-surface rounded-lg border border-border shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                <div>{t('auditLogsTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-5 px-6 rounded-lg border border-border shadow-sm flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-main rounded-lg flex items-center justify-center border border-border">
                        <FaHistory className="text-[1.2rem] text-textMuted" />
                    </div>
                    <div>
                        <h2 className="m-0 text-textMain text-[1.25rem] font-bold tracking-tight">{t('auditLogsTab.title')}</h2>
                        <p className="m-0 text-textMuted text-[0.85rem] font-medium">{t('auditLogsTab.subtitle')}</p>
                    </div>
                </div>
                <Button variant="cancel" onClick={fetchLogs} className="w-full md:w-auto !py-2 !px-4 !text-[0.85rem]">
                    <FaSync /> {t('auditLogsTab.refresh')}
                </Button>
            </div>

            <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={logs} 
                    emptyMessage={t('auditLogsTab.empty')} 
                />
            </div>
        </div>
    );
}