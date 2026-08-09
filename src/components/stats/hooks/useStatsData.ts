import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../api/statsApi';

export interface WeeklyActivityData {
  date: string;
  searches: number;
  comparisons?: number;
  dayLabel?: string;
}

export interface DashboardStats {
  lastActive?: string;
  favoriteDistrict?: string;
  [key: string]: any;
}

export function useStatsData(isPremium: boolean, isRealtor: boolean) {
  const { t } = useTranslation('db'); // Змінено на 'db'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userStatsDashboard'],
    queryFn: fetchDashboardData,
    enabled: isPremium,
    staleTime: 1000 * 60 * 5, 
    select: (result) => {
      const dbStats = result?.stats as any;
      const mappedStats = dbStats ? {
        ...dbStats,
        lastActive: dbStats.last_active,
        favoriteDistrict: dbStats.favorite_district
      } : null;

      return {
        stats: mappedStats as DashboardStats | null,
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