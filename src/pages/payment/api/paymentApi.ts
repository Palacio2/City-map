import { supabase } from '@supabaseClient';
import type { PaymentRequest, PaymentResponse } from '../types';
import { CheckoutStatusSchema, PaymentResponseSchema } from '../validation';
async function request(body: unknown, signal?: AbortSignal) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');
  const response = await fetch(
    import.meta.env.VITE_SUPABASE_URL + '/functions/v1/process-payment',
    {
      method: 'POST',
      signal,
      headers: {
        Authorization: 'Bearer ' + session.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'payment.errors.create_failed');
  }
  return data;
}
export const processPayment = async (details: PaymentRequest): Promise<PaymentResponse> =>
  PaymentResponseSchema.parse(await request(details));
export const fetchCheckoutStatus = async (sessionId: string, signal?: AbortSignal) =>
  CheckoutStatusSchema.parse(await request({ action: 'status', sessionId }, signal));
