import React, { useMemo } from 'react';
import { FaRobot, FaPowerOff, FaHistory, FaTools, FaUser } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useAdmin } from '../../hooks/AdminContext'; 
import { useAiLogs } from './useAiLogs';

export default function AiLogsTab() {
    const { t } = useTranslation('adminAi');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const { aiEnabled, logs, loading, saving, toggleAi, fetchData } = useAiLogs(isSuperAdmin);

    const columns = useMemo(() => [
        { 
            header: t('aiLogsTab.colTime'), 
            render: (log) => <span className="whitespace-nowrap text-textMuted text-[0.85rem] font-medium">{new Date(log.created_at).toLocaleString('uk-UA')}</span> 
        },
        { 
            header: t('aiLogsTab.colType'), 
            render: (log) => log.log_type === 'system' 
                ? <Badge variant="danger" icon={FaTools}>{t('aiLogsTab.typeSystem')}</Badge> 
                : <Badge variant="success" icon={FaRobot}>{t('aiLogsTab.typeChat')}</Badge>
        },
        { 
            header: t('aiLogsTab.colUser'), 
            render: (log) => (
                <div className="flex items-center gap-2 text-textMain font-semibold text-[0.9rem]">
                    <div className="w-6 h-6 rounded-full bg-main border border-border flex items-center justify-center"><FaUser className="text-textMuted text-[0.7rem]" /></div>
                    <span>{log.user_email || t('aiLogsTab.unknownUser')}</span>
                </div>
            )
        },
        { 
            header: t('aiLogsTab.colDetails'), 
            render: (log) => log.log_type === 'system' ? (
                <Badge variant={log.system_action === 'enabled_ai' ? "success" : "danger"}>
                    {log.system_action === 'enabled_ai' ? t('aiLogsTab.aiEnabled') : t('aiLogsTab.aiDisabled')}
                </Badge>
            ) : (
                <div className="max-w-[500px] flex flex-col gap-3 py-1">
                    <div className="bg-main px-3 py-2 rounded-lg rounded-tl-sm text-textMain text-[0.85rem] font-medium leading-relaxed w-fit max-w-[90%] relative">
                        {log.prompt}
                    </div>
                    <div className="bg-surface border border-border px-3 py-2 rounded-lg rounded-bl-sm text-textMuted text-[0.85rem] leading-relaxed w-fit max-w-[90%] shadow-sm self-start">
                        {log.response?.substring(0, 100)}...
                    </div>
                </div>
            ) 
        }
    ], [t]);

    if (loading && logs.length === 0) {
        return (
            <div className="py-20 px-5 text-[1.1rem] text-primary text-center font-bold flex flex-col items-center gap-5 bg-surface rounded-lg border border-border shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                <div>{t('aiLogsTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-6 rounded-lg flex justify-between items-center shadow-sm border border-border flex-wrap gap-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/5 rounded-xl flex items-center justify-center border border-blue-500/10">
                        <FaRobot className="text-[1.5rem] text-primary" />
                    </div>
                    <div>
                        <h3 className="m-0 text-textMain text-[1.2rem] font-bold tracking-tight">{t('aiLogsTab.globalStatus')}</h3>
                        <p className="m-0 mt-1 text-textMuted text-[0.85rem] font-medium">{t('aiLogsTab.globalDesc')}</p>
                    </div>
                </div>
                {isSuperAdmin && (
                    <Button 
                        variant={aiEnabled ? 'danger' : 'primary'}
                        onClick={toggleAi} 
                        disabled={saving}
                        className="w-full md:w-auto"
                    >
                        <FaPowerOff />
                        {saving ? t('aiLogsTab.processing') : (aiEnabled ? t('aiLogsTab.turnOff') : t('aiLogsTab.turnOn'))}
                    </Button>
                )}
            </div>

            <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 px-6 bg-main border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface border border-border text-textMuted rounded-md flex items-center justify-center text-[1rem] shadow-sm">
                            <FaHistory />
                        </div>
                        <h3 className="m-0 text-textMain text-[1.1rem] font-bold">{t('aiLogsTab.historyTitle')}</h3>
                    </div>
                    <Button variant="cancel" onClick={fetchData} className="!py-2 !px-4 !text-[0.85rem]">
                        {t('aiLogsTab.refresh')}
                    </Button>
                </div>

                <div className="flex-1">
                    <DataTable 
                        columns={columns} 
                        data={logs} 
                        emptyMessage={t('aiLogsTab.emptyHistory')}
                        rowClassName={(log) => log.log_type === 'system' ? 'bg-red-500/5' : ''}
                    />
                </div>
            </div>
        </div>
    );
}