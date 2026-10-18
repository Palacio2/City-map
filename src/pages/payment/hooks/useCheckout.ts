import { useCallback, useEffect, useRef, useState } from 'react';
import { processPayment } from '../api/paymentApi';
import type { PaymentResponse } from '../types';
export function useCheckout(
  planKey: string | undefined,
  onReady: (result: PaymentResponse) => void,
  promoCode = '',
) {
  const [isLoading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null);
  const pending = useRef(false), generation = useRef({ value: 0 });
  useEffect(() => {
    const lifecycle = generation.current;
    setError(null);
    setLoading(false);
    pending.current = false;
    return () => {
      lifecycle.value++;
      pending.current = false;
    };
  }, [planKey, promoCode]);
  const start = useCallback(async () => {
    if (pending.current || !planKey || !['weekly', 'premium', 'realtor'].includes(planKey)) return;
    const code = promoCode.trim().toUpperCase();
    if (code && !/^[A-Z0-9]{1,64}$/.test(code)) { setError('payment.errors.invalid_promo'); return; }
    const current = generation.current.value;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await processPayment({ action: 'checkout', planKey, ...(code ? { promoCode: code } : {}) });
      if (current === generation.current.value) onReady(response);
    } catch (err) {
      if (current === generation.current.value) {
        setError(err instanceof Error ? err.message : 'payment.errors.create_failed');
      }
    } finally {
      if (current === generation.current.value) {
        pending.current = false;
        setLoading(false);
      }
    }
  }, [planKey, onReady, promoCode]);
  return { start, isLoading, error };
}
