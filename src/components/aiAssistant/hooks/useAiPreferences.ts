import { useCallback } from 'react';
import type { AiPreferences } from '../types';
import { useStorageState } from '@/shared/hooks/useStorageState';
import { STORAGE_KEYS } from '@config/constants';

const PREFS_KEY = STORAGE_KEYS.AI_PREFS;

export const useAiPreferences = () => {
  const [preferences, setPreferences] = useStorageState<AiPreferences | null>(PREFS_KEY, null, 'localStorage');

  const savePreferences = useCallback((newPrefs: AiPreferences) => {
    setPreferences(newPrefs);
  }, [setPreferences]);

  const clearPreferences = useCallback(() => {
    setPreferences(null);
  }, [setPreferences]);

  return { preferences, savePreferences, clearPreferences };
};