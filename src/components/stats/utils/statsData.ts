import type { FavoriteDistrictData } from '../types';

export function parseFavoriteDistrict(value: unknown): FavoriteDistrictData | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  const cities = item.cities && typeof item.cities === 'object' ? item.cities as Record<string, unknown> : {};
  const countries = cities.countries && typeof cities.countries === 'object' ? cities.countries as Record<string, unknown> : {};
  const text = (v: unknown) => typeof v === 'string' ? v : undefined;
  return {
    name: text(item.name), district: text(item.district),
    city: text(item.city) ?? text(cities.name), country: text(item.country) ?? text(countries.name),
  };
}
