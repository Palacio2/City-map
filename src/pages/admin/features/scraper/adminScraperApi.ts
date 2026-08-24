// src/pages/admin/features/scraper/adminScraperApi.ts
import { invokeAdminApi } from '@admin/core/api/adminGeoApi';
import { ScraperRule } from './types';

export const adminScraperApi = {
    getRules: () => invokeAdminApi<ScraperRule[]>('admin-scraper-manage', { action: 'getRules' }),
    insertRule: (payload: Record<string, unknown>) => invokeAdminApi('admin-scraper-manage', { action: 'insertRule', payload }),
    updateRule: (id: string | number, payload: Record<string, unknown>) => invokeAdminApi('admin-scraper-manage', { action: 'updateRule', payload: { ...payload, id } }),
    deleteRule: (id: string | number) => invokeAdminApi('admin-scraper-manage', { action: 'deleteRule', payload: { id } }),
};