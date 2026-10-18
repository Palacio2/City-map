/** Resolve server credentials without logging values or hiding broken new configuration.
 * @param {(name: string) => string | undefined} get
 * @param {'secret' | 'publishable'} kind
 */
export function resolveSupabaseKey(get, kind) {
  const prefix = kind === 'secret' ? 'SECRET' : 'PUBLISHABLE';
  const directName = `SUPABASE_${prefix}_KEY`;
  const bundleName = `SUPABASE_${prefix}_KEYS`;
  const validate = (value, name) => {
    if (typeof value !== 'string' || !value.startsWith(`sb_${kind}_`) || value.trim() !== value) {
      throw new Error(`Invalid ${name}`);
    }
    return value;
  };
  const direct = get(directName);
  if (direct !== undefined) return validate(direct, directName);
  const bundle = get(bundleName);
  if (bundle !== undefined) {
    let parsed;
    try { parsed = JSON.parse(bundle); } catch { throw new Error(`Invalid ${bundleName}`); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`Invalid ${bundleName}`);
    // Hosted legacy-only projects receive an empty dictionary before new keys
    // are provisioned. A nonempty but invalid dictionary must still fail closed.
    if (Object.keys(parsed).length) return validate(parsed.default, bundleName);
  }
  const legacyName = kind === 'secret' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY';
  const legacy = get(legacyName);
  if (!legacy?.trim()) throw new Error(`Missing ${directName}`);
  return legacy;
}
