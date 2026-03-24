import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../services/api';
import { useTranslation } from 'react-i18next';
import { useModals } from '../../ui/ModalContext';

export const useFeedback = (isSuperAdmin) => {
    const { t } = useTranslation('adminFeedback');
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all');

    const { data: messages = [], isLoading: loading } = useQuery({
        queryKey: ['feedbackMessages'],
        queryFn: () => api.feedback.getMessages()
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, screenshotUrl }) => {
            if (screenshotUrl) {
                const fileName = screenshotUrl.split('/').pop();
                if (fileName) await api.feedback.deleteImage(fileName);
            }
            await api.feedback.deleteMessage(id);
        },
        onSuccess: () => queryClient.invalidateQueries(['feedbackMessages']),
        onError: (error) => showAlert(t('common.error'), error.message, 'error')
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, newStatus }) => api.feedback.updateStatus(id, newStatus),
        onSuccess: () => queryClient.invalidateQueries(['feedbackMessages']),
        onError: (error) => showAlert(t('common.error'), error.message, 'error')
    });

    const handleDelete = (id, screenshotUrl) => {
        if (!isSuperAdmin) return;
        showConfirm(
            t('feedbackTab.deleteTitle'),
            t('feedbackTab.confirmDelete'),
            () => deleteMutation.mutate({ id, screenshotUrl })
        );
    };

    const handleStatusChange = (id, newStatus) => statusMutation.mutate({ id, newStatus });

    const filteredMessages = messages.filter(msg => {
        if (filter === 'all') return true;
        if (filter === 'contact') return msg.type === 'contact';
        if (filter === 'bug') return ['critical', 'data_error', 'ui_bug'].includes(msg.type);
        if (filter === 'suggestion') return msg.type === 'suggestion';
        return true;
    });

    return {
        loading, filter, setFilter, filteredMessages,
        handleDelete, handleStatusChange, fetchMessages: () => queryClient.invalidateQueries(['feedbackMessages'])
    };
};