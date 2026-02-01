import { supabase } from '@supabaseClient';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export async function fetchUserBillingHistory(page = 1, limit = 10) {
  try {
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) throw new Error('Необхідна авторизація');

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: subscriptions, error, count } = await supabase
      .from('user_subscriptions')
      .select('id, plan_name, status, starts_at, ends_at, payment_id, created_at, cancelled_at, cancel_at, amount', { count: 'exact' }) // Додав cancel_at
      .eq('user_id', user.id)
      .neq('status', 'incomplete')
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return { 
      subscriptions: subscriptions.map(sub => ({
        ...sub,
        amount: sub.amount !== null ? Number(sub.amount) : null
      })), 
      count 
    };
  } catch (error) {
    throw error;
  }
}

export async function cancelUserSubscription(subscriptionId) {
  console.log(`[API] Cancelling subscription: ${subscriptionId}`);
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Необхідна авторизація');

  const url = `${FUNCTION_URL}/process-payment`;
  console.log(`[API] POST request to: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action: 'cancel', subscriptionId })
  });
  
  const result = await response.json();
  console.log(`[API] Response:`, result);

  if (!response.ok) {
      throw new Error(result.error || 'Не вдалося скасувати підписку');
  }
  return result;
}