import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { useModals } from '../../ui/ModalContext';

export const useNotifications = () => {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();

    const [newMessage, setNewMessage] = useState('');
    const [newType, setNewType] = useState('info');

    const { data: notifications = [], isLoading: loading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('admin-notifications-manage', {
                body: { action: 'get_all' }
            });
            if (error || data?.error) throw new Error(error?.message || data?.error);
            return data.notifications || [];
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('admin-notifications-manage', {
                body: {
                    action: 'create',
                    payload: { message: newMessage.trim(), type: newType, is_active: true }
                }
            });
            if (error || data?.error) throw new Error(error?.message || data?.error);
        },
        onSuccess: () => {
            setNewMessage('');
            setNewType('info');
            queryClient.invalidateQueries(['notifications']);
            showAlert(t('common.success'), t('admin_notifications.alerts.created'), 'success');
        },
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, currentStatus }) => {
            const { data, error } = await supabase.functions.invoke('admin-notifications-manage', {
                body: { action: 'update_status', payload: { id, is_active: !currentStatus } }
            });
            if (error || data?.error) throw new Error(error?.message || data?.error);
        },
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { data, error } = await supabase.functions.invoke('admin-notifications-manage', {
                body: { action: 'delete', payload: { id } }
            });
            if (error || data?.error) throw new Error(error?.message || data?.error);
        },
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const handleCreate = () => {
        if (newMessage.trim()) createMutation.mutate();
    };

    const toggleStatus = (id, currentStatus) => statusMutation.mutate({ id, currentStatus });

    const deleteNotification = (id) => {
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
        handleCreate, toggleStatus, deleteNotification
    };
};