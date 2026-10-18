import { useState, useCallback } from 'react';

export function useStorageState<T>(
  key: string,
  defaultValue: T,
  storageType: 'localStorage' | 'sessionStorage' = 'sessionStorage'
): [T, (value: T | ((prev: T) => T)) => void] {
  
  const getStorage = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        return window[storageType];
      }
    } catch {
      return null;
    }
    return null;
  }, [storageType]);

  const [state, setState] = useState<T>(() => {
    try {
      const storage = getStorage();
      if (!storage) return defaultValue;
      const stored = storage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        const storage = getStorage();
        if (storage) {
          storage.setItem(key, JSON.stringify(nextValue));
        }
      } catch { 
        // Ignore quota exceeded or Safari incognito security errors
      }
      return nextValue;
    });
  }, [key, getStorage]);

  return [state, setStoredState];
}
