import { visibleFields, visiblePois, type FieldRule } from '../functions/_shared/fieldAccess.ts';
const fields: FieldRule[] = [
  { field_code: 'schools_count', is_active: true, is_premium: false, is_realtor_only: false },
  { field_code: 'average_rent_price', is_active: true, is_premium: true, is_realtor_only: false },
  { field_code: 'coworking_count', is_active: true, is_premium: false, is_realtor_only: true },
  { field_code: 'hidden_count', is_active: false, is_premium: false, is_realtor_only: false },
];
for (const plan of ['guest', 'free', 'weekly', 'premium', 'realtor']) {
  Deno.test(`field access respects ${plan} and excludes unknown/inactive columns`, () => {
    const access = { isFree: ['guest','free'].includes(plan), isPremium: ['weekly','premium','realtor'].includes(plan), isRealtor: plan === 'realtor' };
    const raw = { schools_count: 2, average_rent_price: 1000, coworking_count: 4, hidden_count: 9,
      unconfigured_secret: 123, average_rent_price_rating: 8, updated_at: '2026-10-10' };
    const result = visibleFields(raw, fields, access);
    if (result.schools_count !== 2 || result.updated_at !== raw.updated_at
      || ('average_rent_price' in result) !== access.isPremium || ('coworking_count' in result) !== access.isRealtor
      || 'hidden_count' in result || 'unconfigured_secret' in result || 'average_rent_price_rating' in result) throw new Error('Field leak');
    if (raw.hidden_count !== 9) throw new Error('Source mutated');
    const pois = visiblePois(JSON.stringify([{ type: 'schools' }, { type: 'coworking_count' }, { type: 'unknown' }, { type: 'hidden' }]), fields, access);
    if (pois.length !== (access.isRealtor ? 2 : 1)) throw new Error('POI leak');
  });
}
Deno.test('POI normalization rejects malformed objects, strings and conflicting aliases', () => {
  const access = { isFree: true, isPremium: false, isRealtor: false };
  for (const raw of ['{', {}, null, '[null,1,{},"schools"]']) {
    if (visiblePois(raw, fields, access).length) throw new Error('Malformed POI admitted');
  }
  const conflict = [...fields, { field_code: 'schools', is_active: true, is_premium: true, is_realtor_only: false }];
  if (visiblePois([{ type: 'schools' }], conflict, access).length) throw new Error('Alias bypass');
});
