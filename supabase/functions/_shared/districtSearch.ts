import { canReadField, type FieldRule, type UserAccess } from './fieldAccess.ts';
import { RequestError } from './request.ts';
export function prepareDistrictFilters(input: unknown, fields: FieldRule[], access: UserAccess) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new RequestError('Invalid search filters');
  const active = Object.entries(input).filter(([,v]) => v !== null && v !== '' && v !== false && v !== 'any');
  if (access.isFree && active.length > 2) throw new RequestError('Free tier allows two active filters', 403);
  return active.map(([key,value]) => {
    const field = fields.find(item => item.field_code === key);
    if (!field || !canReadField(field, access)) throw new RequestError('Filter unavailable',403);
    if (!['string','number','boolean'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) throw new RequestError('Invalid filter value');
    const numeric = field.ui_component === 'input_number' && !key.endsWith('_count') && key !== 'crime_level';
    if (numeric && value !== true && (String(value).trim() === '' || !Number.isFinite(Number(value)))) throw new RequestError('Invalid numeric filter');
    if (key === 'crime_level' && !['low','medium','high'].includes(String(value))) throw new RequestError('Invalid crime filter');
    return { key,value,numeric,max: key.includes('price') || key.includes('cost') || key.includes('distance') };
  });
}
export function matchesDistrictFilters(data: Record<string,unknown> | null, filters: ReturnType<typeof prepareDistrictFilters>) {
  return filters.every(({key,value,numeric,max}) => {
    const raw=data?.[key];
    if (raw == null || raw === '') return false;
    if (value === true) return raw === true || (Number.isFinite(Number(raw)) && Number(raw)>0);
    if (key === 'crime_level') {
      const score=Number(raw);
      return Number.isFinite(score) && (score<4?'low':score<7?'medium':'high') === value;
    }
    if (numeric || key.includes('distance')) {
      const number=Number(raw), threshold=Number(value);
      return Number.isFinite(number) && Number.isFinite(threshold) && (max ? number>0 && number<=threshold : number>=threshold);
    }
    return String(raw).toLowerCase() === String(value).toLowerCase();
  });
}
