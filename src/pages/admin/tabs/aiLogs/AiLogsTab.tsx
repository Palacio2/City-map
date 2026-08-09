import { useState, useMemo } from 'react';
import { FaRobot, FaPowerOff, FaTools, FaUser, FaSyncAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useAdmin } from '../../hooks/AdminContext';
import { useAiLogs, AiLogItem } from './useAiLogs';

export default function AiLogsTab() {
    const { t, i18n } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const [activeFilter, setActiveFilter] = useState<'all' | 'system' | 'chat'>('all');
    const { aiEnabled, logs, loading, saving, toggleAi, fetchData } = useAiLogs(isSuperAdmin);

    const filteredLogs = useMemo(() => {
        if (activeFilter === 'all') return logs;
        return logs.filter((log: AiLogItem) => log.log_type === activeFilter);
    }, [logs, activeFilter]);

    const columns = useMemo(() => [
        {
            header: t('admin_ai.tab.col_time'),
            render: (log: AiLogItem) => (
                <span className="whitespace-nowrap text-textMuted text-[11px] font-mono">
                    {log.created_at ? new Date(log.created_at).toLocaleString(i18n.language === 'uk' ? 'uk-UA' : i18n.language) : '-'}
                </span>
            )
        },
        {
            header: t('admin_ai.tab.col_type'),
            render: (log: AiLogItem) => log.log_type === 'system'
                ? <Badge variant="danger" icon={FaTools}>{t('admin_ai.tab.type_system')}</Badge>
                : <Badge variant="success" icon={FaRobot}>{t('admin_ai.tab.type_chat')}</Badge>
        },
        {
            header: t('admin_ai.tab.col_user'),
            render: (log: AiLogItem) => (
                <div className="flex items-center gap-1.5 text-textMain text-xs font-medium">
                    <FaUser className="text-textMuted text-[10px]" />
                    <span className="truncate max-w-[180px]" title={log.user_email || ''}>
                        {log.user_email || t('admin_ai.tab.unknown_user')}
                    </span>
                </div>
            )
        },
        {
            header: t('admin_ai.tab.col_details'),
            render: (log: AiLogItem) => log.log_type === 'system' ? (
                <Badge variant={log.system_action === 'enabled_ai' ? "success" : "danger"}>
                    {log.system_action === 'enabled_ai' ? t('admin_ai.tab.ai_enabled') : t('admin_ai.tab.ai_disabled')}
                </Badge>
            ) : (
                <div className="max-w-xl flex flex-col gap-1.5 py-1">
                    {log.prompt && (
                        <div className="bg-main px-3 py-2 rounded-lg border border-border text-textMain text-xs leading-relaxed font-normal">
                            <span className="text-[10px] text-textMuted uppercase font-mono block mb-0.5">{t('admin_ai.tab.prompt')}:</span>
                            {log.prompt}
                        </div>
                    )}
                    {log.response && (
                        <div className="bg-surface border border-border px-3 py-2 rounded-lg text-textMuted text-xs leading-relaxed">
                            <span className="text-[10px] text-primary uppercase font-mono block mb-0.5">{t('admin_ai.tab.response')}:</span>
                            {log.response.length > 180 ? `${log.response.substring(0, 180)}...` : log.response}
                        </div>
                    )}
                </div>
            )
        }
    ], [t, i18n.language]);

    const getFilterClass = (filterName: 'all' | 'system' | 'chat') => 
        `px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            activeFilter === filterName 
                ? 'bg-primary text-white shadow-subtle' 
                : 'text-textMuted hover:text-textMain'
        }`;

    if (loading && logs.length === 0) {
        return (
            <div className="py-16 text-xs text-textMuted flex flex-col items-center gap-2 bg-surface rounded-xl border border-border">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                <div>{t('admin_ai.tab.loading_logs')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 w-full">
            
            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-main text-primary rounded-lg border border-border flex items-center justify-center text-sm">
                        <FaRobot />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">
                                {t('admin_ai.tab.global_status')}
                            </h2>
                            <Badge variant={aiEnabled ? 'success' : 'danger'}>
                                {aiEnabled ? t('admin_ai.tab.status_active') : t('admin_ai.tab.status_disabled')}
                            </Badge>
                        </div>
                        <p className="m-0 text-textMuted text-xs mt-0.5">
                            {t('admin_ai.tab.global_desc')}
                        </p>
                    </div>
                </div>

                {isSuperAdmin && (
                    <Button
                        variant={aiEnabled ? 'danger' : 'primary'}
                        size="sm"
                        onClick={toggleAi}
                        disabled={saving}
                    >
                        <FaPowerOff className="text-xs" />
                        <span>
                            {saving ? t('admin_ai.tab.processing') : (aiEnabled ? t('admin_ai.tab.turn_off') : t('admin_ai.tab.turn_on'))}
                        </span>
                    </Button>
                )}
            </div>

            
            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border bg-main/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="flex gap-1 bg-surface p-1 rounded-lg border border-border">
                        <button className={getFilterClass('all')} onClick={() => setActiveFilter('all')}>
                            {t('admin_ai.tab.filter_all')}
                        </button>
                        <button className={getFilterClass('system')} onClick={() => setActiveFilter('system')}>
                            {t('admin_ai.tab.filter_system')}
                        </button>
                        <button className={getFilterClass('chat')} onClick={() => setActiveFilter('chat')}>
                            {t('admin_ai.tab.filter_chat')}
                        </button>
                    </div>

                    <button
                        onClick={() => fetchData()}
                        className="p-2 text-textMuted hover:text-textMain bg-surface border border-border rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                        title={t('common.refresh')}
                    >
                        <FaSyncAlt className="text-xs" />
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredLogs}
                    emptyMessage={t('admin_ai.tab.empty_history')}
                />
            </div>
        </div>
    );
}