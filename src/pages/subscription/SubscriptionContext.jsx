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

  // forceReload=true передаємо, якщо ми точно знаємо, що щось змінилося (наприклад, після оплати)
  const updateSubscription = useCallback(async (waitForPlan = null) => {
    setIsLoading(true);
    try {
      // Якщо чекаємо новий план - значить точно треба ігнорувати кеш
      const forceReload = !!waitForPlan; 
      
      let sub = await fetchSubscriptionStatus(forceReload);
      
      if (waitForPlan && waitForPlan !== 'free') {
        let attempts = 0;
        // Тут ми вже форсуємо оновлення в циклі
        while (attempts < 5 && sub.plan !== waitForPlan) {
          await new Promise(r => setTimeout(r, 1500)); // Трохи збільшив затримку
          sub = await fetchSubscriptionStatus(true); // true = ігнорувати кеш
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
    
    // Ініціалізація (використає кеш, якщо є)
    const init = async () => { if (mounted) await updateSubscription(); };
    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
       // 1. ІГНОРУЄМО TOKEN_REFRESHED - це головна причина спаму запитами
       if (event === 'TOKEN_REFRESHED') return;

       if (event === 'SIGNED_IN') {
         // При вході форсуємо оновлення, щоб не підтягнуло кеш попереднього юзера (хоча в API є перевірка ID)
         updateSubscription(null); 
       } else if (event === 'SIGNED_OUT') {
         setSubscription(FREE_PLAN_DATA);
         setIsLoading(false);
         // Очищаємо кеш при виході
         localStorage.removeItem('user_subscription_cache');
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