import { beforeEach, expect, it, vi } from 'vitest';
import { adminUsersAPI } from './adminUsersAPI';
const invoke = vi.hoisted(() => vi.fn());
vi.mock('@supabaseClient', () => ({ supabase: { functions: { invoke } } }));
beforeEach(() => { invoke.mockReset().mockResolvedValue({ data: { success: true }, error: null }); });
it('sends the server contract for roles and assignments', async () => {
  await adminUsersAPI.updateRole('target', 'admin');
  await adminUsersAPI.updateAdminCities('target', ['city']);
  await adminUsersAPI.updateAdminTabs('target', ['users']);
  expect(invoke.mock.calls.map(([, options]) => options.body.payload)).toEqual([
    { role: 'admin' }, { cities: ['city'] }, { tabs: ['users'] },
  ]);
});
it('surfaces failed writes instead of accepting a false success', async () => {
  invoke.mockResolvedValueOnce({ data: null, error: new Error('write failed') });
  await expect(adminUsersAPI.updateRole('target', 'admin')).rejects.toThrow('write failed');
});
