import { authenticatedApiRequest } from './apiClient';
import { supabase } from '@supabaseClient';

export async function fetchUserBillingHistory(page = 1, limit = 10) {
  try {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('user_subscriptions')
      .select('id, plan_name, status, starts_at, ends_at, payment_id, created_at, cancelled_at, cancel_at, amount', { count: 'exact' })
      .neq('status', 'incomplete')
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw new Error(error.message);

    return {
      subscriptions: data.map(sub => ({
        ...sub,
        amount: sub.amount !== null ? Number(sub.amount) : null
      })),
      count
    };
  } catch (err) {
    throw new Error("Не вдалося завантажити історію платежів");
  }
}

export async function cancelUserSubscription(subscriptionId) {
  return await authenticatedApiRequest('/process-payment', {
    method: 'POST',
    body: JSON.stringify({ 
      action: 'cancel',
      subscriptionId 
    })
  });
}