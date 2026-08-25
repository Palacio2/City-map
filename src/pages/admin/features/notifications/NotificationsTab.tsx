import { useMemo } from 'react';
import { FaBullhorn, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPlus, FaPowerOff, FaTrash, FaSyncAlt } from 'react-icons/fa';
import DataTable from '@admin/core/ui/DataTable';
import { Button } from '@admin/core/ui/Button';
import { Input, FormGroup } from '@admin/core/ui/Input';
import { CustomSelect, SelectOption } from '@admin/core/ui/CustomSelect';
import { Badge } from '@admin/core/ui/Badge';
import { useTranslation } from 'react-i18next';
import { useNotifications, NotificationItem } from '@admin/features/notifications/useNotifications';
import { useActionGuard } from '@admin/core/context/useActionGuard';

export default function NotificationsTab() {
    const { t } = useTranslation('db');
    const { canDo } = useActionGuard();
    const {
        notifications, loading, creating, newMessage, setNewMessage,
        newType, setNewType, handleCreate, toggleStatus, deleteNotification, refetch
    } = useNotifications();

    const typeOptions: SelectOption[] = [
        { value: 'info', label: t('admin_notifications.types.info'), icon: <FaInfoCircle className="text-primary text-xs" /> },
        { value: 'success', label: t('admin_notifications.types.success'), icon: <FaCheckCircle className="text-emerald-600 text-xs" /> },
        { value: 'warning', label: t('admin_notifications.types.warning'), icon: <FaExclamationTriangle className="text-amber-500 text-xs" /> },
        { value: 'error', label: t('admin_notifications.types.error'), icon: <FaTimesCircle className="text-rose-500 text-xs" /> }
    ];

    const getBadgeVariant = (type: string) => {
        if (type === 'success') return 'success';
        if (type === 'warning') return 'warning';
        if (type === 'error') return 'danger';
        return 'primary';
    };

    const getTypeIcon = (type: string) => {
        if (type === 'success') return FaCheckCircle;
        if (type === 'warning') return FaExclamationTriangle;
        if (type === 'error') return FaTimesCircle;
        return FaInfoCircle;
    };

    const columns = useMemo(() => [
        {
            header: t('admin_notifications.tab.col_status'),
            render: (n: NotificationItem) => (
                <button
                    onClick={() => toggleStatus(n.id, n.is_active)}
                    disabled={!canDo('notifications.send')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors border shadow-2xs ${
                        n.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-surface text-textMuted border-border hover:text-textMain'
                    } ${!canDo('notifications.send') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <FaPowerOff className="text-[10px]" />
                    <span>{n.is_active ? t('admin_notifications.tab.active') : t('admin_notifications.tab.inactive')}</span>
                </button>
            )
        },
        {
            header: t('admin_notifications.tab.col_type'),
            render: (n: NotificationItem) => (
                <Badge variant={getBadgeVariant(n.type)} icon={getTypeIcon(n.type)}>
                    {t(`admin_notifications.types.${n.type}`, n.type)}
                </Badge>
            )
        },
        {
            header: t('admin_notifications.tab.col_message'),
            render: (n: NotificationItem) => (
                <span className="text-xs font-semibold text-textMain max-w-xl block leading-relaxed">
                    {n.message}
                </span>
            )
        },
        {
            header: t('admin_notifications.tab.col_created'),
            render: (n: NotificationItem) => (
                <span className="text-textMuted font-mono font-bold text-[11px] whitespace-nowrap">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString('uk-UA') : '-'}
                </span>
            )
        },
        {
            header: '',
            render: (n: NotificationItem) => (
                <div className="flex justify-end">
                    {canDo('notifications.send') && (
                        <button
                            onClick={() => deleteNotification(n.id)}
                            className="p-1.5 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title={t('admin_notifications.tab.delete_title')}
                        >
                            <FaTrash className="text-xs" />
                        </button>
                    )}
                </div>
            )
        }
    ], [t, toggleStatus, deleteNotification, canDo]);

    if (loading && notifications.length === 0) {
        return (
            <div className="py-16 text-xs text-textMuted flex flex-col items-center gap-2 bg-surface rounded-2xl border border-border">
                <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
                <div>{t('admin_notifications.tab.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full pb-4 flex-1 h-full">
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-primary-subtle text-primary rounded-xl border border-primary/20 flex items-center justify-center text-base shadow-2xs">
                        <FaBullhorn />
                    </div>
                    <div>
                        <h2 className="m-0 text-base sm:text-lg font-bold text-textMain tracking-tight">
                            {t('admin_notifications.tab.title')}
                        </h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5 font-medium">
                            {t('admin_notifications.tab.subtitle')} ({notifications.length})
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2.5 text-textMuted hover:text-textMain bg-surface border border-border rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs self-end sm:self-auto cursor-pointer"
                    title={t('common.refresh')}
                >
                    <FaSyncAlt className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                    <span>{t('common.refresh')}</span>
                </button>
            </div>

            {canDo('notifications.send') && (
                <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1">
                        <FormGroup label={t('admin_notifications.tab.col_message')} className="mb-0">
                            <Input
                                type="text"
                                value={newMessage}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                                placeholder={t('admin_notifications.tab.placeholder')}
                                className="h-9 text-xs font-semibold"
                            />
                        </FormGroup>
                    </div>
                    <div className="w-full sm:w-44">
                        <FormGroup label={t('admin_notifications.tab.col_type')} className="mb-0">
                            <CustomSelect
                                options={typeOptions}
                                value={newType}
                                onChange={(val) => setNewType(String(val))}
                            />
                        </FormGroup>
                    </div>
                    <div className="shrink-0">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleCreate}
                            disabled={creating || !newMessage.trim()}
                            className="w-full sm:w-auto h-9"
                        >
                            {creating ? t('admin_notifications.tab.processing') : <><FaPlus className="text-xs" /> {t('admin_notifications.tab.publish')}</>}
                        </Button>
                    </div>
                </div>
            )}

            <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                <DataTable
                    columns={columns}
                    data={notifications}
                    emptyMessage={t('admin_notifications.tab.empty')}
                    rowClassName={(n: NotificationItem) => n.is_active ? 'bg-emerald-500/5' : ''}
                />
            </div>
        </div>
    );
}
