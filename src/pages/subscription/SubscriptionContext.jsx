import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { subscriptionPlans, featureTranslations } from './subscriptionPlans';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};

const getFreePlan = () => ({
  plan: 'free', 
  features: subscriptionPlans.free.features, 
  expiresAt: null, 
  status: 'active',
  isCancelled: false,
  isExpired: false 
});

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
      
      const now = new Date();
      const endsAt = new Date(subscription.ends_at);
      
      // Перевіряємо, чи термін дії минув
      const isExpired = endsAt <= now; 

      // Якщо підписка прострочена АБО поточний план free, використовуємо free
      if (isExpired || planName === 'free') return getFreePlan();

      const features = subscriptionPlans[planName]?.features || subscriptionPlans.free.features;
      
      // Підписка активна, якщо не 'cancelled' АБО 'cancelled', але не прострочена 
      const isActive = subscription.status === 'active' || 
                       (subscription.status === 'cancelled' && !isExpired); 

      return {
        plan: planName, // Фактичний платний план (premium)
        originalPlan: planName,
        features: features,
        expiresAt: subscription.ends_at,
        status: subscription.status,
        isCancelled: subscription.status === 'cancelled',
        isExpired: isExpired, 
      };
    }

    return getFreePlan();
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return getFreePlan();
  }
};


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
    
    // Якщо підписка прострочена, доступні лише free функції
    if (subscription.isExpired || subscription.plan === 'free') {
      return subscriptionPlans.free.features.includes(feature);
    }
    
    // В іншому випадку, перевіряємо функції поточного активного плану
    return subscription.features.includes(feature);
  };

  const getTranslatedFeatures = () => {
    if (!subscription) return [];
    
    // Якщо прострочена, використовуємо free features для відображення
    const currentFeatures = subscription.isExpired || subscription.plan === 'free'
      ? subscriptionPlans.free.features
      : subscription.features;
      
    return currentFeatures.map(feature => featureTranslations[feature] || feature);
  };

  const value = {
    subscription,
    isLoading,
    hasFeature,
    getTranslatedFeatures,
    // *** ЗМІНЕНО: Видалено isPro ***
    isPremium: subscription?.plan === 'premium' && !subscription?.isExpired,
    isFree: subscription?.plan === 'free' || subscription?.isExpired,
    updateSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};