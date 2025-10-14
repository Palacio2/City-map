import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { subscriptionPlans, featureTranslations } from './subscriptionPlans';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};

const fetchSubscriptionFromDB = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getFreePlan();

    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (subscriptions?.length > 0) {
      const subscription = subscriptions[0];
      const planName = subscription.plan_name;
      const features = subscriptionPlans[planName]?.features || subscriptionPlans.free.features;
      
      const now = new Date();
      const endsAt = new Date(subscription.ends_at);
      const isActive = subscription.status === 'active' || 
                      (subscription.status === 'cancelled' && endsAt > now);

      return {
        plan: isActive ? planName : 'free',
        originalPlan: planName,
        features: isActive ? features : subscriptionPlans.free.features,
        expiresAt: subscription.ends_at,
        status: subscription.status,
        isCancelled: subscription.status === 'cancelled',
      };
    }
    
    return getFreePlan();
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return getFreePlan();
  }
};

const getFreePlan = () => ({
  plan: 'free', 
  features: subscriptionPlans.free.features, 
  expiresAt: null, 
  status: 'active',
  isCancelled: false 
});

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateSubscription = async () => {
    setIsLoading(true);
    const sub = await fetchSubscriptionFromDB();
    setSubscription(sub);
    setIsLoading(false);
  };

  useEffect(() => {
    const loadSubscription = async () => {
      setIsLoading(true);
      const sub = await fetchSubscriptionFromDB();
      setSubscription(sub);
      setIsLoading(false);
    };

    loadSubscription();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadSubscription();
      else setSubscription(getFreePlan());
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const hasFeature = (feature) => {
    if (!subscription) return false;
    
    if (subscription.isCancelled) {
      const now = new Date();
      const expiresAt = new Date(subscription.expiresAt);
      if (expiresAt > now) return subscription.features.includes(feature);
      return false;
    }
    
    return subscription.features.includes(feature);
  };

  const getTranslatedFeatures = () => {
    if (!subscription) return [];
    return subscription.features.map(feature => featureTranslations[feature] || feature);
  };

  const value = {
    subscription,
    isLoading,
    hasFeature,
    getTranslatedFeatures,
    isPro: subscription?.plan === 'pro',
    isPremium: subscription?.plan === 'premium',
    isFree: subscription?.plan === 'free',
    updateSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};