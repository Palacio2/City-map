import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.restoreAllMocks(); });

it('prefers the publishable key during migration', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'legacy-fixture');
  expect((await import('./env')).env.VITE_SUPABASE_PUBLISHABLE_KEY).toBe('sb_publishable_fixture');
});

it('supports an existing deployment with only an anon key', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', undefined);
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'legacy-fixture');
  expect((await import('./env')).env.VITE_SUPABASE_PUBLISHABLE_KEY).toBe('legacy-fixture');
});

it('rejects a server secret configured for the browser', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_secret_fixture');
  await expect(import('./env')).rejects.toThrow('A server secret cannot be used in the browser');
});
