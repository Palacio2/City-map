import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useDistrictsQuery } from '../hooks/useDistrictsQuery';
import { FEATURES_CONFIG } from '@config/features';
import { STORAGE_KEYS } from '@config/constants';
import type { TransformedDistrict } from '@utils/dataTransformers';
import type { DistrictMapFilters } from '../types';

export const useDistrictMap = () => {
  const { country, city } = useParams<{ country: string; city: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFree } = useSubscription();
  const { config } = useFiltersConfig();

  const [selectedFilters, setSelectedFilters] = useState<DistrictMapFilters>({});
  const [selectedDistrict, setSelectedDistrict] = useState<TransformedDistrict | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const modalTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (country && city) {
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION, JSON.stringify({ country, city }));
      } catch {
        // Ignore quota/private browsing errors
      }
    }
  }, [country, city]);

  const { data: search, isLoading, error, refetch } = useDistrictsQuery(country, city, selectedFilters);
  const allDistricts = useMemo(() => search?.districts ?? [], [search]);

  useEffect(() => {
    const districtFromUrl = searchParams.get('district');
    if (districtFromUrl && allDistricts.length > 0) {
      const found = allDistricts.find(d => d.name === districtFromUrl);
      if (found) {
        setSelectedDistrict(found);
        setIsModalOpen(true);
        // Clear param so it doesn't reopen if modal is manually closed
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('district');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, allDistricts, setSearchParams]);

  const allowedCategories = useMemo(() => {
    if (!isFree || !config) return null;
    return Object.values(config)
      .filter(cat => !cat.isPremium)
      .map(cat => cat.key);
  }, [isFree, config]);

  const allFilteredDistricts = allDistricts;

  const totalCount = search?.total ?? 0;
  const originalTotal = search?.originalTotal ?? 0;

  const districtsToDisplay = useMemo(() => {
    if (isFree) {
      return allFilteredDistricts.slice(0, FEATURES_CONFIG.FREE_DISTRICTS_LIMIT);
    }
    return allFilteredDistricts;
  }, [allFilteredDistricts, isFree]);

  const listKey = useMemo(() =>
    `dist-list-${country}-${city}-${districtsToDisplay.length}-${JSON.stringify(selectedFilters)}`,
  [country, city, districtsToDisplay.length, selectedFilters]);

  const handleFiltersChange = useCallback((newFilters: DistrictMapFilters) => {
    setSelectedFilters(newFilters);
  }, []);

  const handleDistrictClick = useCallback((district: TransformedDistrict, categoryKey: string | null = null) => {
    setSelectedDistrict(district);
    setSelectedCategory(categoryKey);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    modalTimerRef.current = setTimeout(() => {
      setSelectedDistrict(null);
      setSelectedCategory(null);
    }, 300);
  }, []);

  return {
    country,
    city,
    isLoading,
    error,
    refetch,
    districtsToDisplay,
    totalCount,
    originalTotal,
    selectedFilters,
    allowedCategories,
    listKey,
    isModalOpen,
    selectedDistrict,
    selectedCategory,
    handleFiltersChange,
    handleDistrictClick,
    handleCloseModal
  };
};
