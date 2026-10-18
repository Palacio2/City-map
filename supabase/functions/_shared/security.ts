import { publishableKey, secretKey } from './keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { subscriptionState } from './subscriptionState.ts';
import { visibleFields, type FieldRule, type UserAccess } from './fieldAccess.ts';
export type { UserAccess, FieldRule } from './fieldAccess.ts';
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'private, no-store',
};
export const getSupabaseClient = (authHeader: string | null) => createClient(
  Deno.env.get('SUPABASE_URL') ?? '', publishableKey(),
  authHeader ? { global: { headers: { Authorization: authHeader } } } : {},
);
// Server-only data reads. Never forward a caller's Authorization to this client.
// Callers must enforce ownership/availability and strip fields before returning data.
export function getDistrictDataClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = secretKey();
  if (!url || !key) throw new Error('District data service unavailable');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
const free: UserAccess = { isFree: true, isPremium: false, isRealtor: false };
export async function getUserAccess(req: Request): Promise<UserAccess> {
  const header = req.headers.get('Authorization');
  if (!header) return { ...free };
  const db = getSupabaseClient(header);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return { ...free };
  const { data, error } = await db.from('user_subscriptions')
    .select('id, plan_name, status, payment_id, starts_at, ends_at, cancel_at')
    .eq('user_id', user.id).in('status', ['active', 'trialing']).limit(501);
  if (error || !data || data.length > 500) throw new Error('Subscription verification unavailable');
  const { plan } = subscriptionState(data);
  return { isFree: plan === 'free', isPremium: ['weekly', 'premium', 'realtor'].includes(plan), isRealtor: plan === 'realtor' };
}
// Read access rules per request so revoked fields do not remain public in a warm worker.
export async function getFieldsConfig(): Promise<FieldRule[]> {
  const { data, error } = await getSupabaseClient(null).from('fields_config')
    .select('field_code, is_premium, is_realtor_only, is_active, ui_group, data_type, ui_component').limit(1001);
  if (error || !data?.length || data.length > 1000) throw new Error('Field access configuration unavailable');
  const seen = new Set<string>();
  for (const field of data) {
    if (typeof field.field_code !== 'string' || !/^[a-z][a-z0-9_]*$/.test(field.field_code)
      || seen.has(field.field_code) || typeof field.is_premium !== 'boolean'
      || typeof field.is_realtor_only !== 'boolean' || typeof field.is_active !== 'boolean') {
      throw new Error('Invalid field access configuration');
    }
    seen.add(field.field_code);
  }
  return data;
}
export function stripRestrictedFields(data: Record<string, unknown> | null, fields: FieldRule[], access: UserAccess) {
  if (!data || typeof data !== 'object') return;
  const allowed = visibleFields(data, fields, access);
  for (const key of Object.keys(data)) if (!Object.hasOwn(allowed, key)) delete data[key];
}
