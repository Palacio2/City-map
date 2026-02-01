import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDashboardData } from '@api/statsApi'; 

const CACHE_KEY = 'user_stats_cache';

export function useStatsData(isPremium, isRealtor) {
  const { t } = useTranslation(['stats', 'common']);
  
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {
        stats: null,
        weeklyActivity: [],
        popularDistricts: [],
        trackedDistricts: [] 
      };
    } catch {
      return { stats: null, weeklyActivity: [], popularDistricts: [], trackedDistricts: [] };
    }
  });

  const [loading, setLoading] = useState(!data.stats);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async (forceReload = false) => {
    if (!isPremium) return;

    try {

      if (!data.stats) setLoading(true);
      setError(null);

      const result = await fetchDashboardData();
      
      const newData = {
        stats: result.stats,
        weeklyActivity: Array.isArray(result.weeklyActivity) ? result.weeklyActivity : [],
        popularDistricts: Array.isArray(result.popularDistricts) ? result.popularDistricts : [],
        trackedDistricts: (isRealtor && Array.isArray(result.trackedDistricts)) 
          ? result.trackedDistricts 
          : []
      };

      setData(newData);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(newData));

    } catch (err) {
      console.error("Stats load error:", err);
      if (!data.stats) {
        setError(err.message || t('stats:stats_page.error_unknown'));
      }
    } finally {
      setLoading(false);
    }
  }, [isPremium, isRealtor, t]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { ...data, loading, error, reload: () => loadStats(true) };
}