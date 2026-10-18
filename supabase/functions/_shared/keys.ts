import { resolveSupabaseKey } from '../../../shared/supabaseKeys.js';

export const secretKey = () => resolveSupabaseKey(name => Deno.env.get(name), 'secret');
export const publishableKey = () => resolveSupabaseKey(name => Deno.env.get(name), 'publishable');

// During rollout old browser bundles still send the legacy anon key as Bearer.
// Neither public API key establishes a user identity.
export function isAnonymousAuthorization(header: string | null): boolean {
  if (!header) return true;
  if (header === `Bearer ${publishableKey()}`) return true;
  const legacy = Deno.env.get('SUPABASE_ANON_KEY');
  return Boolean(legacy && header === `Bearer ${legacy}`);
}
