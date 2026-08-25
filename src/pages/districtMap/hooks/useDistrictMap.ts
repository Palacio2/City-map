import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSubscription } from '@subscription/contex/SubscriptionContext';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useDistrictsQuery } from '../hooks/useDistrictsQuery';
import { filterDistrictsByCriteria } from '@filtersPanel/filterLogic';
import { FEATURES_CONFIG } from '@config/features';
import type { TransformedDistrict } from '@utils/dataTransformers';
import type { DistrictMapFilters } from '../types';

export const useDistrictMap = () => {
  const { country, city } = useParams<{ country: string; city: string }>();
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

  const { data: allDistricts = [], isLoading, error, refetch } = useDistrictsQuery(country, city);

  const allowedCategories = useMemo(() => {
    if (!isFree || !config) return null;
    return Object.values(config)
      .filter(cat => !cat.isPremium)
      .map(cat => cat.key);
  }, [isFree, config]);

  const allFilteredDistricts = useMemo(() => {
    return filterDistrictsByCriteria(allDistricts, selectedFilters, config);
  }, [allDistricts, selectedFilters, config]);

  const totalCount = allFilteredDistricts.length;
  const originalTotal = allDistricts.length;

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