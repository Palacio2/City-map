import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { useModals } from '../../ui/ModalContext';

export const useAiLogs = (isSuperAdmin) => {
    const { t } = useTranslation('admin');
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();

    const { data: logs = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['aiLogs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data || [];
        },
    });

    const aiEnabled = logs.find(l => l.log_type === 'system')?.system_action === 'enabled_ai' ?? true;

    const toggleMutation = useMutation({
        mutationFn: async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;

            const newAction = aiEnabled ? 'disabled_ai' : 'enabled_ai';
            const { error } = await supabase.from('ai_system_logs').insert([{
                user_id: user.id,
                user_email: user.email,
                log_type: 'system',
                system_action: newAction
            }]);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiLogs'] });
        },
        onError: (err) => showAlert(t('common.error'), err.message || t('aiLogsTab.saveError'), 'error')
    });

    const toggleAi = () => {
        if (!isSuperAdmin) return;
        showConfirm(
            t('aiLogsTab.confirmTitle'), 
            t('aiLogsTab.confirmToggle'), 
            () => toggleMutation.mutate(),
            { 
                confirmText: aiEnabled ? t('aiLogsTab.turnOff') : t('aiLogsTab.turnOn'), 
                confirmVariant: aiEnabled ? 'danger' : 'primary' 
            }
        );
    };

    return { aiEnabled, logs, loading, saving: toggleMutation.isPending, toggleAi, fetchData: refetch };
};