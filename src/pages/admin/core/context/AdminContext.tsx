import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { supabase } from '@supabaseClient';
import { api } from '@services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminUser, AdminContextType } from '@admin/core/types/admin.types';

export type { AdminUser, AdminContextType };

const ADMIN_SESSION_KEY = 'admin_session_ended';

const AdminContext = createContext<AdminContextType>({
    currentAdmin: null,
    loadingAdmin: true,
    adminLogout: () => {},
    adminLogin: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const queryClient = useQueryClient();

    const { data: currentAdmin, isLoading: loadingAdmin } = useQuery({
        queryKey: ['adminProfile'],
        queryFn: async () => {
            if (sessionStorage.getItem(ADMIN_SESSION_KEY)) return null;
            const { data: { session }, error: sessionError } = await api.auth.getSession();
            if (sessionError) throw sessionError;
            if (!session) return null;

            // C4 fix: Verify MFA (AAL2) before granting admin access
            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aal?.currentLevel !== 'aal2' && aal?.nextLevel === 'aal2') {
                // User has MFA enrolled but hasn't verified yet — deny access
                return null;
            }
            
            const userId = session.user.id;
            const baseRole = session.user.app_metadata?.role || 'user';
            const profileData = await api.auth.getAdminProfile(userId).catch(() => null);
            
            return {
                id: userId,
                email: session.user.email || '',
                role: profileData?.role || baseRole,
                cities: profileData?.assigned_cities || [],
                allowed_tabs: profileData?.allowed_tabs || ['dashboard']
            };
        },
        staleTime: 5 * 60 * 1000,
    });

    // C5 fix: Actually terminate Supabase session on logout
    const adminLogout = useCallback(async () => {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        queryClient.setQueryData(['adminProfile'], null);
        await supabase.auth.signOut();
    }, [queryClient]);

    const adminLogin = useCallback(() => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
    }, [queryClient]);

    const value = useMemo(() => ({
        currentAdmin,
        loadingAdmin,
        adminLogout,
        adminLogin,
    }), [currentAdmin, loadingAdmin, adminLogout, adminLogin]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};