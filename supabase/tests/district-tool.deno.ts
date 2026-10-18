import { districtToolFilters, districtToolData } from '../functions/gemini-chat/districtTool.ts';
import type { FieldRule } from '../functions/_shared/fieldAccess.ts';
const fields: FieldRule[] = [
  { field_code: 'average_rent_price', is_active: true, is_premium: true, is_realtor_only: false },
  { field_code: 'metro_stations_count', is_active: true, is_premium: false, is_realtor_only: false },
];
const free = { isFree: true, isPremium: false, isRealtor: false };
const premium = { isFree: false, isPremium: true, isRealtor: false };
function rejects(fn: () => unknown) { try { fn(); } catch { return; } throw new Error('Expected rejection'); }
Deno.test('AI cannot infer hidden, unknown or inactive fields through predicates', () => {
  rejects(() => districtToolFilters({ city: 'City', max_rent: 100 }, fields, free));
  rejects(() => districtToolFilters({ city: 'City', min_safety: 5 }, fields, premium));
  rejects(() => districtToolFilters({ city: 'City', max_rent: 0 }, [{ ...fields[0], is_active: false }], premium));
});
Deno.test('AI validates model-generated limits and values, including zero', () => {
  for (const args of [{ city: '' }, { city: '*' , limit: 10000 }, { city: 'City', limit: -1 },
    { city: 'City', max_rent: '100' }, { city: 'City', needs_metro: 'yes' }, { city: 'City', max_rent: Infinity }]) {
    rejects(() => districtToolFilters(args, fields, premium));
  }
  const criteria = districtToolFilters({ city: ' City ', max_rent: 0, needs_metro: true }, fields, premium);
  if (criteria.city !== 'City' || criteria.limit !== 5 || criteria.filters.length !== 2) throw new Error('Bad criteria');
});
Deno.test('AI tool only sends entitled fields to the model, for object and array relations', () => {
  for (const relation of [{ average_rent_price: 777, metro_stations_count: 2, secret: 999 },
    [{ average_rent_price: 777, metro_stations_count: 2, secret: 999 }]]) {
    const rows = [{ name: 'District', district_filter_data: relation }];
    const output = JSON.stringify(districtToolData(rows, fields, free));
    if (output.includes('777') || output.includes('999') || !output.includes('metro_stations_count')) throw new Error('Leaked fields');
    if (!JSON.stringify(districtToolData(rows, fields, premium)).includes('777')) throw new Error('Missing entitled data');
  }
});
