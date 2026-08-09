import { useMemo } from 'react';
import { FaBug, FaLightbulb, FaEnvelope, FaImage, FaExternalLinkAlt, FaExclamationTriangle, FaTrash, FaComments, FaSyncAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { Badge } from '../../ui/Badge';
import { CustomSelect, SelectOption } from '../../ui/CustomSelect';
import { useAdmin } from '../../hooks/AdminContext';
import { useFeedback } from './useFeedback';

export default function FeedbackTab() {
    const { t } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const { loading, filter, setFilter, filteredMessages, handleDelete, handleStatusChange, refetch } = useFeedback(isSuperAdmin);

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'critical': return { icon: FaExclamationTriangle, label: t('admin_feedback.types.critical'), variant: 'danger' };
            case 'data_error': return { icon: FaBug, label: t('admin_feedback.types.data_error'), variant: 'warning' };
            case 'ui_bug': return { icon: FaBug, label: t('admin_feedback.types.ui_bug'), variant: 'purple' };
            case 'suggestion': return { icon: FaLightbulb, label: t('admin_feedback.types.suggestion'), variant: 'success' };
            case 'contact': return { icon: FaEnvelope, label: t('admin_feedback.types.contact'), variant: 'primary' };
            default: return { icon: FaEnvelope, label: type || t('admin_feedback.types.other'), variant: 'default' };
        }
    };

    const statusOptions: SelectOption[] = [
        { 
            value: 'new', 
            label: t('admin_feedback.status.new'),
            colorClass: 'bg-blue-500/10 text-primary border-blue-500/30'
        },
        { 
            value: 'in_progress', 
            label: t('admin_feedback.status.in_progress'),
            colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30'
        },
        { 
            value: 'resolved', 
            label: t('admin_feedback.status.resolved'),
            colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
        }
    ];

    const columns = useMemo(() => [
        {
            header: t('admin_feedback.tab.col_date'),
            render: (msg: any) => (
                <div className="flex flex-col text-[11px] font-mono text-textMuted whitespace-nowrap">
                    <span>{new Date(msg.created_at).toLocaleDateString('uk-UA')}</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            header: t('admin_feedback.tab.col_user'),
            render: (msg: any) => {
                const typeConfig = getTypeConfig(msg.type);
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-textMain text-xs truncate max-w-[180px]" title={msg.email || msg.user_email}>
                            {msg.email || msg.user_email || t('admin_feedback.tab.anonymous')}
                        </span>
                        {msg.name && <span className="text-[10px] text-textMuted truncate max-w-[180px]">{msg.name}</span>}
                        <Badge variant={typeConfig.variant} icon={typeConfig.icon}>
                            {typeConfig.label}
                        </Badge>
                    </div>
                );
            }
        },
        {
            header: t('admin_feedback.tab.col_message'),
            render: (msg: any) => (
                <div className="max-w-md flex flex-col gap-1.5">
                    <p className="text-xs text-textMain leading-relaxed m-0 p-2 bg-main rounded border border-border whitespace-pre-wrap break-words">
                        {msg.message}
                    </p>
                    <div className="flex gap-2 flex-wrap items-center">
                        {msg.screenshot_url && (
                            <a href={msg.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 py-0.5 px-2 bg-primary-subtle text-primary border border-primary/20 rounded text-[11px] font-medium no-underline hover:underline">
                                <FaImage className="text-[10px]" /> {t('admin_feedback.tab.screenshot_btn')}
                            </a>
                        )}
                        {msg.page_url && (
                            <a href={msg.page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 py-0.5 px-2 bg-main border border-border text-textMuted rounded text-[11px] no-underline hover:text-textMain truncate max-w-[150px]" title={msg.page_url}>
                                <FaExternalLinkAlt className="text-[10px]" /> URL
                            </a>
                        )}
                        {msg.screen_size && (
                            <span className="text-[10px] font-mono text-textMuted bg-surface border border-border px-1.5 py-0.5 rounded" title={msg.browser_info}>
                                {msg.screen_size}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: t('admin_feedback.tab.col_status'),
            render: (msg: any) => (
                <div className="w-32">
                    <CustomSelect
                        options={statusOptions}
                        value={msg.status || 'new'}
                        onChange={(newVal) => handleStatusChange(msg.id, newVal)}
                        size="sm"
                    />
                </div>
            )
        },
        ...(isSuperAdmin ? [{
            header: '',
            render: (msg: any) => (
                <div className="flex justify-end">
                    <button
                        className="p-1.5 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
                        onClick={() => handleDelete(msg.id, msg.screenshot_url)}
                        title={t('admin_feedback.tab.delete_title')}
                    >
                        <FaTrash className="text-xs" />
                    </button>
                </div>
            )
        }] : [])
    ], [t, handleStatusChange, handleDelete, isSuperAdmin]);

    const getFilterClass = (filterName: string) => 
        `px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            filter === filterName 
                ? 'bg-primary text-white shadow-subtle' 
                : 'text-textMuted hover:text-textMain'
        }`;

    if (loading) {
        return (
            <div className="py-16 text-xs text-textMuted flex flex-col items-center gap-2 bg-surface rounded-xl border border-border">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                <div>{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-main text-primary rounded-lg border border-border flex items-center justify-center text-sm">
                        <FaComments />
                    </div>
                    <div>
                        <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">
                            {t('admin_feedback.tab.title')}
                        </h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5">
                            {t('admin_feedback.tab.subtitle')} ({filteredMessages.length})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex gap-1 bg-surface p-1 rounded-lg border border-border">
                        <button className={getFilterClass('all')} onClick={() => setFilter('all')}>{t('admin_feedback.tab.filter_all')}</button>
                        <button className={getFilterClass('bug')} onClick={() => setFilter('bug')}>{t('admin_feedback.tab.filter_bugs')}</button>
                        <button className={getFilterClass('suggestion')} onClick={() => setFilter('suggestion')}>{t('admin_feedback.tab.filter_suggestions')}</button>
                        <button className={getFilterClass('contact')} onClick={() => setFilter('contact')}>{t('admin_feedback.tab.filter_contacts')}</button>
                    </div>

                    <button
                        onClick={() => refetch()}
                        className="p-2 text-textMuted hover:text-textMain bg-surface border border-border rounded-lg transition-colors"
                        title={t('common.refresh')}
                    >
                        <FaSyncAlt className="text-xs" />
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredMessages}
                    emptyMessage={t('admin_feedback.tab.empty_state')}
                    rowClassName={(msg: any) => msg.status === 'resolved' ? 'opacity-60 transition-opacity hover:opacity-100' : ''}
                />
            </div>
        </div>
    );
}