import { supabase } from '../../supabaseClient'; // Переконайтеся, що шлях до supabaseClient правильний

export async function processPayment(planName, paymentId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated.');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        plan_name: planName,
        payment_id: paymentId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update subscription');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}