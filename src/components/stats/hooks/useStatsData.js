import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDashboardData } from '../../api/statsApi';

const CACHE_KEY = 'user_stats_cache';

export function useStatsData(isPremium) {
  const { t } = useTranslation('stats');
  
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {
        stats: null,
        weeklyActivity: [],
        popularDistricts: []
      };
    } catch {
      return { stats: null, weeklyActivity: [], popularDistricts: [] };
    }
  });

  const [loading, setLoading] = useState(!data.stats);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    if (!isPremium) return;

    try {
      // Якщо даних немає взагалі - показуємо лоадер.
      // Якщо дані є (з кешу) - оновлюємо "тихо" фоном.
      if (!data.stats) setLoading(true);
      setError(null);

      const result = await fetchDashboardData();
      
      const newData = {
        stats: result.stats,
        weeklyActivity: Array.isArray(result.weeklyActivity) ? result.weeklyActivity : [],
        popularDistricts: Array.isArray(result.popularDistricts) ? result.popularDistricts : []
      };

      setData(newData);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(newData));

    } catch (err) {
      // Показуємо помилку тільки якщо немає кешованих даних.
      // Якщо старі дані є - краще показати їх, ніж екран помилки.
      if (!data.stats) {
        setError(err.message || t('stats_page.error_unknown'));
      }
    } finally {
      setLoading(false);
    }
  }, [isPremium, t, data.stats]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...data, loading, error, reload: loadStats };
}