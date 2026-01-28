import { supabase } from '@supabaseClient';

export const processPayment = async (details) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Необхідна авторизація');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(details)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
    }
    return await response.json();
};

export const activateSubscription = async (subscriptionId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Необхідна авторизація');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'activate', subscriptionId })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Activation failed');
    }
    return await response.json();
};