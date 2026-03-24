import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';

export const useAuditLogs = () => {
    const { data: logs = [], isLoading: loadingLogs, refetch } = useQuery({
        queryKey: ['auditLogs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return data || [];
        },
    });

    // Створюємо карту адміністраторів по їх ID напряму з бази
    const adminMap = useMemo(() => {
        const map = {};
        logs.forEach(log => {
            if (log.admin_id) {
                map[log.admin_id] = log.admin_id.substring(0, 8) + '...'; 
            }
        });
        return map;
    }, [logs]);

    return { logs, loading: loadingLogs, adminMap, fetchLogs: refetch };
};