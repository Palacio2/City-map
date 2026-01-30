import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// Переконайтесь, що шлях правильний
import { fetchDashboardData } from '@api/statsApi'; 

const CACHE_KEY = 'user_stats_cache';

export function useStatsData(isPremium, isRealtor) {
  const { t } = useTranslation('stats');
  
  // 1. Початковий стан беремо з кешу, щоб сторінка не "мигала"
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

    // 🔥 ВИДАЛЯЄМО АБО КОМЕНТУЄМО ЦЕЙ БЛОК 🔥
    // Раніше він забороняв оновлення, якщо дані вже були
    /* if (data.stats && !forceReload) {
        setLoading(false);
        return;
    }
    */

    try {
      // Якщо даних немає взагалі - показуємо лоадер. 
      // Якщо є (з кешу) - оновлюємо їх у фоні без лоадера (SWR патерн)
      if (!data.stats) setLoading(true);
      setError(null);

      console.log("Fetching fresh stats..."); // Для дебагу
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
      // Якщо сталася помилка, але у нас є старі дані - не лякаємо користувача
      if (!data.stats) {
        setError(err.message || t('stats_page.error_unknown'));
      }
    } finally {
      setLoading(false);
    }
  }, [isPremium, isRealtor, t]); // Прибрав data.stats із залежностей

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { ...data, loading, error, reload: () => loadStats(true) };
}