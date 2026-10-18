import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { it, expect, vi, afterEach, beforeEach } from 'vitest';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';
import { fetchSubscriptionStatus, FREE_PLAN_DATA } from '../api/subscriptionApi';

let user: { id: string } | null = { id: 'A' };
vi.mock('@auth/context/AuthContext', () => ({ useAuth: () => ({ user }) }));
const realtime = vi.hoisted(() => ({ channel: vi.fn(), removeChannel: vi.fn() }));
vi.mock('@supabaseClient', () => ({ supabase: realtime }));
vi.mock('../api/subscriptionApi', () => ({
  FREE_PLAN_DATA: { plan: 'free', features: [], expiresAt: null, status: 'active', isExpired: false },
  fetchSubscriptionStatus: vi.fn(),
}));

beforeEach(() => {
  user = { id: 'A' };
  vi.clearAllMocks();
  vi.mocked(fetchSubscriptionStatus).mockResolvedValue(FREE_PLAN_DATA);
});
afterEach(() => vi.useRealTimers());

it('revokes access at expiry without a reload or realtime event', async () => {
  vi.useFakeTimers();
  realtime.channel.mockImplementation(() => {
    const channel = { on: () => channel, subscribe: () => channel }; return channel;
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const active = { ...FREE_PLAN_DATA, plan: 'realtor', expiresAt: new Date(Date.now() + 1000).toISOString() };
  client.setQueryData(['user_subscription', 'A'], active);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}><SubscriptionProvider>{children}</SubscriptionProvider></QueryClientProvider>;
  const { result, unmount } = renderHook(useSubscription, { wrapper });
  expect(result.current.isRealtor).toBe(true);
  expect(result.current.hasFeature('save_favorites')).toBe(true);
  await act(async () => { vi.advanceTimersByTime(1001); });
  expect(result.current.isFree).toBe(true);
  expect(result.current.isPremium).toBe(false);
  expect(result.current.hasFeature('save_favorites')).toBe(false);
  unmount(); client.clear();
});

it('switches realtime filter and query cache with identity, then disconnects on logout', async () => {
  const filters: string[] = [], callbacks: (() => void)[] = [];
  realtime.channel.mockImplementation(() => {
    const channel = { on: (_event: string, options: { filter: string }, callback: () => void) => {
      filters.push(options.filter); callbacks.push(callback); return channel;
    }, subscribe: () => channel };
    return channel;
  });
  vi.mocked(fetchSubscriptionStatus).mockResolvedValue({ ...FREE_PLAN_DATA, plan: 'realtor', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}><SubscriptionProvider>{children}</SubscriptionProvider></QueryClientProvider>;
  const { result, rerender, unmount } = renderHook(useSubscription, { wrapper });
  await waitFor(() => expect(result.current.subscription.plan).toBe('realtor'));
  vi.mocked(fetchSubscriptionStatus).mockResolvedValue(FREE_PLAN_DATA);
  user = { id: 'B' }; rerender();
  await waitFor(() => expect(result.current.subscription.plan).toBe('free'));
  expect(filters).toEqual(['user_id=eq.A', 'user_id=eq.B']);
  expect(realtime.removeChannel).toHaveBeenCalledTimes(1);
  await act(async () => { callbacks[1](); });
  expect(fetchSubscriptionStatus).toHaveBeenCalledTimes(3);
  user = null; rerender();
  expect(realtime.removeChannel).toHaveBeenCalledTimes(2);
  expect(result.current.subscription.plan).toBe('free');
  unmount(); client.clear();
});
