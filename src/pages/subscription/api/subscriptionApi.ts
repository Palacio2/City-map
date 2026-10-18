import { supabase } from '@supabaseClient';
import { normalizeSubscription } from '../utils/subscriptionAccess';
import type { SubscriptionData } from '../types';

export const FREE_PLAN_DATA: SubscriptionData = normalizeSubscription(null);

export const fetchSubscriptionStatus = async (): Promise<SubscriptionData> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return FREE_PLAN_DATA;

    const { data, error } = await supabase.functions.invoke('get-subscription-status');
    
    if (error || !data || data.error) {
      return { ...FREE_PLAN_DATA, billingUnavailable: true };
    }

    return normalizeSubscription(data);
  } catch {
    return { ...FREE_PLAN_DATA, billingUnavailable: true };
  }
};
