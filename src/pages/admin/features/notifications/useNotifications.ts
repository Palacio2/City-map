import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminMutation } from '@admin/core/hooks/useAdminMutation';
import { useTranslation } from 'react-i18next';
import { useModals } from '@admin/core/context/ModalContext';
import { adminNotificationsApi } from '@admin/features/notifications/adminNotificationsApi';
import type { NotificationItem } from '@admin/core/types/ui.types';

export type { NotificationItem };

export const useNotifications = () => {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [newType, setNewType] = useState('info');

    const { data: notifications = [], refetch, isLoading: loading } = useQuery<NotificationItem[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            return await adminNotificationsApi.getAll() as NotificationItem[];
        }
    });

    const createMutation = useAdminMutation({
        mutationFn: async () => {
            await adminNotificationsApi.create({ message: newMessage.trim(), type: newType, is_active: true });
        },
        onSuccess: () => {
            setNewMessage('');
            setNewType('info');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showAlert(t('common.success'), t('admin_notifications.alerts.created'), 'success');
        },
        
    });

    const statusMutation = useAdminMutation({
        mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: boolean }) => {
            await adminNotificationsApi.updateStatus(id, !currentStatus);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        
    });

    const deleteMutation = useAdminMutation({
        mutationFn: async (id: string) => {
            await adminNotificationsApi.delete(id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        
    });

    const handleCreate = () => {
        if (newMessage.trim()) createMutation.mutate();
    };

    const toggleStatus = (id: string, currentStatus: boolean) => statusMutation.mutate({ id, currentStatus });

    const deleteNotification = (id: string) => {
        showConfirm(
            t('admin_notifications.confirm.delete_title'),
            t('admin_notifications.confirm.delete_desc'),
            () => deleteMutation.mutate(id),
            { confirmVariant: 'danger', confirmText: t('admin_notifications.confirm.delete_btn') }
        );
    };

    return {
        notifications, loading, creating: createMutation.isPending,
        newMessage, setNewMessage, newType, setNewType,
        handleCreate, toggleStatus, deleteNotification, refetch
    };
};
