import { canReadField, visibleFields, type FieldRule, type UserAccess } from '../_shared/fieldAccess.ts';

const filters = [
  ['max_rent', 'average_rent_price', 'lte'],
  ['max_sale_sqm', 'average_sale_price_sqm', 'lte'],
  ['min_safety', 'safety_rating', 'gte'],
  ['min_transport', 'transport_rating', 'gte'],
  ['min_ecology', 'social_rating', 'gte'],
  ['needs_metro', 'metro_stations_count', 'gt'],
  ['needs_parks', 'parks_count', 'gt'],
] as const;

// Model-generated arguments are untrusted. Hidden fields must not be usable as
// predicates either: repeated yes/no searches can reconstruct their values.
export function districtToolFilters(args: Record<string, unknown>, fields: FieldRule[], access: UserAccess) {
  if (typeof args.city !== 'string' || !args.city.trim() || args.city.length > 150) throw new Error('Invalid city');
  const result: { column: string; operator: 'lte' | 'gte' | 'gt'; value: number }[] = [];
  for (const [arg, column, operator] of filters) {
    const value = args[arg];
    if (value === undefined || value === false) continue;
    const rule = fields.find(field => field.field_code === column);
    if (!rule || !canReadField(rule, access)) throw new Error('Requested field is unavailable for this subscription');
    if (operator === 'gt' ? value !== true : typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error('Invalid district filter');
    }
    result.push({ column, operator, value: operator === 'gt' ? 0 : value as number });
  }
  const limit = args.limit ?? 5;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Invalid result limit');
  return { city: args.city.trim(), limit, filters: result };
}

export function districtToolData(rows: Record<string, any>[], fields: FieldRule[], access: UserAccess) {
  return rows.map(row => {
    const raw = Array.isArray(row.district_filter_data) ? row.district_filter_data[0] : row.district_filter_data;
    return { name: row.name, cities: row.cities, district_filter_data: visibleFields(raw ?? {}, fields, access) };
  });
}
