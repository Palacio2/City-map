/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import { fetchSubscriptionStatus, FREE_PLAN_DATA } from '../api/subscriptionApi';
import type { SubscriptionContextType } from '../types';
import { useAuth } from '@auth/context/AuthContext';
import { normalizeSubscription } from '../utils/subscriptionAccess';

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

interface SubscriptionProviderProps {
  readonly children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: rawSubscription = FREE_PLAN_DATA, isLoading } = useQuery({
    queryKey: ['user_subscription', userId],
    queryFn: fetchSubscriptionStatus,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, 
  });

  const [now, setNow] = useState(Date.now);
  const subscription = useMemo(() => normalizeSubscription(rawSubscription, Math.max(now, Date.now())), [rawSubscription, now]);

  useEffect(() => {
    const expiry = Date.parse(rawSubscription.expiresAt ?? '');
    if (!Number.isFinite(expiry) || expiry <= now) return;
    // Browser timers have a signed 32-bit delay limit; recheck longer periods.
    const timer = setTimeout(() => {
      setNow(Date.now());
      if (Date.now() >= expiry) void queryClient.invalidateQueries({ queryKey: ['user_subscription', userId] });
    }, Math.min(Math.max(0, expiry - Date.now()), 2_147_483_647));
    return () => clearTimeout(timer);
  }, [rawSubscription.expiresAt, now, queryClient, userId]);

  const updateSubscription = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['user_subscription', userId] });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel('sub-updates-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions', filter: 'user_id=eq.' + userId },
        () => { void updateSubscription(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, updateSubscription]);

  const value = useMemo<SubscriptionContextType>(() => {
    const isPlanActive = subscription.plan !== 'free' && !subscription.isExpired;
    const premiumPlans = ['weekly', 'premium', 'realtor'];
    
    const dbIsPremium = premiumPlans.includes(subscription.plan) && isPlanActive;
    const dbIsRealtor = subscription.plan === 'realtor' && isPlanActive;
    const dbIsFree = subscription.plan === 'free' || Boolean(subscription.isExpired);
    return {
      subscription,
      isLoading,
      hasFeature: (feature: string) => Boolean(subscription.features?.includes(feature)),
      isPremium: dbIsPremium,
      isRealtor: dbIsRealtor,
      isFree: dbIsFree,
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
  if (!context) throw new Error("useSubscription must be used within a SubscriptionProvider");
  return context;
};
