import React, { useMemo } from 'react';
import { FaBug, FaLightbulb, FaEnvelope, FaImage, FaExternalLinkAlt, FaExclamationTriangle, FaTrash, FaComments } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { Badge } from '../../ui/Badge';
import { Select } from '../../ui/Select';
import { useAdmin } from '../../hooks/AdminContext';
import { useFeedback } from './useFeedback';

export default function FeedbackTab() {
    const { t } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const { loading, filter, setFilter, filteredMessages, handleDelete, handleStatusChange } = useFeedback(isSuperAdmin);

    const getTypeConfig = (type) => {
        switch (type) {
            case 'critical': return { icon: FaExclamationTriangle, label: t('admin_feedback.types.critical'), variant: 'danger' };
            case 'data_error': return { icon: FaBug, label: t('admin_feedback.types.data_error'), variant: 'warning' };
            case 'ui_bug': return { icon: FaBug, label: t('admin_feedback.types.ui_bug'), variant: 'purple' };
            case 'suggestion': return { icon: FaLightbulb, label: t('admin_feedback.types.suggestion'), variant: 'success' };
            case 'contact': return { icon: FaEnvelope, label: t('admin_feedback.types.contact'), variant: 'primary' };
            default: return { icon: FaEnvelope, label: type || t('admin_feedback.types.other'), variant: 'default' };
        }
    };

    const getStatusOptions = () => [
        { value: 'new', label: `🆕 ${t('admin_feedback.status.new')}` },
        { value: 'in_progress', label: `⏳ ${t('admin_feedback.status.in_progress')}` },
        { value: 'resolved', label: `✅ ${t('admin_feedback.status.resolved')}` }
    ];

    const columns = useMemo(() => [
        {
            header: t('admin_feedback.tab.col_date'),
            render: (msg) => (
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-[0.9rem] text-textMain whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <span className="text-[0.8rem] text-textMuted font-medium">
                        {new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            header: t('admin_feedback.tab.col_user'),
            render: (msg) => {
                const typeConfig = getTypeConfig(msg.type);
                return (
                    <div className="flex flex-col items-start gap-2.5">
                        <div>
                            <span className="font-bold text-textMain text-[0.95rem] block">{msg.email || msg.user_email}</span>
                            {msg.name && <span className="text-[0.85rem] text-textMuted block font-medium mt-0.5">{msg.name}</span>}
                        </div>
                        <Badge variant={typeConfig.variant} icon={typeConfig.icon}>
                            {typeConfig.label}
                        </Badge>
                    </div>
                );
            }
        },
        {
            header: t('admin_feedback.tab.col_message'),
            render: (msg) => (
                <div className="max-w-[500px]">
                    <div className="text-textMain text-[0.9rem] leading-relaxed whitespace-pre-wrap mb-3 p-3.5 bg-main rounded-xl border border-border shadow-inner">
                        {msg.message}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {msg.screenshot_url && (
                            <a href={msg.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-1 px-3 bg-blue-500/10 text-primary border border-blue-500/20 rounded-lg text-[0.8rem] font-bold no-underline transition-all hover:bg-blue-500/20">
                                <FaImage /> {t('admin_feedback.tab.screenshot_btn')}
                            </a>
                        )}
                        {msg.page_url && (
                            <a href={msg.page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-1 px-3 bg-purple-500/10 text-[#8b5cf6] border border-purple-500/20 rounded-lg text-[0.8rem] font-bold no-underline transition-all hover:bg-purple-500/20" title={msg.page_url}>
                                <FaExternalLinkAlt /> URL
                            </a>
                        )}
                        {msg.screen_size && (
                            <span className="inline-flex items-center gap-1.5 py-1 px-3 bg-surface border border-border text-textMuted rounded-lg text-[0.8rem] font-medium shadow-sm" title={msg.browser_info}>
                                {t('admin_feedback.tab.screen_label')} {msg.screen_size}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: t('admin_feedback.tab.col_status'),
            render: (msg) => {
                let statusClass = "";
                if (msg.status === 'in_progress') statusClass = "!bg-amber-500/10 !text-[#d97706] !border-amber-500/30 focus:!border-amber-500";
                if (msg.status === 'resolved') statusClass = "!bg-emerald-500/10 !text-[#059669] !border-emerald-500/30 focus:!border-emerald-500";

                return (
                    <Select 
                        className={`!w-full !py-2 !px-3 !text-[0.85rem] !font-bold min-w-[140px] shadow-sm ${statusClass}`}
                        value={msg.status || 'new'}
                        onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                    >
                        {getStatusOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                );
            }
        },
        ...(isSuperAdmin ? [{
            header: t('admin_feedback.tab.col_actions'),
            render: (msg) => (
                <div className="flex justify-end">
                    <button 
                        className="bg-surface border border-border text-textMuted w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10 hover:text-danger hover:border-red-500/30 shadow-sm"
                        onClick={() => handleDelete(msg.id, msg.screenshot_url)}
                        title={t('admin_feedback.tab.delete_title')}
                    >
                        <FaTrash size={12} />
                    </button>
                </div>
            )
        }] : [])
    ], [t, handleStatusChange, handleDelete, isSuperAdmin]);

    const getFilterClass = (filterName) => `py-2 px-5 rounded-lg font-bold text-[0.85rem] transition-all cursor-pointer border ${filter === filterName ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface text-textMuted border-border hover:bg-main hover:text-textMain'}`;

    if (loading) {
        return (
            <div className="py-20 px-5 text-[1rem] text-textMuted font-medium flex flex-col items-center gap-4 bg-surface rounded-xl border border-border shadow-sm">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin"></div>
                <div>{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_ease-out]">
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-main text-textMain rounded-lg border border-border flex items-center justify-center text-[1.2rem]">
                        <FaComments />
                    </div>
                    <div>
                        <h2 className="m-0 text-[1.25rem] text-textMain font-bold tracking-tight">
                            {t('admin_feedback.tab.title')}
                            <span className="ml-3 bg-main text-textMuted py-0.5 px-2.5 rounded-md text-[0.8rem] font-bold border border-border align-middle">
                                {filteredMessages.length}
                            </span>
                        </h2>
                        <p className="m-0 text-textMuted text-[0.9rem] mt-1">
                            {t('admin_feedback.tab.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    <button className={getFilterClass('all')} onClick={() => setFilter('all')}>{t('admin_feedback.tab.filter_all')}</button>
                    <button className={getFilterClass('bug')} onClick={() => setFilter('bug')}>{t('admin_feedback.tab.filter_bugs')}</button>
                    <button className={getFilterClass('suggestion')} onClick={() => setFilter('suggestion')}>{t('admin_feedback.tab.filter_suggestions')}</button>
                    <button className={getFilterClass('contact')} onClick={() => setFilter('contact')}>{t('admin_feedback.tab.filter_contacts')}</button>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns}
                    data={filteredMessages}
                    emptyMessage={
                        <div className="py-16 px-10 text-center text-textMuted font-medium text-[0.95rem] flex flex-col items-center gap-3 bg-main/20">
                            <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center text-[1.5rem] border border-border shadow-sm">🎉</div>
                            <div>{t('admin_feedback.tab.empty_state')}</div>
                        </div>
                    }
                    rowClassName={(msg) => msg.status === 'resolved' ? 'opacity-60 transition-all bg-main hover:opacity-100' : ''}
                />
            </div>
        </div>
    );
}