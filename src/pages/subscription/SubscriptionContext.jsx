import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { fetchSubscriptionStatus, FREE_PLAN_DATA } from '@api/subscriptionApi';

const SubscriptionContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(FREE_PLAN_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const updateSubscription = useCallback(async (waitForPlan = null) => {
    setIsLoading(true);
    try {
      const forceReload = !!waitForPlan; 
      
      let sub = await fetchSubscriptionStatus(forceReload);
      
      if (waitForPlan && waitForPlan !== 'free') {
        let attempts = 0;
        while (attempts < 5 && sub.plan !== waitForPlan) {
          await new Promise(r => setTimeout(r, 1500));
          sub = await fetchSubscriptionStatus(true);
          attempts++;
        }
      }
      setSubscription(sub);
    } catch {
      setSubscription(FREE_PLAN_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let channel = null;

    const init = async () => {
      if (mounted) await updateSubscription();

      const { data: { user } } = await supabase.auth.getUser();

      if (user && mounted) {
         channel = supabase
          .channel('subscription-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_subscriptions',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              updateSubscription(null);
            }
          )
          .subscribe();
      }
    };

    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
       if (event === 'TOKEN_REFRESHED') return;

       if (event === 'SIGNED_IN') {
         updateSubscription(null); 
       } else if (event === 'SIGNED_OUT') {
         setSubscription(FREE_PLAN_DATA);
         setIsLoading(false);
         localStorage.removeItem('user_subscription_cache');
         if (channel) {
             supabase.removeChannel(channel);
             channel = null;
         }
       }
    });

    return () => { 
      mounted = false; 
      authSub?.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [updateSubscription]);

  const value = useMemo(() => {
    const isPlanActive = subscription.plan !== 'free' && !subscription.isExpired;
    const premiumPlans = ['weekly', 'premium', 'realtor'];

    return {
      subscription,
      isLoading,
      hasFeature: (feature) => subscription.features?.includes(feature) || false,
      isPremium: premiumPlans.includes(subscription.plan) && isPlanActive,
      isRealtor: subscription.plan === 'realtor' && isPlanActive,
      isFree: subscription.plan === 'free',
      updateSubscription,
      getFeatureKeys: () => subscription.features || [] 
    };
  }, [subscription, isLoading, updateSubscription]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};