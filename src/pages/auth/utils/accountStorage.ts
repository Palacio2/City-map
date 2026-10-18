import { STORAGE_KEYS } from '@config/constants';

const OWNER_KEY = 'city-map:account-owner';
const PRIVATE_KEYS = new Set([
  STORAGE_KEYS.AI_PREFS, STORAGE_KEYS.COMPARISON_DISTRICTS, STORAGE_KEYS.RODO_ACCEPTED,
  'tracked_districts_data', 'tracked_districts_page', 'geo_analyzer_export_settings',
  STORAGE_KEYS.SELECTED_LOCATION, 'admin_session_ended', 'admin_active_tab',
]);

// Never clear Supabase session tokens, consent to cookies or unrelated site settings.
export function prepareAccountStorage(userId: string | null) {
  const owner = userId ?? 'guest';
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      if (storage.getItem(OWNER_KEY) === owner) continue;
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) {
        if (key && (PRIVATE_KEYS.has(key) || key.startsWith('draft_district_') || key.startsWith('parser_'))) {
          storage.removeItem(key);
        }
      }
      storage.setItem(OWNER_KEY, owner);
    } catch {
      // Storage may be unavailable; in-memory account isolation must still work.
    }
  }
}
