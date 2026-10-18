import { type ReactNode, StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCheckout } from './useCheckout';
import { processPayment } from '../api/paymentApi';
vi.mock('../api/paymentApi', () => ({ processPayment: vi.fn() }));
const response = {
  sessionId: 'cs_test_one',
  completed: false,
  url: 'https://checkout.stripe.com/c/pay/one',
};
const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(processPayment).mockResolvedValue(response);
});
afterEach(cleanup);
it('never creates checkout on mount, StrictMode or rerender; only on an explicit click', async () => {
  const ready = vi.fn();
  const { result, rerender } = renderHook(() => useCheckout('weekly', ready), { wrapper });
  for (let i = 0; i < 10; i++) rerender();
  expect(processPayment).not.toHaveBeenCalled();
  await act(async () => result.current.start());
  expect(processPayment).toHaveBeenCalledExactlyOnceWith({ action: 'checkout', planKey: 'weekly' });
  expect(ready).toHaveBeenCalledWith(response);
});
it('blocks synchronous double click and allows retry after failure', async () => {
  let reject!: (error: Error) => void;
  vi.mocked(processPayment).mockReturnValueOnce(
    new Promise((_r, no) => {
      reject = no;
    }),
  );
  const { result } = renderHook(() => useCheckout('weekly', vi.fn()), { wrapper });
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.start();
    void result.current.start();
  });
  expect(processPayment).toHaveBeenCalledTimes(1);
  await act(async () => {
    reject(new Error('network'));
    await pending;
  });
  expect(result.current.error).toBe('network');
  await act(async () => result.current.start());
  expect(processPayment).toHaveBeenCalledTimes(2);
});
it('late response cannot redirect after plan switch or unmount', async () => {
  let resolve!: (value: typeof response) => void;
  vi.mocked(processPayment).mockReturnValueOnce(
    new Promise((yes) => {
      resolve = yes;
    }),
  );
  const ready = vi.fn();
  const { result, rerender, unmount } = renderHook(({ plan }) => useCheckout(plan, ready), {
    initialProps: { plan: 'weekly' },
    wrapper,
  });
  act(() => {
    void result.current.start();
  });
  rerender({ plan: 'realtor' });
  unmount();
  await act(async () => resolve(response));
  expect(ready).not.toHaveBeenCalled();
});
it.each([undefined, 'free', 'constructor'])('rejects invalid plan %s', async (plan) => {
  const { result } = renderHook(() => useCheckout(plan, vi.fn()), { wrapper });
  await act(async () => result.current.start());
  expect(processPayment).not.toHaveBeenCalled();
});
it('sends only normalized customer-facing code and blocks malformed input', async () => {
  const { result, rerender } = renderHook(({ code }) => useCheckout('weekly', vi.fn(), code), {
    initialProps: { code: ' city100 ' }, wrapper,
  });
  await act(async () => result.current.start());
  expect(processPayment).toHaveBeenCalledWith({ action: 'checkout', planKey: 'weekly', promoCode: 'CITY100' });
  rerender({ code: 'bad code' });
  await act(async () => result.current.start());
  expect(processPayment).toHaveBeenCalledTimes(1);
  expect(result.current.error).toBe('payment.errors.invalid_promo');
});
it('ignores a late checkout response after the promotion changes', async () => {
  let resolve!: (value: typeof response) => void;
  vi.mocked(processPayment).mockReturnValueOnce(new Promise(yes => { resolve = yes; }));
  const ready = vi.fn();
  const { result, rerender } = renderHook(({ code }) => useCheckout('weekly', ready, code), {
    initialProps: { code: 'CITY20' }, wrapper,
  });
  act(() => { void result.current.start(); });
  rerender({ code: 'CITY100' });
  await act(async () => resolve(response));
  expect(ready).not.toHaveBeenCalled();
});
