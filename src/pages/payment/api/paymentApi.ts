import { supabase } from '@supabaseClient';
import type { PaymentRequest, PaymentResponse } from '../types';
import { PaymentResponseSchema } from '../validation';

export const processPayment = async (details: PaymentRequest): Promise<PaymentResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(details)
  });

  const rawData = await response.json();

  if (!response.ok) {
    throw new Error(rawData.error || 'Payment failed');
  }

  return PaymentResponseSchema.parse(rawData);
};