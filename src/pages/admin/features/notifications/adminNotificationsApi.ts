import { invokeAdminApi } from '@admin/core/api/adminGeoApi';
import { NotificationItem } from '@admin/core/types/ui.types';

export const adminNotificationsApi = {
    getAll: async () => {
        const res = await invokeAdminApi<{ notifications: NotificationItem[] }>('admin-notifications-manage', { action: 'get_all' });
        return res.notifications || [];
    },
    create: (payload: { message: string; type: string; is_active: boolean }) => 
        invokeAdminApi('admin-notifications-manage', { action: 'create', payload }),
    updateStatus: (id: string, is_active: boolean) => 
        invokeAdminApi('admin-notifications-manage', { action: 'update_status', payload: { id, is_active } }),
    delete: (id: string) => 
        invokeAdminApi('admin-notifications-manage', { action: 'delete', payload: { id } }),
};