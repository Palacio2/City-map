import type { TransformedDistrict } from '@utils/dataTransformers';

export interface FavoritesContextType {
  favorites: TransformedDistrict[];
  isLoading: boolean;
  toggleFavorite: (district: Partial<TransformedDistrict> & { id: string | number }) => Promise<void>;
  isFavorite: (id: string | number) => boolean;
}

export interface FavoriteDistrictCardProps {
  readonly district: TransformedDistrict;
  readonly onClick: (d: TransformedDistrict) => void;
  readonly onCategoryClick: (d: TransformedDistrict, categoryKey: string) => void;
  readonly onRemove: (id: string | number) => void;
}