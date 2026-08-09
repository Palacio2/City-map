import { useState, useCallback } from 'react';
import type { AiPreferences } from '../types';

const PREFS_KEY = 'geo_analyzer_ai_prefs';

export const useAiPreferences = () => {
  const [preferences, setPreferences] = useState<AiPreferences | null>(() => {
    const stored = localStorage.getItem(PREFS_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AiPreferences;
    } catch {
      return null;
    }
  });

  const savePreferences = useCallback((newPrefs: AiPreferences) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    setPreferences(newPrefs);
  }, []);

  const clearPreferences = useCallback(() => {
    localStorage.removeItem(PREFS_KEY);
    setPreferences(null);
  }, []);

  return { preferences, savePreferences, clearPreferences };
};