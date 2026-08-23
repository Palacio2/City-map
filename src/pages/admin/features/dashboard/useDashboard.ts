import { useQuery } from '@tanstack/react-query';
import { adminDashboardApi } from '@admin/features/dashboard/adminDashboardApi';
import { useActionGuard } from '@admin/core/context/useActionGuard';

import { useState } from 'react';

export const useDashboard = () => {
  const { isSuperAdmin } = useActionGuard();
  const [chartDays, setChartDaysState] = useState<number>(() => {
    const saved = localStorage.getItem('admin_dashboard_chart_days');
    return saved ? parseInt(saved, 10) : 7;
  });

  const setChartDays = (days: number) => {
    localStorage.setItem('admin_dashboard_chart_days', days.toString());
    setChartDaysState(days);
  };

  const { data, isLoading: loading } = useQuery({
    queryKey: ['adminDashboardStats', chartDays],
    queryFn: () => adminDashboardApi.getStats(chartDays),
    staleTime: 60 * 1000
  });

  const stats = data?.stats || null;
  const chartData = data?.chartData || [];

  return {
    stats,
    chartData,
    loading,
    isSuperAdmin,
    chartDays,
    setChartDays
  };
};