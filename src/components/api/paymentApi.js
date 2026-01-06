import { supabase } from '../../supabaseClient';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`;

export async function processPayment(planName, paymentId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Необхідна авторизація');

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ plan_name: planName, payment_id: paymentId }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Помилка оплати');
  
  return data;
}