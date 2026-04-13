// hooks/useFiltersConfig.ts
import { useState, useEffect } from 'react';
import { DynamicDistrictConfig } from '@config/districtFields';

// Простий in-memory кеш, щоб не смикати API при кожному рендері компонента
let cachedConfig: DynamicDistrictConfig | null = null;

export const useFiltersConfig = () => {
  const [config, setConfig] = useState<DynamicDistrictConfig | null>(cachedConfig);
  const [isLoading, setIsLoading] = useState(!cachedConfig);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedConfig) return;

    const fetchConfig = async () => {
      try {
        // Змініть URL на ваш реальний шлях до Supabase Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-filters-config`, {
            headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch filters config');
        
        const data = await response.json();
        cachedConfig = data;
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading, error };
};