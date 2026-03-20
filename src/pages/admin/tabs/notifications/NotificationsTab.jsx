import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { FaBullhorn, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPlus, FaPowerOff, FaTrash } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import uiStyles from '../../ui/AdminUI.module.css';
import styles from './NotificationsTab.module.css';
import { useTranslation } from 'react-i18next';

const NotificationsTab = () => {
    const { t } = useTranslation('admin');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const [newType, setNewType] = useState('info');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('global_notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newMessage.trim()) return;
        setCreating(true);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            
            await supabase
                .from('global_notifications')
                .update({ is_active: false })
                .eq('is_active', true);

            const { error } = await supabase
                .from('global_notifications')
                .insert({
                    message: newMessage.trim(),
                    type: newType,
                    is_active: true,
                    created_by: user.id
                });

            if (error) throw error;
            
            setNewMessage('');
            setNewType('info');
            fetchNotifications();
        } catch (err) {
            console.error(err);
            alert(t('notificationsTab.errorCreate') + err.message);
        } finally {
            setCreating(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            if (!currentStatus) {
                await supabase
                    .from('global_notifications')
                    .update({ is_active: false })
                    .eq('is_active', true);
            }

            const { error } = await supabase
                .from('global_notifications')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchNotifications();
        } catch (err) {
            console.error(err);
            alert(t('notificationsTab.errorStatus') + err.message);
        }
    };

    const deleteNotification = async (id) => {
        if (!window.confirm(t('notificationsTab.deleteConfirm'))) return;
        try {
            const { error } = await supabase.from('global_notifications').delete().eq('id', id);
            if (error) throw error;
            fetchNotifications();
        } catch (err) {
            console.error(err);
            alert(t('notificationsTab.errorDelete') + err.message);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'info': return <FaInfoCircle style={{color: 'var(--primary)'}} />;
            case 'warning': return <FaExclamationTriangle style={{color: '#d97706'}} />;
            case 'success': return <FaCheckCircle style={{color: 'var(--success)'}} />;
            case 'error': return <FaTimesCircle style={{color: 'var(--danger)'}} />;
            default: return <FaBullhorn />;
        }
    };

    const columns = useMemo(() => [
        { 
            header: t('notificationsTab.colStatus'), 
            render: (n) => (
                <button 
                    onClick={() => toggleStatus(n.id, n.is_active)}
                    className={`${uiStyles.btn} ${styles.statusBtn} ${n.is_active ? styles.statusActive : styles.statusInactive}`}
                >
                    <FaPowerOff /> {n.is_active ? t('notificationsTab.statusActive') : t('notificationsTab.statusHidden')}
                </button>
            )
        },
        { 
            header: t('notificationsTab.colType'), 
            render: (n) => (
                <span className={`${styles.typeBadge} ${styles[`type_${n.type}`]}`}>
                    {getTypeIcon(n.type)} {n.type}
                </span>
            ) 
        },
        { 
            header: t('notificationsTab.colMessage'), 
            render: (n) => <span className={styles.messageCell}>{n.message}</span>
        },
        { 
            header: t('notificationsTab.colCreated'), 
            render: (n) => <span className={styles.dateCell}>{new Date(n.created_at).toLocaleDateString('uk-UA')}</span> 
        },
        { 
            header: t('notificationsTab.colAction'), 
            render: (n) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => deleteNotification(n.id)} className={styles.deleteBtn}>
                        <FaTrash />
                    </button>
                </div>
            ) 
        }
    ], [t]); 

    if (loading && notifications.length === 0) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <div>{t('notificationsTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.createSection}>
                <div className={styles.headerRow}>
                    <div className={styles.iconWrapper}>
                        <FaBullhorn />
                    </div>
                    <div>
                        <h2 className={styles.title}>{t('notificationsTab.title')}</h2>
                        <span className={styles.subtitle}>{t('notificationsTab.subtitle')}</span>
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={`${uiStyles.formGroup}`} style={{ flex: '1 1 350px' }}>
                        <label className={uiStyles.label}>{t('notificationsTab.msgLabel')}</label>
                        <input 
                            type="text" 
                            value={newMessage} 
                            onChange={e => setNewMessage(e.target.value)} 
                            placeholder={t('notificationsTab.msgPlaceholder')} 
                            className={uiStyles.input} 
                        />
                    </div>
                    <div className={`${uiStyles.formGroup}`} style={{ flex: '0 0 200px' }}>
                        <label className={uiStyles.label}>{t('notificationsTab.styleLabel')}</label>
                        <select value={newType} onChange={e => setNewType(e.target.value)} className={`${uiStyles.input} ${styles.typeSelect}`}>
                            <option value="info">🔵 {t('notificationsTab.typeInfo')}</option>
                            <option value="success">🟢 {t('notificationsTab.typeSuccess')}</option>
                            <option value="warning">🟠 {t('notificationsTab.typeWarning')}</option>
                            <option value="error">🔴 {t('notificationsTab.typeError')}</option>
                        </select>
                    </div>
                    
                    {/* Прихована мітка для ідеального вирівнювання кнопки */}
                    <div className={`${uiStyles.formGroup}`} style={{ flex: '0 0 auto' }}>
                        <label className={uiStyles.label} style={{ visibility: 'hidden' }}>Action</label>
                        <button 
                            onClick={handleCreate} 
                            disabled={creating || !newMessage.trim()} 
                            className={`${uiStyles.btn} ${uiStyles.btnPrimary} ${styles.publishBtn}`}
                        >
                            {creating ? t('notificationsTab.processing') : <><FaPlus className={styles.publishBtnIcon} /> {t('notificationsTab.publishBtn')}</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.tableSection}>
                <DataTable 
                    columns={columns} 
                    data={notifications} 
                    emptyMessage={t('notificationsTab.empty')}
                    rowClassName={(n) => n.is_active ? styles.activeRow : ''}
                />
            </div>
        </div>
    );
};

export default React.memo(NotificationsTab);