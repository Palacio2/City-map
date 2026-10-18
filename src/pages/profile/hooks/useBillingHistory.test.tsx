import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useBillingHistory } from './useBillingHistory';
const fixture = vi.hoisted(() => ({
  cancel: vi.fn(), refresh: vi.fn(),
  subscription: { id: 'gift-id', plan: 'realtor', paidSubscriptions: [
    { id: 'paid-id', plan: 'premium', status: 'active', cancel_at: null as string | null, expiresAt: null },
  ] },
}));
vi.mock('@subscription/context/SubscriptionContext', () => ({ useSubscription: () => ({ subscription: fixture.subscription,
  updateSubscription: fixture.refresh, isLoading: false }) }));
vi.mock('../api/billingApi', () => ({ cancelUserSubscription: fixture.cancel,
  fetchUserBillingHistory: async () => ({ subscriptions: [{ id: 'gift-from-history', status: 'active' }], count: 30 }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@utils/errorHandler', () => ({ mapSupabaseError: () => 'cancel failed' }));
beforeEach(() => { vi.clearAllMocks(); fixture.cancel.mockResolvedValue(undefined); fixture.refresh.mockResolvedValue(undefined);
  fixture.subscription.paidSubscriptions[0].cancel_at = null; });
const mount = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return renderHook(useBillingHistory, { wrapper: ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider> });
};
it('uses the selected paid ID, never the gift or current history page', async () => {
  const { result } = mount();
  await waitFor(() => expect(result.current.history).toHaveLength(1));
  act(() => result.current.setPage(3));
  act(() => result.current.selectSubscriptionForCancellation('paid-id'));
  act(() => result.current.confirmCancellation());
  await waitFor(() => expect(fixture.cancel).toHaveBeenCalledWith('paid-id'));
  await waitFor(() => expect(result.current.showCancelModal).toBe(false));
  expect(fixture.refresh).toHaveBeenCalledOnce();
});
it.each(['gift-id', 'gift-from-history', 'unknown'])('rejects cancellation target %s', async id => {
  const { result } = mount();
  act(() => result.current.selectSubscriptionForCancellation(id));
  act(() => result.current.confirmCancellation());
  await waitFor(() => expect(result.current.cancellationError).toBe('cancel failed'));
  expect(fixture.cancel).not.toHaveBeenCalled();
});
it('keeps the dialog open on API failure and avoids refreshing as if it succeeded', async () => {
  fixture.cancel.mockRejectedValue(new Error('API unavailable'));
  const { result } = mount();
  act(() => result.current.selectSubscriptionForCancellation('paid-id'));
  act(() => result.current.confirmCancellation());
  await waitFor(() => expect(result.current.cancellationError).toBe('cancel failed'));
  expect(result.current.showCancelModal).toBe(true);
  expect(fixture.refresh).not.toHaveBeenCalled();
});
