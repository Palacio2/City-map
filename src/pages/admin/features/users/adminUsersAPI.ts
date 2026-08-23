import { supabase } from '@supabaseClient';

export const adminUsersAPI = {
    getUsers: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users-manage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'get_all' })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch users');
        }
        const data = await response.json();
        return data.users || data;
    },

    updateUser: async (targetUserId: string, action: string, value: unknown) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users-manage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUserId, action, payload: value })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to update user');
        }
        return response.json();
    },

    manageFinance: async (action: string, payload: Record<string, unknown> = {}) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stripe-manage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, payload })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Finance operation failed');
        }
        return response.json();
    },

    updateAdminCities: async (userId: string, cities: string[]) => {
        return await adminUsersAPI.updateUser(userId, 'update_cities', cities);
    },

    updateAdminTabs: async (userId: string, tabs: string[]) => {
        return await adminUsersAPI.updateUser(userId, 'update_tabs', tabs);
    },

    updateRole: async (userId: string, role: string) => {
        return await adminUsersAPI.updateUser(userId, 'update_role', role);
    },

    deleteUser: async (userId: string) => {
        return await adminUsersAPI.updateUser(userId, 'delete_user', null);
    },

    terminateUserSessions: async (userId: string) => {
        return await adminUsersAPI.updateUser(userId, 'terminate_sessions', null);
    }
};
