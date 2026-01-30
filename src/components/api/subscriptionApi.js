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

const CACHE_KEY = 'user_subscription_cache';
const CACHE_TTL = 10 * 60 * 1000;

export const fetchSubscriptionStatus = async (forceReload = false) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return FREE_PLAN_DATA;

    if (!forceReload) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp, userId } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && userId === session.user.id) {
          return data;
        }
      }
    }

    const { data, error } = await supabase.functions.invoke('get-subscription-status');

    if (error || !data || data.error) {
      return FREE_PLAN_DATA;
    }

    let planName = data.plan || 'free';
    if (!subscriptionPlans[planName]) {
      planName = 'free';
    }

    const result = {
      id: data.id,
      plan: planName,
      features: subscriptionPlans[planName]?.features || getFreeFeatures(),
      expiresAt: data.expiresAt,
      status: data.status || 'active',
      isExpired: false
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: result,
      timestamp: Date.now(),
      userId: session.user.id
    }));

    return result;

  } catch (err) {
    return FREE_PLAN_DATA;
  }
};