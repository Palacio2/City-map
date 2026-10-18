import { parseFavoriteDistrict } from '../utils/statsData';
import type { WeeklyActivityData } from '../types';
export type { DashboardStats, WeeklyActivityData } from '../types';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../api/statsApi';



export function useStatsData(isPremium: boolean, isRealtor: boolean) {
  const { t } = useTranslation('db'); // Змінено на 'db'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userStatsDashboard'],
    queryFn: fetchDashboardData,
    enabled: isPremium,
    staleTime: 1000 * 60 * 5, 
    select: (result) => {
      const dbStats = result.stats;
      const mappedStats = dbStats ? {
        lastActive: dbStats.last_active,
        favoriteDistrict: parseFavoriteDistrict(dbStats.favorite_district),
        viewedDistricts: dbStats.viewed_districts_count ?? 0,
        totalTime: dbStats.total_time_seconds ?? 0,
        savedDistricts: dbStats.saved_districts_count ?? 0,
        comparisons: dbStats.comparison_count ?? 0
      } : null;

      return {
        stats: mappedStats,
        weeklyActivity: (Array.isArray(result?.weeklyActivity) ? result.weeklyActivity : []) as WeeklyActivityData[],
        popularDistricts: Array.isArray(result?.popularDistricts) ? result.popularDistricts : [],
        trackedDistricts: (isRealtor && Array.isArray(result?.trackedDistricts)) ? result.trackedDistricts : []
      };
    }
  });

  return {
    stats: data?.stats || null,
    weeklyActivity: data?.weeklyActivity || [],
    popularDistricts: data?.popularDistricts || [],
    trackedDistricts: data?.trackedDistricts || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : (error ? t('stats.errors.unknown') : null), // Ключ змінено
    reload: refetch
  };
}

