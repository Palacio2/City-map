import React, { createContext, useContext, useMemo } from 'react';
// @ts-ignore
import { api } from '../../../services/api';
import { useQuery } from '@tanstack/react-query';

export interface AdminUser {
    id: string;
    email: string;
    role: string;
    cities: string[];
    allowed_tabs: string[];
}

export interface AdminContextType {
    currentAdmin: AdminUser | null | undefined;
    loadingAdmin: boolean;
}

const AdminContext = createContext<AdminContextType>({
    currentAdmin: null,
    loadingAdmin: true,
});

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: currentAdmin, isLoading: loadingAdmin } = useQuery({
        queryKey: ['adminProfile'],
        queryFn: async () => {
            const { data: { session }, error: sessionError } = await api.auth.getSession();
            if (sessionError) throw sessionError;
            if (!session) return null;
            const userId = session.user.id;
            const baseRole = session.user.app_metadata?.role || 'user';
            const profileData = await api.auth.getAdminProfile(userId).catch(() => null);
            return {
                id: userId,
                email: session.user.email,
                role: profileData?.role || baseRole,
                cities: profileData?.assigned_cities || [],
                allowed_tabs: profileData?.allowed_tabs || ['dashboard']
            };
        },
        staleTime: Infinity
    });

    const value = useMemo(() => ({
        currentAdmin,
        loadingAdmin
    }), [currentAdmin, loadingAdmin]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};