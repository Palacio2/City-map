import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { FaBullhorn, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPlus, FaPowerOff } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import uiStyles from '../../ui/AdminUI.module.css';
import styles from './NotificationsTab.module.css';
import { useTranslation } from 'react-i18next'; // ДОДАНО

const NotificationsTab = () => {
    const { t } = useTranslation('admin'); // ДОДАНО
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
            case 'info': return <FaInfoCircle style={{color: '#3b82f6'}} />;
            case 'warning': return <FaExclamationTriangle style={{color: '#f59e0b'}} />;
            case 'success': return <FaCheckCircle style={{color: '#10b981'}} />;
            case 'error': return <FaTimesCircle style={{color: '#ef4444'}} />;
            default: return <FaBullhorn />;
        }
    };

    const columns = useMemo(() => [
        { 
            header: t('notificationsTab.colStatus'), 
            render: (n) => (
                <button 
                    onClick={() => toggleStatus(n.id, n.is_active)}
                    className={`${uiStyles.btn} ${styles.statusBtn} ${n.is_active ? styles.statusActive : uiStyles.btnCancel}`}
                >
                    <FaPowerOff /> {n.is_active ? t('notificationsTab.statusActive') : t('notificationsTab.statusHidden')}
                </button>
            )
        },
        { 
            header: t('notificationsTab.colType'), 
            render: (n) => (
                <span className={styles.typeBadge}>
                    {getTypeIcon(n.type)} {n.type}
                </span>
            ) 
        },
        { header: t('notificationsTab.colMessage'), accessor: 'message' },
        { header: t('notificationsTab.colCreated'), render: (n) => new Date(n.created_at).toLocaleDateString('uk-UA') },
        { 
            header: t('notificationsTab.colAction'), 
            render: (n) => (
                <button onClick={() => deleteNotification(n.id)} className={styles.deleteBtn}>
                    <FaTimesCircle />
                </button>
            ) 
        }
    ], [t]); // Додано t в залежності useMemo

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
                    <div className={`${uiStyles.formGroup}`} style={{ flex: '1 1 300px' }}>
                        <label className={uiStyles.label}>{t('notificationsTab.msgLabel')}</label>
                        <input 
                            type="text" 
                            value={newMessage} 
                            onChange={e => setNewMessage(e.target.value)} 
                            placeholder={t('notificationsTab.msgPlaceholder')} 
                            className={uiStyles.input} 
                        />
                    </div>
                    <div className={`${uiStyles.formGroup}`} style={{ flex: '0 0 150px' }}>
                        <label className={uiStyles.label}>{t('notificationsTab.styleLabel')}</label>
                        <select value={newType} onChange={e => setNewType(e.target.value)} className={uiStyles.input}>
                            <option value="info">{t('notificationsTab.typeInfo')}</option>
                            <option value="success">{t('notificationsTab.typeSuccess')}</option>
                            <option value="warning">{t('notificationsTab.typeWarning')}</option>
                            <option value="error">{t('notificationsTab.typeError')}</option>
                        </select>
                    </div>
                    <button 
                        onClick={handleCreate} 
                        disabled={creating || !newMessage.trim()} 
                        className={`${uiStyles.btn} ${uiStyles.btnPrimary} ${styles.publishBtn}`}
                    >
                        {creating ? t('notificationsTab.processing') : <><FaPlus className={styles.publishBtnIcon} /> {t('notificationsTab.publishBtn')}</>}
                    </button>
                </div>
            </div>

            <div className={styles.tableSection}>
                {loading ? (
                    <div className={styles.loading}>{t('notificationsTab.loading')}</div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={notifications} 
                        emptyMessage={t('notificationsTab.empty')}
                        rowClassName={(n) => n.is_active ? uiStyles.activeRow : ''}
                    />
                )}
            </div>
        </div>
    );
};

export default React.memo(NotificationsTab);