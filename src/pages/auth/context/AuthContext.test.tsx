import { StrictMode, useState } from 'react';
import { render, screen, act, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { vi, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const sdk = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn() }));
let listener: (event: AuthChangeEvent, session: Session | null) => void;
vi.mock('@supabaseClient', () => ({ supabase: { auth: {
  ...sdk,
  onAuthStateChange: (callback: typeof listener) => { listener = callback; return { data: { subscription: { unsubscribe: sdk.unsubscribe } } }; },
} } }));

function session(id: string): Session {
  return { access_token: id, refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer',
    user: { id, aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} } };
}
let oldClient: QueryClient;
function PrivateView() {
  const { user, signOut } = useAuth();
  const client = useQueryClient();
  if (user?.id === 'A') oldClient = client;
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const { data } = useQuery({ queryKey: ['userProfile'], queryFn: async () => 'profile-' + user?.id, enabled: !!user });
  return <><span>{user?.id ?? 'guest'}</span><span>{data ?? 'empty'}</span>
    <input aria-label="draft" value={draft} onChange={e => setDraft(e.target.value)} />
    <button onClick={() => { void signOut().catch(e => setError(e.message)); }}>logout</button><span>{error}</span></>;
}
function mount(children = <PrivateView />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<StrictMode><QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider></QueryClientProvider></StrictMode>);
  return client;
}
beforeEach(() => {
  vi.clearAllMocks(); window.localStorage.clear(); window.sessionStorage.clear();
  sdk.getSession.mockResolvedValue({ data: { session: session('A') }, error: null });
  sdk.getUser.mockResolvedValue({ data: { user: session('A').user }, error: null });
  sdk.signOut.mockImplementation(async () => { listener('SIGNED_OUT', null); return { error: null }; });
});
afterEach(cleanup);

it('isolates identical query keys, local component state and late old-account cache writes', async () => {
  mount(); await screen.findByText('profile-A');
  fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'private draft' } });
  const previousClient = oldClient;
  act(() => { listener('SIGNED_IN', session('B')); });
  await screen.findByText('profile-B');
  expect(screen.getByLabelText('draft')).toHaveValue('');
  act(() => { previousClient.setQueryData(['userProfile'], 'late-secret-A'); });
  expect(screen.queryByText('late-secret-A')).not.toBeInTheDocument();
  expect(screen.queryByText('profile-A')).not.toBeInTheDocument();
});

it('preserves the same account on token refresh but resets on logout/login batched into one render', async () => {
  mount(); await screen.findByText('profile-A');
  fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'draft' } });
  act(() => { listener('TOKEN_REFRESHED', session('A')); });
  expect(screen.getByLabelText('draft')).toHaveValue('draft');
  act(() => { listener('SIGNED_OUT', null); listener('SIGNED_IN', session('A')); });
  await waitFor(() => expect(screen.getByLabelText('draft')).toHaveValue(''));
});

it('logout removes private data and does not pretend success when the SDK rejects signout', async () => {
  mount(); await screen.findByText('profile-A');
  sdk.signOut.mockResolvedValueOnce({ error: new Error('signout failed') });
  fireEvent.click(screen.getByText('logout'));
  await screen.findByText('signout failed'); expect(screen.getByText('profile-A')).toBeInTheDocument();
  fireEvent.click(screen.getByText('logout'));
  await screen.findByText('guest'); expect(screen.queryByText('profile-A')).not.toBeInTheDocument();
});

it('a late initial session lookup cannot restore a signed-out account', async () => {
  let resolve!: (value: unknown) => void;
  sdk.getSession.mockReturnValue(new Promise(done => { resolve = done; }));
  mount();
  act(() => { listener('SIGNED_OUT', null); });
  await screen.findByText('guest');
  await act(async () => { resolve({ data: { session: session('A') }, error: null }); });
  expect(screen.queryByText('profile-A')).not.toBeInTheDocument();
  expect(screen.getByText('guest')).toBeInTheDocument();
});

it('late signout completion does not erase a newly established account', async () => {
  mount(); await screen.findByText('profile-A');
  let complete!: (value: { error: null }) => void;
  sdk.signOut.mockReturnValueOnce(new Promise(done => { complete = done; }));
  fireEvent.click(screen.getByText('logout'));
  act(() => { listener('SIGNED_IN', session('B')); });
  await screen.findByText('profile-B');
  await act(async () => { complete({ error: null }); });
  expect(screen.getByText('profile-B')).toBeInTheDocument();
});
