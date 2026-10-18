import { invokeAdminApi } from '@admin/core/api/adminGeoApi';
import { DashboardStatsResponse } from './types';

export const adminDashboardApi = {
    getStats: (days: number = 7): Promise<DashboardStatsResponse> => invokeAdminApi('admin-dashboard-stats', { days }),
};