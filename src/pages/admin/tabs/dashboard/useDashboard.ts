// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';

export const useDashboard = (currentAdmin) => {
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const { data, isLoading } = useQuery({
        queryKey: ['dashboardStats', currentAdmin?.id],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('admin-dashboard-stats', {
                method: 'POST'
            });
            if (error) throw error;
            return data;
        },
        enabled: !!currentAdmin
    });

    return { 
        stats: data?.stats || null, 
        chartData: data?.chartData || [], 
        loading: isLoading, 
        isSuperAdmin 
    };
};
