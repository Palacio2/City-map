import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import { FaBug, FaLightbulb, FaEnvelope, FaImage, FaExternalLinkAlt, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import styles from './FeedbackTab.module.css';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { useAdmin } from '../../hooks/AdminContext';

export default function FeedbackTab() {
    const { t } = useTranslation('admin');
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contacts_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, screenshotUrl) => {
        if (!isSuperAdmin) return;
        if (!window.confirm(t('feedbackTab.confirmDelete'))) return;
        
        try {
            if (screenshotUrl) {
                const urlParts = screenshotUrl.split('/');
                const fileName = urlParts[urlParts.length - 1];
                if (fileName) await supabase.storage.from('feedback_images').remove([fileName]);
            }

            const { error: dbError } = await supabase.from('contacts_messages').delete().eq('id', id);
            if (dbError) throw dbError;
            
            setMessages(messages.filter(msg => msg.id !== id));
        } catch (error) {
            alert(t('feedbackTab.deleteError') + error.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('contacts_messages')
                .update({ status: newStatus })
                .eq('id', id);
                
            if (error) throw error;
            
            setMessages(messages.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg));
        } catch (error) {
            alert(t('feedbackTab.statusError') + error.message);
        }
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'critical': return { icon: <FaExclamationTriangle />, label: t('feedbackTab.typeCritical'), class: styles.typeCritical };
            case 'data_error': return { icon: <FaBug />, label: t('feedbackTab.typeData'), class: styles.typeData };
            case 'ui_bug': return { icon: <FaBug />, label: t('feedbackTab.typeUi'), class: styles.typeUi };
            case 'suggestion': return { icon: <FaLightbulb />, label: t('feedbackTab.typeSuggestion'), class: styles.typeSuggestion };
            case 'contact': return { icon: <FaEnvelope />, label: t('feedbackTab.typeContact'), class: styles.typeContact };
            default: return { icon: <FaEnvelope />, label: type || t('feedbackTab.typeOther'), class: styles.typeContact };
        }
    };

    const filteredMessages = messages.filter(msg => {
        if (filter === 'all') return true;
        if (filter === 'contact') return msg.type === 'contact';
        if (filter === 'bug') return ['critical', 'data_error', 'ui_bug'].includes(msg.type);
        if (filter === 'suggestion') return msg.type === 'suggestion';
        return true;
    });

    const columns = [
        {
            header: t('feedbackTab.colDate'),
            render: (msg) => (
                <>
                    <div className={styles.dateMain}>
                        {new Date(msg.created_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <div className={styles.timeSub}>
                        {new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </>
            )
        },
        {
            header: t('feedbackTab.colUser'),
            render: (msg) => {
                const typeConfig = getTypeConfig(msg.type);
                return (
                    <>
                        <div className={styles.email} title={msg.email}>{msg.email}</div>
                        {msg.name && <div className={styles.name}>{msg.name}</div>}
                        <div className={`${styles.typeBadge} ${typeConfig.class}`}>
                            {typeConfig.icon} {typeConfig.label}
                        </div>
                    </>
                );
            }
        },
        {
            header: t('feedbackTab.colMsg'),
            render: (msg) => (
                <>
                    <div className={styles.messageContent}>{msg.message}</div>
                    <div className={styles.metaTags}>
                        {msg.screenshot_url && (
                            <a href={msg.screenshot_url} target="_blank" rel="noopener noreferrer" className={styles.metaTagLink}>
                                <FaImage /> {t('feedbackTab.screenshot')}
                            </a>
                        )}
                        {msg.page_url && (
                            <a href={msg.page_url} target="_blank" rel="noopener noreferrer" className={styles.metaTagLink} title={msg.page_url}>
                                <FaExternalLinkAlt /> URL
                            </a>
                        )}
                        {msg.screen_size && (
                            <span className={styles.metaTagInfo} title={msg.browser_info}>
                                🖥️ {msg.screen_size}
                            </span>
                        )}
                    </div>
                </>
            )
        },
        {
            header: t('feedbackTab.colStatus'),
            render: (msg) => (
                <select 
                    className={`${styles.statusSelect} ${styles[`status_${msg.status || 'new'}`]}`}
                    value={msg.status || 'new'}
                    onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                >
                    <option value="new">{t('feedbackTab.statusNew')}</option>
                    <option value="in_progress">{t('feedbackTab.statusInProgress')}</option>
                    <option value="resolved">{t('feedbackTab.statusResolved')}</option>
                </select>
            )
        },
        {
            header: t('feedbackTab.colAction'),
            render: (msg) => isSuperAdmin ? (
                <div className={styles.actionCell}>
                    <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(msg.id, msg.screenshot_url)}
                        title={t('feedbackTab.deleteBtnTitle')}
                    >
                        <FaTrash />
                    </button>
                </div>
            ) : <span style={{color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600}}>No access</span>
        }
    ];

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <div>{t('feedbackTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('feedbackTab.title')} <span className={styles.badge}>{filteredMessages.length}</span></h2>
                <div className={styles.filters}>
                    <button className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>{t('feedbackTab.filterAll')}</button>
                    <button className={`${styles.filterBtn} ${filter === 'bug' ? styles.active : ''}`} onClick={() => setFilter('bug')}>{t('feedbackTab.filterBugs')}</button>
                    <button className={`${styles.filterBtn} ${filter === 'suggestion' ? styles.active : ''}`} onClick={() => setFilter('suggestion')}>{t('feedbackTab.filterSuggestions')}</button>
                    <button className={`${styles.filterBtn} ${filter === 'contact' ? styles.active : ''}`} onClick={() => setFilter('contact')}>{t('feedbackTab.filterContacts')}</button>
                </div>
            </div>

            <DataTable 
                columns={columns}
                data={filteredMessages}
                emptyMessage={
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🎉</div>
                        <div>{t('feedbackTab.emptyState')}</div>
                    </div>
                }
                rowClassName={(msg) => msg.status === 'resolved' ? styles.rowResolved : ''}
            />
        </div>
    );
}