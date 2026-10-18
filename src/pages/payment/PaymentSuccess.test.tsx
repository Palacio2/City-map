import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PaymentSuccess from './PaymentSuccess';
import { fetchCheckoutStatus } from './api/paymentApi';
const update = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('@auth/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user' } }) }));
vi.mock(
  '@subscription/context/SubscriptionContext',
  () => ({ useSubscription: () => ({ updateSubscription: update }) }),
);
vi.mock(
  'react-i18next',
  () => ({
    useTranslation: () => ({
      t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    }),
  }),
);
vi.mock('./api/paymentApi', () => ({ fetchCheckoutStatus: vi.fn() }));
let client: QueryClient;
function mount(path = '/payment-success?session_id=cs_test_one') {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <PaymentSuccess />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  client?.clear();
});
it('a direct visit does not fabricate a successful payment or transaction ID', async () => {
  mount('/payment-success');
  expect(screen.getByRole('status')).toHaveTextContent('Не вдалося підтвердити');
  expect(fetchCheckoutStatus).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain('TX-');
});
it('a completed paid session refreshes access after server confirmation', async () => {
  vi.mocked(fetchCheckoutStatus).mockResolvedValue({
    sessionId: 'cs_test_one',
    status: 'complete',
    paymentStatus: 'paid',
    confirmed: true,
  });
  mount();
  await screen.findByText('Оплату підтверджено. Доступ оновиться після синхронізації підписки.');
  expect(update).toHaveBeenCalledTimes(1);
});
it('unpaid or incomplete results do not claim success even with inconsistent confirmed flag', async () => {
  vi.mocked(fetchCheckoutStatus).mockResolvedValue({
    sessionId: 'cs_test_one',
    status: 'complete',
    paymentStatus: 'unpaid',
    confirmed: true,
  });
  mount();
  await screen.findByText('Оплату ще не підтверджено. Перевірте її стан у своєму профілі.');
  expect(update).not.toHaveBeenCalled();
});
