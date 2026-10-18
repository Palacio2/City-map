export interface UserAccess { isFree: boolean; isPremium: boolean; isRealtor: boolean }
export interface FieldRule { field_code: string; is_premium: boolean; is_realtor_only: boolean; is_active: boolean; ui_group?: string; data_type?: string; ui_component?: string }
const ratingGroups: Record<string, string> = {
  education_rating: 'education', medicine_rating: 'medicine', transport_rating: 'transport',
  safety_rating: 'security', security_rating: 'security', commerce_rating: 'commerce',
  economics_rating: 'economics', sports_rating: 'sports', culture_leisure_rating: 'culture_leisure',
  utilities_quality_rating: 'utilities', social_rating: 'social', street_lighting_rating: 'security',
};
const metadata = new Set(['data_updated_at', 'last_updated', 'updated_at']);
export function canReadField(field: FieldRule, access: UserAccess) {
  return field.is_active === true && (!field.is_premium || access.isPremium)
    && (!field.is_realtor_only || access.isRealtor);
}
export function visibleFields(data: Record<string, unknown>, fields: FieldRule[], access: UserAccess) {
  const rules = new Map(fields.map(field => [field.field_code, field]));
  return Object.fromEntries(Object.entries(data).filter(([key]) => {
    const field = rules.get(key);
    if (field) return canReadField(field, access);
    if (Object.hasOwn(ratingGroups, key)) {
      // Derived data may not disclose a category with restricted inputs.
      const inputs = fields.filter(rule => rule.ui_group === ratingGroups[key]);
      return inputs.length > 0 && inputs.every(rule => canReadField(rule, access));
    }
    return metadata.has(key);
  }));
}
export function visiblePois(input: unknown, fields: FieldRule[], access: UserAccess) {
  let parsed = input;
  if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { return []; } }
  if (!Array.isArray(parsed)) return [];
  const rules = new Map(fields.map(field => [field.field_code, field]));
  return parsed.filter(poi => {
    const type = Array.isArray(poi) ? poi[2] : poi?.type;
    if (typeof type !== 'string') return false;
    if (Array.isArray(poi) && (!Number.isFinite(poi[0]) || !Number.isFinite(poi[1]) || Math.abs(poi[0]) > 90 || Math.abs(poi[1]) > 180)) return false;
    const matches = [rules.get(type), rules.get(type + '_count')].filter((r): r is FieldRule => !!r);
    return matches.length > 0 && matches.every(rule => canReadField(rule, access));
  });
}
