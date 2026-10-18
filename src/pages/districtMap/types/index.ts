import type { TransformedDistrict } from '@utils/dataTransformers';

export interface ComparisonPayload {
  name: string;
  city: string;
  country: string;
  priceRent: number;
  priceSale: number;
}


export interface DistrictCardProps {
  district: TransformedDistrict;
  isFavorite?: boolean;
  isPriority?: boolean;
  onClick: (district: TransformedDistrict, categoryKey?: string | null) => void;
  onCategoryClick?: (district: TransformedDistrict, categoryKey: string) => void;
  onFavoriteToggle?: (districtId: string | number) => void;
}

export interface DistrictsMapProps {
  readonly districts: TransformedDistrict[];
  readonly onDistrictClick: (district: TransformedDistrict, categoryKey?: string | null) => void;
  readonly filters?: DistrictMapFilters;
  readonly totalCount?: number;
  readonly originalTotal?: number;
  readonly selectedFilters?: DistrictMapFilters;
}

export type DistrictMapFilters = import('@filtersPanel/filterLogic').Filters;