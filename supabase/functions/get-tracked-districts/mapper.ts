type Relation<T> = T | T[] | null;
interface FilterStats {
  average_rent_price?: number | null;
  average_sale_price_sqm?: number | null;
  average_property_price?: number | null;
}
interface TrackedDistrict {
  id: string; country: string; city: string; district: string;
  district_id: string; created_at: string;
  districts: Relation<{ updated_at?: string | null; district_filter_data: Relation<FilterStats> }>;
}
const firstRelated = <T>(value: Relation<T>): T | undefined => Array.isArray(value) ? value[0] : value ?? undefined;

export function mapTrackedDistrict(item: TrackedDistrict, sanitize: (stats: FilterStats) => FilterStats = stats => stats) {
  const district = firstRelated(item.districts);
  const raw = district ? firstRelated(district.district_filter_data) : undefined;
  const stats = raw ? sanitize(raw) : undefined;
  return {
    id: item.id, country: item.country, city: item.city, district: item.district, district_id: item.district_id,
    rental_price: stats?.average_rent_price ?? undefined,
    sale_price: stats?.average_sale_price_sqm ?? stats?.average_property_price ?? undefined,
    updated_at: district?.updated_at || item.created_at,
  };
}
