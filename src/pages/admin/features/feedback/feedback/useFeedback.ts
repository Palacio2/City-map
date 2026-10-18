import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { adminFeedbackApi } from './adminFeedbackApi';
import { useTranslation } from 'react-i18next';
import { useModals } from '@admin/core/context/ModalContext';
import { useActionLogger } from '@admin/core/context/useActionLogger';
import { adminQueryKeys } from '@admin/core/api/adminQueryKeys';
import { useAdminMutation } from '@admin/core/hooks/useAdminMutation';

export const useFeedback = (canDelete: boolean) => {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();
    const { withLogging } = useActionLogger();
    const [filter, setFilter] = useState('all');

    const { data: messages = [], isLoading: loading, refetch } = useQuery<import('./types').FeedbackMessage[]>({
        queryKey: ['feedbackMessages'],
        queryFn: adminFeedbackApi.getMessages,
        // Refresh before the server's 15-minute attachment URLs expire.
        refetchInterval: 10 * 60 * 1000,
        refetchOnWindowFocus: 'always',
    });

    const deleteMutation = useAdminMutation({
        mutationFn: ({ id }: { id: string }) => withLogging(
            'feedback.delete', () => adminFeedbackApi.deleteMessage(id), { id },
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.feedbackMessages });
            showAlert(t('common.success'), t('admin_feedback.tab.delete_success'), 'success');
        }
    });

    const statusMutation = useAdminMutation({
        mutationFn: ({ id, newStatus }: { id: string, newStatus: string }) => withLogging(
            'feedback.status', () => adminFeedbackApi.updateStatus(id, newStatus), { id, newStatus },
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.feedbackMessages });
        }
    });

    const handleDelete = (id: string) => {
        if (!canDelete) return;
        showConfirm(
            t('admin_feedback.tab.delete_title'),
            t('admin_feedback.tab.confirm_delete'),
            () => deleteMutation.mutate({ id }),
            { confirmVariant: 'danger', confirmText: t('common.actions.delete') }
        );
    };

    const handleStatusChange = (id: string, newStatus: string) => statusMutation.mutate({ id, newStatus });

    const filteredMessages = useMemo(() => {
        return messages.filter((msg: import('./types').FeedbackMessage) => {
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
