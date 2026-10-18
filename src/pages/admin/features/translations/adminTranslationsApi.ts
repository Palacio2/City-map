import { invokeAdminApi } from '@admin/core/api/adminGeoApi';

export const adminTranslationsApi = {
    getAll: () => invokeAdminApi('admin-translations-manage', { action: 'get_all' }),
    insert: (payload: Record<string, unknown>) => invokeAdminApi('admin-translations-manage', { action: 'insert', payload }),
    update: (key: string, updates: { uk: string; pl: string; en: string }) => invokeAdminApi('admin-translations-manage', { action: 'update', payload: { key, updates } }),
    delete: (key: string) => invokeAdminApi('admin-translations-manage', { action: 'delete', payload: { key } }),
    deleteMany: (keys: string[]) => invokeAdminApi('admin-translations-manage', { action: 'delete_many', payload: { keys } }),
};