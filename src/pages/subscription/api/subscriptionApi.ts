import { supabase } from '@supabaseClient';
import { subscriptionPlans } from '../config/subscriptionPlans';
import type { SubscriptionData } from '../types';

const getFreeFeatures = (): string[] => subscriptionPlans.free?.features || [];

export const FREE_PLAN_DATA: SubscriptionData = {
  plan: 'free',
  features: getFreeFeatures(),
  expiresAt: null,
  status: 'active',
  isExpired: false
};

const CACHE_KEY = 'user_subscription_cache';
const CACHE_TTL = 10 * 60 * 1000;

export const fetchSubscriptionStatus = async (forceReload: boolean = false): Promise<SubscriptionData> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return FREE_PLAN_DATA;

    if (!forceReload) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp, userId } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && userId === session.user.id) {
          return data as SubscriptionData;
        }
      }
    }

    const { data, error } = await supabase.functions.invoke('get-subscription-status');
    
    if (error || !data || data.error) {
      return FREE_PLAN_DATA;
    }

    const planName = data.plan && subscriptionPlans[data.plan] ? data.plan : 'free';

    const result: SubscriptionData = {
      plan: planName,
      features: subscriptionPlans[planName]?.features || getFreeFeatures(),
      expiresAt: data.expiresAt || null,
      status: data.status || 'active',
      isExpired: false
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: result,
      timestamp: Date.now(),
      userId: session.user.id
    }));

    return result;
  } catch {
    return FREE_PLAN_DATA;
  }
};