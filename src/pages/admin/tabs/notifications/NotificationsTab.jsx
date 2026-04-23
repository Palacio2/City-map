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
    const { t } = useTranslation('db'); 
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
            header: t('admin_notifications.tab.col_status'), 
            render: (n) => (
                <button 
                    onClick={() => toggleStatus(n.id, n.is_active)}
                    className={`py-1.5 px-3 rounded-lg text-[0.85rem] font-bold w-[120px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all ${n.is_active ? 'bg-emerald-500/10 text-success border border-emerald-500/20 shadow-sm' : 'bg-surface text-textMuted border border-border hover:bg-main hover:border-textMuted'}`}
                >
                    <FaPowerOff /> {n.is_active ? t('admin_notifications.tab.active') : t('admin_notifications.tab.inactive')}
                </button>
            )
        },
        { 
            header: t('admin_notifications.tab.col_type'), 
            render: (n) => <Badge variant={getBadgeVariant(n.type)} icon={getTypeIcon(n.type)}>{t(`admin_notifications.types.${n.type}`)}</Badge>
        },
        { 
            header: t('admin_notifications.tab.col_message'), 
            render: (n) => <span className="font-bold text-textMain text-[0.95rem]">{n.message}</span>
        },
        { 
            header: t('admin_notifications.tab.col_created'), 
            render: (n) => <span className="text-textMuted font-medium text-[0.85rem] bg-main px-2 py-1 rounded-md border border-border">{new Date(n.created_at).toLocaleDateString()}</span> 
        },
        { 
            header: t('admin_notifications.tab.col_actions'), 
            render: (n) => (
                <div className="flex justify-end">
                    <button 
                        onClick={() => deleteNotification(n.id)} 
                        className="bg-surface border border-transparent text-textMuted cursor-pointer text-[1rem] transition-all w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-500/10 hover:text-danger hover:border-red-500/20 shadow-sm"
                    >
                        <FaTrash size={12}/>
                    </button>
                </div>
            ) 
        }
    ], [t, toggleStatus, deleteNotification]); 

    if (loading && notifications.length === 0) {
        return (
            <div className="py-20 px-5 text-[1.1rem] text-primary text-center font-bold flex flex-col items-center gap-4 bg-surface rounded-xl border border-border shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                <div>{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-6 md:p-8 rounded-xl border border-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-[1.4rem] text-[#f97316] border border-orange-500/20 shadow-inner">
                        <FaBullhorn />
                    </div>
                    <div>
                        <h2 className="m-0 text-[1.4rem] text-textMain font-extrabold tracking-tight">{t('admin_notifications.tab.title')}</h2>
                        <span className="text-[0.95rem] text-textMuted font-medium">{t('admin_notifications.tab.subtitle')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end bg-main/40 p-5 rounded-xl border border-border shadow-inner">
                    <FormGroup label={t('admin_notifications.tab.col_message')} className="mb-0 w-full">
                        <Input 
                            type="text" 
                            value={newMessage} 
                            onChange={e => setNewMessage(e.target.value)} 
                            placeholder={t('admin_notifications.tab.placeholder')} 
                            className="!bg-surface w-full shadow-sm"
                        />
                    </FormGroup>
                    
                    <FormGroup label={t('admin_notifications.tab.col_type')} className="mb-0 w-full md:w-[180px]">
                        <Select 
                            value={newType} 
                            onChange={e => setNewType(e.target.value)} 
                            className="!bg-surface font-semibold w-full shadow-sm"
                        >
                            <option value="info">ℹ️ {t('admin_notifications.types.info')}</option>
                            <option value="success">✅ {t('admin_notifications.types.success')}</option>
                            <option value="warning">⚠️ {t('admin_notifications.types.warning')}</option>
                            <option value="error">❌ {t('admin_notifications.types.error')}</option>
                        </Select>
                    </FormGroup>
                    
                    <div className="w-full md:w-auto">
                        <FormGroup label={<span className="invisible">-</span>} className="mb-0">
                            <Button 
                                variant="primary"
                                onClick={handleCreate} 
                                disabled={creating || !newMessage.trim()} 
                                className="w-full md:w-auto px-8 !m-0 !py-2.5 shadow-md flex justify-center"
                            >
                                {creating ? t('admin_notifications.tab.processing') : <><FaPlus className="mr-2" /> {t('admin_notifications.tab.publish')}</>}
                            </Button>
                        </FormGroup>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                <DataTable 
                    columns={columns} 
                    data={notifications} 
                    emptyMessage={t('admin_notifications.tab.empty')}
                    rowClassName={(n) => n.is_active ? 'bg-emerald-500/5' : ''}
                />
            </div>
        </div>
    );
};

export default React.memo(NotificationsTab);