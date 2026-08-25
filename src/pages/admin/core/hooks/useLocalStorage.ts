// src/pages/admin/core/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            if (item && item !== 'undefined') {
                return JSON.parse(item);
            }
            return initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        if (state === null || state === undefined || state === '') {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(state));
        }
    }, [key, state]);

    return [state, setState] as const;
}