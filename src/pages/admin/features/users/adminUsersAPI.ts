import { invokeAdminApi } from '@admin/core/api/adminApiClient';
import type { UserRow, AdminUsersAPI } from './types';

export const adminUsersAPI: AdminUsersAPI & {
    getUsers: () => Promise<UserRow[]>;
    updateUser: (targetUserId: string, action: string, payload?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    updateAdminCities: (userId: string, cities: string[]) => Promise<Record<string, unknown>>;
    updateAdminTabs: (userId: string, tabs: string[]) => Promise<Record<string, unknown>>;
    updateRole: (userId: string, role: string) => Promise<Record<string, unknown>>;
    deleteUser: (userId: string) => Promise<Record<string, unknown>>;
    terminateUserSessions: (userId: string) => Promise<Record<string, unknown>>;
} = {
    getUsers: async () => {
        const data = await invokeAdminApi<{ users?: UserRow[] } | UserRow[]>('admin-users-manage', { action: 'get_all' });
        if (Array.isArray(data)) return data;
        return data?.users || [];
    },
    updateUser: (targetUserId: string, action: string, payload: Record<string, unknown> = {}) =>
        invokeAdminApi<Record<string, unknown>>('admin-users-manage', { targetUserId, action, payload }),
    manageFinance: (action: string, payload: Record<string, unknown> = {}) =>
        invokeAdminApi<{ codes?: { id: string; code: string; [key: string]: unknown }[] } | Record<string, unknown>>('admin-stripe-manage', { action, payload }),
    updateAdminCities: (userId: string, cities: string[]) =>
        adminUsersAPI.updateUser(userId, 'update_cities', { cities }),
    updateAdminTabs: (userId: string, tabs: string[]) =>
        adminUsersAPI.updateUser(userId, 'update_tabs', { tabs }),
    updateRole: (userId: string, role: string) =>
        adminUsersAPI.updateUser(userId, 'update_role', { role }),
    deleteUser: (userId: string) => adminUsersAPI.updateUser(userId, 'delete_user'),
    terminateUserSessions: (userId: string) => adminUsersAPI.updateUser(userId, 'terminate_sessions'),
};
