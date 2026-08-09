import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import type { TransformedDistrict } from '@utils/dataTransformers';

const getColumnsCount = (width: number): number => {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
};

export const useFavoritesPage = () => {
  const { favorites, isLoading, toggleFavorite } = useFavorites();
  const [selectedDistrict, setSelectedDistrict] = useState<TransformedDistrict | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [columns, setColumns] = useState<number>(1);

  useEffect(() => {
    setColumns(getColumnsCount(window.innerWidth));
    const handleResize = () => setColumns(getColumnsCount(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDistrictClick = useCallback((district: TransformedDistrict) => {
    setSelectedDistrict(district);
    setSelectedCategory(null);
  }, []);

  const handleCategoryClick = useCallback((district: TransformedDistrict, categoryKey: string) => {
    setSelectedDistrict(district);
    setSelectedCategory(categoryKey);
  }, []);

  const handleRemove = useCallback((id: string | number) => {
    toggleFavorite({ id } as Partial<TransformedDistrict> & { id: string | number });
  }, [toggleFavorite]);

  const closeModal = useCallback(() => {
    setSelectedDistrict(null);
    setSelectedCategory(null);
  }, []);

  const rows = useMemo(() => {
    const chunked = [];
    for (let i = 0; i < favorites.length; i += columns) {
      chunked.push(favorites.slice(i, i + columns));
    }
    return chunked;
  }, [favorites, columns]);

  return {
    favorites,
    isLoading,
    rows,
    selectedDistrict,
    selectedCategory,
    handleDistrictClick,
    handleCategoryClick,
    handleRemove,
    closeModal,
  };
};