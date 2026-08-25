import React, { useMemo, useCallback, useState } from 'react';
import { FaBug, FaLightbulb, FaEnvelope, FaImage, FaExternalLinkAlt, FaExclamationTriangle, FaTrash, FaComments, FaSyncAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '@admin/core/ui/DataTable';
import { Pagination } from '@admin/core/ui/Pagination';
import { Badge } from '@admin/core/ui/Badge';
import { CustomSelect, SelectOption } from '@admin/core/ui/CustomSelect';
import { useFeedback } from '@admin/features/feedback/feedback/useFeedback';
import { useActionGuard } from '@admin/core/context/useActionGuard';

import { FeedbackMessage } from './types';

/** Prevents XSS via javascript: / data: URLs — only allows http(s) */
const safeUrl = (url: string): string => /^https?:\/\//i.test(url) ? url : '#';

export default function FeedbackTab() {
    const { t } = useTranslation('db');
    const { canDo } = useActionGuard();
    const canDelete = canDo('feedback.delete');
    const { loading, filter, setFilter, filteredMessages, handleDelete, handleStatusChange, refetch } = useFeedback(canDelete);

    const getTypeConfig = useCallback((type: string) => {
        switch (type) {
            case 'critical': return { icon: FaExclamationTriangle, label: t('admin_feedback.types.critical'), variant: 'danger' };
            case 'data_error': return { icon: FaBug, label: t('admin_feedback.types.data_error'), variant: 'warning' };
            case 'ui_bug': return { icon: FaBug, label: t('admin_feedback.types.ui_bug'), variant: 'purple' };
            case 'suggestion': return { icon: FaLightbulb, label: t('admin_feedback.types.suggestion'), variant: 'success' };
            case 'contact': return { icon: FaEnvelope, label: t('admin_feedback.types.contact'), variant: 'primary' };
            default: return { icon: FaEnvelope, label: type || t('admin_feedback.types.other'), variant: 'default' };
        }
    }, [t]);

    const statusOptions: SelectOption[] = useMemo(() => [
        {
            value: 'new',
            label: t('admin_feedback.status.new'),
            colorClass: 'bg-primary-subtle text-primary border-primary/30 font-bold'
        },
        {
            value: 'in_progress',
            label: t('admin_feedback.status.in_progress'),
            colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold'
        },
        {
            value: 'resolved',
            label: t('admin_feedback.status.resolved'),
            colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold'
        }
    ], [t]);

    const columns = useMemo(() => [
        {
            header: t('admin_feedback.tab.col_date'),
            render: (msg: FeedbackMessage) => (
                <div className="flex flex-col text-[11px] font-mono font-bold text-textMuted whitespace-nowrap">
                    <span>{new Date(msg.created_at).toLocaleDateString('uk-UA')}</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            header: t('admin_feedback.tab.col_user'),
            render: (msg: FeedbackMessage) => {
                const typeConfig = getTypeConfig(msg.type);
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-bold text-textMain text-xs truncate max-w-[180px]" title={msg.email || msg.user_email}>
                            {msg.email || msg.user_email || t('admin_feedback.tab.anonymous')}
                        </span>
                        {msg.name && <span className="text-[10px] text-textMuted font-medium truncate max-w-[180px]">{msg.name}</span>}
                        <Badge variant={typeConfig.variant as "primary" | "cancel" | "danger" | "success" | "warning"} icon={typeConfig.icon}>
                            {typeConfig.label}
                        </Badge>
                    </div>
                );
            }
        },
        {
            header: t('admin_feedback.tab.col_message'),
            render: (msg: FeedbackMessage) => (
                <div className="max-w-md flex flex-col gap-2">
                    <p className="text-xs text-textMain leading-relaxed m-0 p-2.5 bg-main/50 rounded-xl border border-border whitespace-pre-wrap break-words font-medium">
                        {msg.message}
                    </p>
                    <div className="flex gap-2 flex-wrap items-center">
                        {msg.screenshot_url && (
                            <a href={safeUrl(msg.screenshot_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-primary-subtle text-primary border border-primary/20 rounded-lg text-[11px] font-bold no-underline hover:underline">
                                <FaImage className="text-[10px]" /> {t('admin_feedback.tab.screenshot_btn')}
                            </a>
                        )}
                        {msg.page_url && (
                            <a href={safeUrl(msg.page_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-surface border border-border text-textMuted rounded-lg text-[11px] font-semibold no-underline hover:text-textMain truncate max-w-[150px]" title={msg.page_url}>
                                <FaExternalLinkAlt className="text-[10px]" /> URL
                            </a>
                        )}
                        {msg.screen_size && (
                            <span className="text-[10px] font-mono font-bold text-textMuted bg-surface border border-border px-2 py-0.5 rounded-md" title={msg.browser_info}>
                                {msg.screen_size}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: t('admin_feedback.tab.col_status'),
            render: (msg: FeedbackMessage) => (
                <div className="w-36">
                    <CustomSelect
                        options={statusOptions}
                        value={msg.status || 'new'}
                        onChange={(newVal) => handleStatusChange(msg.id, newVal as string)}
                        size="sm"
                        disabled={!canDo('feedback.change_status')}
                    />
                </div>
            )
        },
        ...(canDo('feedback.delete') ? [{
            header: '',
            render: (msg: FeedbackMessage) => (
                <div className="flex justify-end">
                    <button
                        className="p-1.5 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleDelete(msg.id, msg.screenshot_url)}
                        title={t('admin_feedback.tab.delete_title')}
                    >
                        <FaTrash className="text-xs" />
                    </button>
                </div>
            )
        }] : [])
    ], [t, handleStatusChange, handleDelete, canDo, getTypeConfig, statusOptions]);

    const getFilterClass = (filterName: string) =>
        `px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === filterName
                ? 'bg-primary text-white shadow-xs'
                : 'text-textMuted hover:text-textMain hover:bg-surface'
        }`;

    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedMessages = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredMessages.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMessages, currentPage]);

    const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    if (loading) {
        return (
            <div className="py-16 text-xs text-textMuted font-bold flex flex-col items-center gap-2 bg-surface rounded-2xl border border-border">
                <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
                <div>{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full pb-4 flex-1 h-full">
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-primary-subtle text-primary rounded-xl border border-primary/20 flex items-center justify-center text-base shadow-2xs">
                        <FaComments />
                    </div>
                    <div>
                        <h2 className="m-0 text-base sm:text-lg font-bold text-textMain tracking-tight">
                            {t('admin_feedback.tab.title')}
                        </h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5 font-medium">
                            {t('admin_feedback.tab.subtitle')} ({filteredMessages.length})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                    <div className="flex gap-1 bg-main p-1 rounded-2xl border border-border">
                        <button className={getFilterClass('all')} onClick={() => setFilter('all')}>{t('admin_feedback.tab.filter_all')}</button>
                        <button className={getFilterClass('bug')} onClick={() => setFilter('bug')}>{t('admin_feedback.tab.filter_bugs')}</button>
                        <button className={getFilterClass('suggestion')} onClick={() => setFilter('suggestion')}>{t('admin_feedback.tab.filter_suggestions')}</button>
                        <button className={getFilterClass('contact')} onClick={() => setFilter('contact')}>{t('admin_feedback.tab.filter_contacts')}</button>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 text-textMuted hover:text-textMain bg-surface border border-border rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title={t('common.refresh')}
                    >
                        <FaSyncAlt className="text-xs" />
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredMessages}
                    emptyMessage={t('admin_feedback.tab.empty_state')}
                    rowClassName={(msg: FeedbackMessage) => msg.status === 'resolved' ? 'opacity-60 transition-opacity hover:opacity-100' : ''}
                />
            </div>
        </div>
    );
}
