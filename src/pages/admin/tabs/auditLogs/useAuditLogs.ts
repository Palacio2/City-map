import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';

export interface AuditLogItem {
    id: string;
    created_at: string;
    admin_id?: string;
    action: string;
    target_table?: string;
    new_data?: any;
    old_data?: any;
}

export const useAuditLogs = () => {
    const { data: logs = [], isLoading: loadingLogs, refetch: refetchLogs } = useQuery<AuditLogItem[]>({
        queryKey: ['auditLogs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return (data || []) as AuditLogItem[];
        },
    });

    const { data: adminUsers = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['adminUsersList'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('admin-users-list');
            if (error) throw error;
            return data.users || [];
        }
    });

    const adminMap = useMemo(() => {
        const map: Record<string, string> = {};
        logs.forEach((log: AuditLogItem) => {
            if (log.admin_id) {
                const user = adminUsers.find((u: any) => u.id === log.admin_id);
                map[log.admin_id] = user ? user.email : `${log.admin_id.substring(0, 8)}...`;
            }
        });
        return map;
    }, [logs, adminUsers]);

    return { logs, loading: loadingLogs || loadingUsers, adminMap, fetchLogs: refetchLogs };
};