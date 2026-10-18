import { ReactNode, FormEvent } from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  sublabel?: string;
  badge?: string;
}

export interface Country {
  value: string;
  label?: string;
  is_available?: boolean;
}

export interface City {
  value: string;
  name?: string;
  is_available?: boolean;
}

export interface RecentLocationItem {
  id: string;
  country: string;
  city: string;
  timestamp: number;
}

export interface PopularCityItem {
  id: string;
  city: string;
  country: string;
  tagKey?: string;
  fallbackTag?: string;
  districtsCount?: number;
  visits?: number;
  is_available?: boolean;
  iconType?: 'capital' | 'tech' | 'culture' | 'sea' | 'hub';
}

export interface LocationComboboxProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder: string;
  icon?: ReactNode;
  id?: string;
  label?: string;
  badge?: string;
}

export interface LocationDualSelectorProps {
  countryOptions: SelectOption[];
  cityOptions: SelectOption[];
  selectedCountry: string;
  selectedCity: string;
  onCountryChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoadingCountries: boolean;
  isLoadingCities: boolean;
}

export interface PopularLocationsProps {
  selectedCountry?: string;
  popularCities: PopularCityItem[];
  isLoading: boolean;
  onSelectLocation: (country: string, city: string) => void;
}

export interface LocationCardProps {
  item: PopularCityItem;
  onClick: (country: string, city: string) => void;
}

export interface RecentLocationsProps {
  locations: RecentLocationItem[];
  onSelect: (country: string, city: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export interface UseComboboxFilterProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export interface UseCityCountryDataReturn {
  countries: Array<{ value: string; label?: string; is_available?: boolean }>;
  cities: Array<{ value: string; name?: string; is_available?: boolean }>;
  countryOptions: SelectOption[];
  cityOptions: SelectOption[];
  isLoadingCountries: boolean;
  isLoadingCities: boolean;
  isError: boolean;
  refetchCountries: () => void;
}