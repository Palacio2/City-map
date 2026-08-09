import { useMemo } from 'react';
import { FaHistory, FaSyncAlt, FaUserShield } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useTranslation } from 'react-i18next';
import { useAuditLogs, AuditLogItem } from './useAuditLogs';

export default function AuditLogsTab() {
    const { t, i18n } = useTranslation('db');
    const { logs, loading, adminMap, fetchLogs } = useAuditLogs();

    const getActionBadge = (action: string) => {
        let variant: 'primary' | 'success' | 'danger' | 'warning' | 'purple' | 'default' = 'primary';
        if (action.includes('GRANT') || action.includes('CREATE')) variant = 'success';
        if (action.includes('DELETE') || action.includes('REMOVE')) variant = 'danger';
        if (action.includes('UPDATE')) variant = 'warning';
        return <Badge variant={variant}>{action}</Badge>;
    };

    const formatDetails = (newData: any) => {
        if (!newData) return '-';
        try {
            if (newData.value && Array.isArray(newData.value)) {
                return t('admin_audit.tab.assigned_items', { count: newData.value.length, defaultValue: `Призначено елементів: ${newData.value.length}` });
            }
            if (newData.plan) {
                return t('admin_audit.tab.plan_details', { plan: newData.plan, days: newData.days, defaultValue: `План: ${newData.plan} (${newData.days} дн.)` });
            }
            if (newData.code) {
                return t('admin_audit.tab.code_details', { code: newData.code, discount: newData.percent_off, defaultValue: `Промокод: ${newData.code} (${newData.percent_off}%)` });
            }
            if (newData.role) {
                return t('admin_audit.tab.role_details', { role: newData.role, defaultValue: `Роль: ${newData.role}` });
            }
            return typeof newData === 'object' ? JSON.stringify(newData) : String(newData);
        } catch (e) {
            return String(newData);
        }
    };

    const columns = useMemo(() => [
        {
            header: t('admin_audit.tab.col_admin'),
            render: (log: AuditLogItem) => (
                <div className="flex items-center gap-1.5 text-textMain text-xs font-medium">
                    <FaUserShield className="text-textMuted text-[10px]" />
                    <span className="truncate max-w-[200px]" title={log.admin_id ? (adminMap[log.admin_id] || log.admin_id) : t('admin_audit.tab.system')}>
                        {log.admin_id ? (adminMap[log.admin_id] || log.admin_id) : t('admin_audit.tab.system')}
                    </span>
                </div>
            )
        },
        {
            header: t('admin_audit.tab.col_action'),
            render: (log: AuditLogItem) => getActionBadge(log.action || 'UNKNOWN')
        },
        {
            header: t('admin_audit.tab.col_target', 'ОБ\'ЄКТ'),
            render: (log: AuditLogItem) => (
                <span className="font-mono text-xs text-textMain uppercase tracking-wide bg-main border border-border px-1.5 py-0.5 rounded">
                    {log.target_table || 'system'}
                </span>
            )
        },
        {
            header: t('admin_audit.tab.col_details'),
            render: (log: AuditLogItem) => (
                <span className="text-xs font-normal text-textMuted max-w-md truncate block" title={formatDetails(log.new_data)}>
                    {formatDetails(log.new_data)}
                </span>
            )
        },
        {
            header: t('admin_audit.tab.col_date'),
            render: (log: AuditLogItem) => (
                <span className="text-textMuted font-mono text-[11px] whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US') : '-'}
                </span>
            )
        }
    ], [t, adminMap, i18n.language]);

    if (loading && logs.length === 0) {
        return (
            <div className="py-16 text-xs text-textMuted flex flex-col items-center gap-2 bg-surface rounded-xl border border-border">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                <div>{t('admin_audit.tab.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 w-full">

            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-main text-warning rounded-lg border border-border flex items-center justify-center text-sm">
                        <FaHistory />
                    </div>
                    <div>
                        <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">
                            {t('admin_audit.tab.title')}
                        </h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5">
                            {t('admin_audit.tab.subtitle')} ({logs.length})
                        </p>
                    </div>
                </div>

                <Button variant="cancel" size="sm" onClick={() => fetchLogs()} disabled={loading}>
                    <FaSyncAlt className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                    <span>{t('admin_audit.tab.refresh')}</span>
                </Button>
            </div>


            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
                <DataTable
                    columns={columns}
                    data={logs}
                    emptyMessage={t('admin_audit.tab.empty')}
                />
            </div>
        </div>
    );
}