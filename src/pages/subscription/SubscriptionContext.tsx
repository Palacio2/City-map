import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '@supabaseClient';
import { fetchSubscriptionStatus, FREE_PLAN_DATA } from '@api/subscriptionApi';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionData {
  plan: string;
  isExpired?: boolean;
  expiresAt?: string | null;
  cancel_at?: string | null;
  status?: string;
  features?: string[];
  [key: string]: any;
}

export interface SubscriptionContextType {
  subscription: SubscriptionData;
  isLoading: boolean;
  hasFeature: (feature: string) => boolean;
  isPremium: boolean;
  isRealtor: boolean;
  isFree: boolean;
  updateSubscription: (waitForPlan?: string | null) => Promise<void>;
  getFeatureKeys: () => string[];
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<SubscriptionData>(FREE_PLAN_DATA);
  const [isLoading, setIsLoading] = useState(true);
  
  const isMounted = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const updateSubscription = useCallback(async (waitForPlan: string | null = null) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('user_subscription_cache');
      let sub = await fetchSubscriptionStatus(true);

      if (waitForPlan && waitForPlan !== 'free' && sub.plan !== waitForPlan) {
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        while (attempts < MAX_ATTEMPTS && sub.plan !== waitForPlan) {
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
          if (!isMounted.current) return; 
          localStorage.removeItem('user_subscription_cache');
          sub = await fetchSubscriptionStatus(true);
        }
      }
      if (isMounted.current) {
        setSubscription(sub);
      }
    } catch {
      if (isMounted.current) setSubscription(FREE_PLAN_DATA);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      if (isMounted.current) await updateSubscription();

      const { data: { user } } = await supabase.auth.getUser();

      if (user && isMounted.current) {
        channelRef.current = supabase
          .channel('subscription-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_subscriptions',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // Кастимо payload.new до any, щоб TS не сварився на plan_name
              updateSubscription((payload.new as any)?.plan_name || null);
            }
          )
          .subscribe();
      }
    };

    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted.current || event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_IN') {
        updateSubscription();
      } else if (event === 'SIGNED_OUT') {
        setSubscription(FREE_PLAN_DATA);
        setIsLoading(false);
        localStorage.removeItem('user_subscription_cache');
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    });

    return () => {
      isMounted.current = false;
      authSub?.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [updateSubscription]);

  const value = useMemo<SubscriptionContextType>(() => {
    const isPlanActive = subscription.plan !== 'free' && !subscription.isExpired;
    const premiumPlans = ['weekly', 'premium', 'realtor'];

    return {
      subscription,
      isLoading,
      hasFeature: (feature: string) => subscription.features?.includes(feature) || false,
      isPremium: premiumPlans.includes(subscription.plan) && isPlanActive,
      isRealtor: subscription.plan === 'realtor' && isPlanActive,
      // Додали подвійне заперечення (!!), щоб гарантовано отримати boolean
      isFree: subscription.plan === 'free' || !!subscription.isExpired,
      updateSubscription,
      getFeatureKeys: () => subscription.features || []
    };
  }, [subscription, isLoading, updateSubscription]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};