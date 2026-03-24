import React, { useMemo } from 'react';
import { FaBug, FaLightbulb, FaEnvelope, FaImage, FaExternalLinkAlt, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { Badge } from '../../ui/Badge';
import { Select } from '../../ui/Select';
import { useAdmin } from '../../hooks/AdminContext';
import { useFeedback } from './useFeedback';

export default function FeedbackTab() {
    const { t } = useTranslation('adminFeedback');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const { loading, filter, setFilter, filteredMessages, handleDelete, handleStatusChange } = useFeedback(isSuperAdmin);

    const getTypeConfig = (type) => {
        switch (type) {
            case 'critical': return { icon: FaExclamationTriangle, label: t('feedbackTab.typeCritical'), variant: 'danger' };
            case 'data_error': return { icon: FaBug, label: t('feedbackTab.typeData'), variant: 'warning' };
            case 'ui_bug': return { icon: FaBug, label: t('feedbackTab.typeUi'), variant: 'purple' };
            case 'suggestion': return { icon: FaLightbulb, label: t('feedbackTab.typeSuggestion'), variant: 'success' };
            case 'contact': return { icon: FaEnvelope, label: t('feedbackTab.typeContact'), variant: 'default' };
            default: return { icon: FaEnvelope, label: type || t('feedbackTab.typeOther'), variant: 'default' };
        }
    };

    const columns = useMemo(() => [
        {
            header: t('feedbackTab.colDate'),
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
            header: t('feedbackTab.colUser'),
            render: (msg) => {
                const typeConfig = getTypeConfig(msg.type);
                return (
                    <div className="flex flex-col items-start gap-2">
                        <div>
                            <span className="font-bold text-textMain text-[0.95rem] block">{msg.email}</span>
                            {msg.name && <span className="text-[0.85rem] text-textMuted block font-medium">{msg.name}</span>}
                        </div>
                        <Badge variant={typeConfig.variant} icon={typeConfig.icon}>
                            {typeConfig.label}
                        </Badge>
                    </div>
                );
            }
        },
        {
            header: t('feedbackTab.colMsg'),
            render: (msg) => (
                <div className="max-w-[500px]">
                    <div className="text-textMain text-[0.9rem] leading-relaxed whitespace-pre-wrap mb-3 p-3 bg-main rounded-md border border-border">{msg.message}</div>
                    <div className="flex gap-2 flex-wrap">
                        {msg.screenshot_url && (
                            <a href={msg.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-500/5 text-primary rounded-md text-[0.8rem] font-bold no-underline transition-all hover:bg-blue-500/10">
                                <FaImage /> {t('feedbackTab.screenshot')}
                            </a>
                        )}
                        {msg.page_url && (
                            <a href={msg.page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-500/5 text-primary rounded-md text-[0.8rem] font-bold no-underline transition-all hover:bg-blue-500/10" title={msg.page_url}>
                                <FaExternalLinkAlt /> URL
                            </a>
                        )}
                        {msg.screen_size && (
                            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-main text-textMuted rounded-md text-[0.8rem] font-medium" title={msg.browser_info}>
                                🖥️ {msg.screen_size}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: t('feedbackTab.colStatus'),
            render: (msg) => {
                let statusClass = "";
                if (msg.status === 'in_progress') statusClass = "!bg-amber-500/5 !text-[#d97706] !border-amber-500/20 focus:!border-amber-500";
                if (msg.status === 'resolved') statusClass = "!bg-emerald-500/5 !text-[#059669] !border-emerald-500/20 focus:!border-emerald-500";

                return (
                    <Select 
                        className={`!w-full !py-2 !px-3 !text-[0.85rem] !font-semibold ${statusClass}`}
                        value={msg.status || 'new'}
                        onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                    >
                        <option value="new">{t('feedbackTab.statusNew')}</option>
                        <option value="in_progress">{t('feedbackTab.statusInProgress')}</option>
                        <option value="resolved">{t('feedbackTab.statusResolved')}</option>
                    </Select>
                )
            }
        },
        {
            header: t('feedbackTab.colAction'),
            render: (msg) => isSuperAdmin ? (
                <div className="flex justify-end">
                    <button 
                        className="bg-transparent text-textMuted p-2 rounded-md cursor-pointer transition-all inline-flex items-center justify-center text-[1rem] hover:bg-red-500/10 hover:text-danger"
                        onClick={() => handleDelete(msg.id, msg.screenshot_url)}
                        title={t('feedbackTab.deleteBtnTitle')}
                    >
                        <FaTrash />
                    </button>
                </div>
            ) : null
        }
    ], [t, handleStatusChange, handleDelete, isSuperAdmin]);

    const getFilterClass = (filterName) => `py-1.5 px-4 rounded-md font-semibold text-[0.85rem] transition-all cursor-pointer ${filter === filterName ? 'bg-surface text-textMain shadow-sm border border-border/50' : 'bg-transparent text-textMuted border border-transparent hover:text-textMain'}`;

    if (loading) {
        return (
            <div className="py-20 px-5 text-[1.1rem] text-primary text-center font-bold flex flex-col items-center gap-5 bg-surface rounded-lg border border-border shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                <div>{t('feedbackTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface p-5 px-6 rounded-lg border border-border shadow-sm gap-4">
                <h2 className="m-0 text-[1.25rem] text-textMain flex items-center gap-3 font-bold tracking-tight">
                    {t('feedbackTab.title')} 
                    <span className="bg-main text-textMuted py-0.5 px-2.5 rounded-full text-[0.85rem] font-bold border border-border">{filteredMessages.length}</span>
                </h2>
                
                <div className="flex bg-main p-1 rounded-lg border border-border/50 w-full md:w-auto overflow-x-auto scrollbar-thin">
                    <button className={getFilterClass('all')} onClick={() => setFilter('all')}>{t('feedbackTab.filterAll')}</button>
                    <button className={getFilterClass('bug')} onClick={() => setFilter('bug')}>{t('feedbackTab.filterBugs')}</button>
                    <button className={getFilterClass('suggestion')} onClick={() => setFilter('suggestion')}>{t('feedbackTab.filterSuggestions')}</button>
                    <button className={getFilterClass('contact')} onClick={() => setFilter('contact')}>{t('feedbackTab.filterContacts')}</button>
                </div>
            </div>

            <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns}
                    data={filteredMessages}
                    emptyMessage={
                        <div className="py-16 px-10 text-center text-textMuted font-medium text-[1rem] flex flex-col items-center gap-4">
                            <div className="text-[2.5rem] bg-main w-16 h-16 flex items-center justify-center rounded-full">🎉</div>
                            <div>{t('feedbackTab.emptyState')}</div>
                        </div>
                    }
                    rowClassName={(msg) => msg.status === 'resolved' ? 'opacity-60 transition-all bg-main hover:opacity-100' : ''}
                />
            </div>
        </div>
    );
}