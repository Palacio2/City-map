import { it, expect } from 'vitest';
import { parseFavoriteDistrict } from './statsData';

it('normalizes flat and joined favorite locations without trusting arbitrary JSON properties', () => {
  expect(parseFavoriteDistrict({ name: 'District', city: 'City', country: 'Country' })).toEqual({ name: 'District', district: undefined, city: 'City', country: 'Country' });
  expect(parseFavoriteDistrict({ district: 'District', cities: { name: 'City', countries: { name: 'Country' } } })).toEqual({ name: undefined, district: 'District', city: 'City', country: 'Country' });
  for (const value of [null, 'District', [], 42]) expect(parseFavoriteDistrict(value)).toBeUndefined();
  expect(parseFavoriteDistrict({ name: {}, city: 12, country: false })).toEqual({ name: undefined, district: undefined, city: undefined, country: undefined });
});
