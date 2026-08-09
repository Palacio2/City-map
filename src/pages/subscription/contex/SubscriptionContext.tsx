import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { fetchSubscriptionStatus, FREE_PLAN_DATA } from '../api/subscriptionApi';
import type { SubscriptionData, SubscriptionContextType } from '../types';
import { SubscriptionContextSchema } from '../validation';

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

interface SubscriptionProviderProps {
  readonly children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const [subscription, setSubscription] = useState<SubscriptionData>(FREE_PLAN_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const isMounted = useRef<boolean>(true);
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
              const newPlan = (payload.new as Record<string, unknown>)?.plan_name as string | undefined;
              updateSubscription(newPlan || null);
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
      hasFeature: (feature: string) => Boolean(subscription.features?.includes(feature)),
      isPremium: premiumPlans.includes(subscription.plan) && isPlanActive,
      isRealtor: subscription.plan === 'realtor' && isPlanActive,
      isFree: subscription.plan === 'free' || Boolean(subscription.isExpired),
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
  return SubscriptionContextSchema.parse(context);
};