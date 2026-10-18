import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { UseComboboxFilterProps } from '../types';

const normalize = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function useComboboxFilter({
  options,
  value,
  onChange,
  disabled = false,
}: UseComboboxFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const selectedLabel = selectedOption?.label || '';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!isOpen || !search.trim()) {
      return options;
    }
    const term = normalize(search.trim());
    return options.filter((opt) => normalize(opt.label).includes(term));
  }, [options, search, isOpen]);

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions]);

  const selectOption = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setSearch('');
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  const clearSelection = useCallback(() => {
    onChange('');
    setSearch('');
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        setHighlightedIndex((prev) => {
          const next = prev + 1;
          return next >= filteredOptions.length ? 0 : next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        setHighlightedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filteredOptions.length - 1 : next;
        });
      } else if (e.key === 'Enter') {
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            selectOption(opt.value);
          }
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      }
    },
    [disabled, isOpen, filteredOptions, highlightedIndex, selectOption]
  );

  return {
    isOpen,
    setIsOpen,
    search,
    setSearch,
    highlightedIndex,
    setHighlightedIndex,
    wrapperRef,
    inputRef,
    selectedLabel,
    filteredOptions,
    selectOption,
    clearSelection,
    handleKeyDown,
  };
}
