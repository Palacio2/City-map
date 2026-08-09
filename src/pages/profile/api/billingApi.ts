import { supabase } from '@supabaseClient';
import type { BillingHistoryResponse } from '../types';

export const fetchUserBillingHistory = async (page: number, limit: number): Promise<BillingHistoryResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-billing-history`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page, limit })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch billing history');

  return data;
};

export const cancelUserSubscription = async (subscriptionId: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subscriptionId })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to cancel subscription');
};