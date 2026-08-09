import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// @ts-ignore
import { api } from '../../../../services/api';
import { useTranslation } from 'react-i18next';
import { useModals } from '../../ui/ModalContext';

export const useFeedback = (isSuperAdmin: boolean) => {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all');

    const { data: messages = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['feedbackMessages'],
        queryFn: () => api.feedback.getMessages()
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, screenshotUrl }: { id: string, screenshotUrl?: string }) => {
            if (screenshotUrl) {
                const fileName = screenshotUrl.split('/').pop();
                if (fileName) await api.feedback.deleteImage(fileName);
            }
            await api.feedback.deleteMessage(id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbackMessages'] }),
        onError: (error: any) => showAlert(t('common.error'), error.message, 'error')
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => api.feedback.updateStatus(id, newStatus),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbackMessages'] }),
        onError: (error: any) => showAlert(t('common.error'), error.message, 'error')
    });

    const handleDelete = (id: string, screenshotUrl?: string) => {
        if (!isSuperAdmin) return;
        showConfirm(
            t('admin_feedback.tab.delete_title'),
            t('admin_feedback.tab.confirm_delete'),
            () => deleteMutation.mutate({ id, screenshotUrl }),
            { confirmVariant: 'danger', confirmText: t('common.actions.delete') }
        );
    };

    const handleStatusChange = (id: string, newStatus: string) => statusMutation.mutate({ id, newStatus });

    const filteredMessages = useMemo(() => {
        return messages.filter((msg: any) => {
            if (filter === 'all') return true;
            if (filter === 'contact') return msg.type === 'contact';
            if (filter === 'bug') return ['critical', 'data_error', 'ui_bug'].includes(msg.type);
            if (filter === 'suggestion') return msg.type === 'suggestion';
            return true;
        });
    }, [messages, filter]);

    return {
        loading, filter, setFilter, filteredMessages,
        handleDelete, handleStatusChange, refetch
    };
};