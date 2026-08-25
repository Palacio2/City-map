// src/pages/admin/features/fields/adminFieldsApi.ts
import { invokeAdminApi } from '@admin/core/api/adminGeoApi';

export const adminFieldsApi = {
    getFields: () => invokeAdminApi('admin-fields-manage', { action: 'get_fields' }),
    getGroups: () => invokeAdminApi('admin-fields-manage', { action: 'get_groups' }),
    insertField: (payload: Record<string, unknown>) => invokeAdminApi('admin-fields-manage', { action: 'create_field', payload }),
    updateField: (id: string | number, payload: Record<string, unknown>) => invokeAdminApi('admin-fields-manage', { action: 'update_field', payload: { id, updates: payload } }),
    deleteField: (id: string | number) => invokeAdminApi('admin-fields-manage', { action: 'delete_field', payload: { id } }),
};