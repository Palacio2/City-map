import React, { useMemo } from 'react';
import { FaBullhorn, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPlus, FaPowerOff, FaTrash } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Badge } from '../../ui/Badge';
import { useTranslation } from 'react-i18next';
import { useNotifications } from './useNotifications';

const NotificationsTab = () => {
    const { t } = useTranslation('adminNotifications');
    const { 
        notifications, loading, creating, newMessage, setNewMessage, 
        newType, setNewType, handleCreate, toggleStatus, deleteNotification 
    } = useNotifications();

    const getBadgeVariant = (type) => {
        if (type === 'success') return 'success';
        if (type === 'warning') return 'warning';
        if (type === 'error') return 'danger';
        return 'primary';
    };

    const getTypeIcon = (type) => {
        if (type === 'success') return FaCheckCircle;
        if (type === 'warning') return FaExclamationTriangle;
        if (type === 'error') return FaTimesCircle;
        return FaInfoCircle;
    };

    const columns = useMemo(() => [
        { 
            header: t('notificationsTab.colStatus'), 
            render: (n) => (
                <button 
                    onClick={() => toggleStatus(n.id, n.is_active)}
                    className={`py-2 px-4 rounded-lg text-[0.85rem] font-bold w-[120px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all ${n.is_active ? 'bg-emerald-500/10 text-success border border-emerald-500/20 shadow-sm' : 'bg-surface text-textMuted border border-border hover:bg-main'}`}
                >
                    <FaPowerOff /> {n.is_active ? t('notificationsTab.statusActive') : t('notificationsTab.statusHidden')}
                </button>
            )
        },
        { 
            header: t('notificationsTab.colType'), 
            render: (n) => <Badge variant={getBadgeVariant(n.type)} icon={getTypeIcon(n.type)}>{n.type}</Badge>
        },
        { 
            header: t('notificationsTab.colMessage'), 
            render: (n) => <span className="font-semibold text-textMain text-[0.95rem]">{n.message}</span>
        },
        { 
            header: t('notificationsTab.colCreated'), 
            render: (n) => <span className="text-textMuted font-medium text-[0.9rem]">{new Date(n.created_at).toLocaleDateString('uk-UA')}</span> 
        },
        { 
            header: t('notificationsTab.colAction'), 
            render: (n) => (
                <div className="flex justify-end">
                    <button 
                        onClick={() => deleteNotification(n.id)} 
                        className="bg-transparent border border-transparent text-textMuted cursor-pointer text-[1.1rem] transition-all p-2 rounded-md inline-flex items-center justify-center hover:bg-red-500/10 hover:text-danger"
                    >
                        <FaTrash />
                    </button>
                </div>
            ) 
        }
    ], [t, toggleStatus, deleteNotification]); 

    if (loading && notifications.length === 0) {
        return (
            <div className="py-20 px-5 text-[1.1rem] text-primary text-center font-bold flex flex-col items-center gap-4 bg-surface rounded-xl border border-border shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                <div>{t('notificationsTab.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-6 md:p-8 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-[1.5rem] text-[#f97316] border border-orange-500/20">
                        <FaBullhorn />
                    </div>
                    <div>
                        <h2 className="m-0 text-[1.4rem] text-textMain font-extrabold tracking-tight">{t('notificationsTab.title')}</h2>
                        <span className="text-[0.95rem] text-textMuted font-medium">{t('notificationsTab.subtitle')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end bg-main/50 p-5 rounded-xl border border-border">
                    <FormGroup label={t('notificationsTab.msgLabel')} className="mb-0 w-full">
                        <Input 
                            type="text" 
                            value={newMessage} 
                            onChange={e => setNewMessage(e.target.value)} 
                            placeholder={t('notificationsTab.msgPlaceholder')} 
                            className="!bg-surface w-full"
                        />
                    </FormGroup>
                    
                    <FormGroup label={t('notificationsTab.styleLabel')} className="mb-0 w-full md:w-[180px]">
                        <Select 
                            value={newType} 
                            onChange={e => setNewType(e.target.value)} 
                            className="!bg-surface font-semibold w-full"
                        >
                            <option value="info">ℹ️ {t('notificationsTab.typeInfo')}</option>
                            <option value="success">✅ {t('notificationsTab.typeSuccess')}</option>
                            <option value="warning">⚠️ {t('notificationsTab.typeWarning')}</option>
                            <option value="error">❌ {t('notificationsTab.typeError')}</option>
                        </Select>
                    </FormGroup>
                    
                    <div className="w-full md:w-auto">
                        {/* ВИПРАВЛЕНО: Огорнули кнопку у FormGroup з невидимим label і додали !py-2.5 */}
                        <FormGroup label={<span className="invisible">-</span>} className="mb-0">
                            <Button 
                                variant="primary"
                                onClick={handleCreate} 
                                disabled={creating || !newMessage.trim()} 
                                className="w-full md:w-auto px-8 !m-0 !py-2.5 shadow-sm"
                            >
                                {creating ? t('notificationsTab.processing') : <><FaPlus className="mr-2" /> {t('notificationsTab.publishBtn')}</>}
                            </Button>
                        </FormGroup>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                <DataTable 
                    columns={columns} 
                    data={notifications} 
                    emptyMessage={t('notificationsTab.empty')}
                    rowClassName={(n) => n.is_active ? 'bg-emerald-500/5' : ''}
                />
            </div>
        </div>
    );
};

export default React.memo(NotificationsTab);