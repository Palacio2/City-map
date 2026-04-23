import React, { useMemo } from 'react';
import { FaRobot, FaPowerOff, FaHistory, FaTools, FaUser, FaSync } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useAdmin } from '../../hooks/AdminContext'; 
import { useAiLogs } from './useAiLogs';

export default function AiLogsTab() {
    const { t, i18n } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const { aiEnabled, logs, loading, saving, toggleAi, fetchData } = useAiLogs(isSuperAdmin);

    const columns = useMemo(() => [
        { 
            header: t('admin_ai.tab.col_time'), 
            render: (log) => (
                <span className="whitespace-nowrap text-textMuted text-[0.85rem] font-bold">
                    {new Date(log.created_at).toLocaleString(i18n.language === 'uk' ? 'uk-UA' : i18n.language)}
                </span>
            )
        },
        { 
            header: t('admin_ai.tab.col_type'), 
            render: (log) => log.log_type === 'system' 
                ? <Badge variant="danger" icon={FaTools}>{t('admin_ai.tab.type_system')}</Badge> 
                : <Badge variant="success" icon={FaRobot}>{t('admin_ai.tab.type_chat')}</Badge>
        },
        { 
            header: t('admin_ai.tab.col_user'), 
            render: (log) => (
                <div className="flex items-center gap-2 text-textMain font-bold text-[0.9rem]">
                    <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center shadow-sm">
                        <FaUser className="text-textMuted text-[0.7rem]" />
                    </div>
                    <span>{log.user_email || t('admin_ai.tab.unknown_user')}</span>
                </div>
            )
        },
        { 
            header: t('admin_ai.tab.col_details'), 
            render: (log) => log.log_type === 'system' ? (
                <Badge variant={log.system_action === 'enabled_ai' ? "success" : "danger"}>
                    {log.system_action === 'enabled_ai' ? t('admin_ai.tab.ai_enabled') : t('admin_ai.tab.ai_disabled')}
                </Badge>
            ) : (
                <div className="max-w-[500px] flex flex-col gap-2 py-1">
                    <div className="bg-main px-4 py-3 rounded-xl rounded-tl-sm border border-border shadow-inner text-textMain text-[0.85rem] font-medium leading-relaxed w-fit max-w-[90%]">
                        {log.prompt}
                    </div>
                    <div className="bg-surface border border-border px-4 py-3 rounded-xl rounded-bl-sm text-textMuted text-[0.85rem] leading-relaxed w-fit max-w-[90%] shadow-sm self-start">
                        {log.response?.substring(0, 150)}...
                    </div>
                </div>
            ) 
        }
    ], [t, i18n.language]);

    if (loading && logs.length === 0) {
        return (
            <div className="py-20 px-5 text-[1rem] text-textMuted font-medium flex flex-col items-center gap-4 bg-surface rounded-xl border border-border shadow-sm animate-[fadeIn_0.3s_ease-out]">
                <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin"></div>
                <div>{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            {/* Global Status Banner */}
            <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <FaRobot className="text-[1.5rem] text-primary" />
                    </div>
                    <div>
                        <h2 className="m-0 text-[1.5rem] text-textMain font-extrabold tracking-tight">
                            {t('admin_ai.tab.global_status')}
                        </h2>
                        <p className="m-0 mt-1 text-textMuted text-[0.95rem] font-medium">
                            {t('admin_ai.tab.global_desc')}
                        </p>
                    </div>
                </div>

                {isSuperAdmin && (
                    <Button 
                        variant={aiEnabled ? 'danger' : 'primary'}
                        onClick={toggleAi} 
                        disabled={saving}
                        className="w-full sm:w-auto relative z-10 shadow-md !px-6"
                    >
                        <FaPowerOff className="mr-2" />
                        {saving ? t('admin_ai.tab.processing') : (aiEnabled ? t('admin_ai.tab.turn_off') : t('admin_ai.tab.turn_on'))}
                    </Button>
                )}
            </div>

            {/* History Table */}
            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 px-6 bg-main/50 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface border border-border text-textMuted rounded-lg flex items-center justify-center text-[1rem] shadow-sm">
                            <FaHistory />
                        </div>
                        <h3 className="m-0 text-textMain text-[1.1rem] font-extrabold tracking-tight">
                            {t('admin_ai.tab.history_title')}
                        </h3>
                    </div>
                    <Button variant="cancel" onClick={fetchData} className="!py-2 !px-4 !text-[0.85rem]">
                        <FaSync className="mr-2" /> {t('admin_ai.tab.refresh')}
                    </Button>
                </div>

                <div className="flex-1">
                    <DataTable 
                        columns={columns} 
                        data={logs} 
                        emptyMessage={t('admin_ai.tab.empty_history')}
                        rowClassName={(log) => log.log_type === 'system' ? 'bg-red-500/5' : ''}
                    />
                </div>
            </div>
        </div>
    );
}