import { useCallback } from 'react';
import { useStorageState } from './useStorageState';

export function useCollapsibleSections(storageKey: string, defaultOpen: string[] = []) {
  const [openSections, setOpenSections] = useStorageState<string[]>(storageKey, defaultOpen);

  const toggle = useCallback((sectionKey: string) => {
    setOpenSections(prev =>
      prev.includes(sectionKey)
        ? prev.filter(k => k !== sectionKey)
        : [...prev, sectionKey]
    );
  }, [setOpenSections]);

  const isOpen = useCallback((sectionKey: string) => openSections.includes(sectionKey), [openSections]);

  return { openSections, toggle, isOpen };
}
