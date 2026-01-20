import { supabase } from '@supabaseClient';
import { subscriptionPlans } from '@subscription/subscriptionPlans';
const getFreeFeatures = () => subscriptionPlans?.free?.features || [];

export const FREE_PLAN_DATA = {
  id: null, 
  plan: 'free', 
  features: getFreeFeatures(), 
  expiresAt: null, 
  status: 'active', 
  isExpired: false
};

export const fetchSubscriptionStatus = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return FREE_PLAN_DATA;

    const { data, error } = await supabase.functions.invoke('get-subscription-status');

    if (error || !data || data.error) {
      return FREE_PLAN_DATA;
    }

    let planName = data.plan || 'free';
    
    if (!subscriptionPlans[planName]) {
      planName = 'free';
    }

    return {
      id: data.id,
      plan: planName,
      features: subscriptionPlans[planName]?.features || getFreeFeatures(),
      expiresAt: data.expiresAt,
      status: data.status || 'active',
      isExpired: false
    };
  } catch (err) {
    return FREE_PLAN_DATA;
  }
};