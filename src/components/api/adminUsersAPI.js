import { supabase } from '@supabaseClient';

export const adminUsersAPI = {
    getUsers: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch users');
        }
        return response.json();
    },

    updateUser: async (targetUserId, action, value) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-admin-user`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUserId, action, value })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to update user');
        }
        return response.json();
    },

    manageFinance: async (action, payload = {}) => {
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
    }
};