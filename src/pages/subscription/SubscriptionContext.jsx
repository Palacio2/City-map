import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { fetchSubscriptionStatus, FREE_PLAN_DATA } from '@api/subscriptionApi';

const SubscriptionContext = createContext();

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
      let sub = await fetchSubscriptionStatus();
      
      if (waitForPlan && waitForPlan !== 'free') {
        let attempts = 0;
        while (attempts < 5 && sub.plan !== waitForPlan) {
          await new Promise(r => setTimeout(r, 1000));
          sub = await fetchSubscriptionStatus();
          attempts++;
        }
      }
      setSubscription(sub);
    } catch (e) {
      setSubscription(FREE_PLAN_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => { if (mounted) await updateSubscription(); };
    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
       if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') updateSubscription();
       else if (event === 'SIGNED_OUT') {
          setSubscription(FREE_PLAN_DATA);
          setIsLoading(false);
       }
    });
    return () => { mounted = false; authSub.unsubscribe(); };
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