import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { subscriptionPlans } from './subscriptionPlans';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};

const getFreeFeatures = () => subscriptionPlans?.free?.features || [];

const FREE_PLAN = {
  id: null, plan: 'free', features: [], expiresAt: null, status: 'active', isExpired: false
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState({ ...FREE_PLAN, features: getFreeFeatures() });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { ...FREE_PLAN, features: getFreeFeatures() };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing'])
        .gt('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: false })
        .maybeSingle();

      if (error || !data) return { ...FREE_PLAN, features: getFreeFeatures() };

      let planName = data.plan_name === 'pro' ? 'premium' : data.plan_name;
      if (!subscriptionPlans[planName]) planName = 'free';

      return {
        id: data.id,
        plan: planName,
        features: subscriptionPlans[planName]?.features || getFreeFeatures(),
        expiresAt: data.ends_at,
        status: data.status,
        isExpired: false
      };
    } catch (err) {
      console.error("Subscription fetch error:", err);
      return { ...FREE_PLAN, features: getFreeFeatures() };
    }
  }, []);

  const updateSubscription = useCallback(async (waitForPlan = null) => {
    setIsLoading(true);
    try {
      let sub = await fetchSubscriptionData();
      if (waitForPlan && waitForPlan !== 'free') {
        let attempts = 0;
        while (attempts < 5 && sub.plan !== waitForPlan) {
          await new Promise(r => setTimeout(r, 1000));
          sub = await fetchSubscriptionData();
          attempts++;
        }
      }
      setSubscription(sub);
    } catch (e) {
      console.error("Critical update error:", e);
      setSubscription({ ...FREE_PLAN, features: getFreeFeatures() });
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscriptionData]);

  useEffect(() => {
    let mounted = true;
    const init = async () => { if (mounted) await updateSubscription(); };
    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
       if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') updateSubscription();
       else if (event === 'SIGNED_OUT') {
          setSubscription({ ...FREE_PLAN, features: getFreeFeatures() });
          setIsLoading(false);
       }
    });
    return () => { mounted = false; authSub.unsubscribe(); };
  }, [updateSubscription]);

  const value = useMemo(() => ({
    subscription,
    isLoading,
    hasFeature: (feature) => subscription.features?.includes(feature) || false,
    isPremium: subscription.plan !== 'free' && !subscription.isExpired,
    isFree: subscription.plan === 'free',
    updateSubscription,
    getFeatureKeys: () => subscription.features || [] 
  }), [subscription, isLoading, updateSubscription]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};