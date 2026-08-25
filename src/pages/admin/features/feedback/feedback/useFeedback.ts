import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@services/api';
import { useTranslation } from 'react-i18next';
import { useModals } from '@admin/core/context/ModalContext';
import { useActionLogger } from '@admin/core/context/useActionLogger';

export const useFeedback = (canDelete: boolean) => {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();
    const { withLogging } = useActionLogger();
    const [filter, setFilter] = useState('all');

    const { data: messages = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['feedbackMessages'],
        queryFn: () => api.feedback.getMessages()
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, screenshotUrl }: { id: string, screenshotUrl?: string }) => {
            if (screenshotUrl) {
                const fileName = screenshotUrl.split('/').pop();
                if (fileName) {
                    await withLogging('delete_feedback_image', () => api.feedback.deleteImage(fileName), { fileName });
                }
            }
            await withLogging('delete_feedback', () => api.feedback.deleteMessage(id), { id });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbackMessages'] }),
        onError: (error: unknown) => showAlert(t('common.error'), error instanceof Error ? error.message : 'Error', 'error')
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => 
            withLogging('update_feedback_status', () => api.feedback.updateStatus(id, newStatus), { id, newStatus }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbackMessages'] }),
        onError: (error: unknown) => showAlert(t('common.error'), error instanceof Error ? error.message : 'Error', 'error')
    });

    const handleDelete = (id: string, screenshotUrl?: string) => {
        if (!canDelete) return;
        showConfirm(
            t('admin_feedback.tab.delete_title'),
            t('admin_feedback.tab.confirm_delete'),
            () => deleteMutation.mutate({ id, screenshotUrl }),
            { confirmVariant: 'danger', confirmText: t('common.actions.delete') }
        );
    };

    const handleStatusChange = (id: string, newStatus: string) => statusMutation.mutate({ id, newStatus });

    const filteredMessages = useMemo(() => {
        return messages.filter((msg: { type?: string }) => {
            if (filter === 'all') return true;
            if (filter === 'contact') return msg.type === 'contact';
            if (filter === 'bug') return msg.type ? ['critical', 'data_error', 'ui_bug'].includes(msg.type) : false;
            if (filter === 'suggestion') return msg.type === 'suggestion';
            return true;
        });
    }, [messages, filter]);

    return {
        loading, filter, setFilter, filteredMessages,
        handleDelete, handleStatusChange, refetch
    };
};
