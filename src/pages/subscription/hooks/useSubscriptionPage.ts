import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contex/SubscriptionContext';

export const useSubscriptionPage = () => {
  const { subscription, isLoading } = useSubscription();
  const navigate = useNavigate();

  const hasActivePaidSubscription = Boolean(
    subscription &&
    subscription.plan !== 'free' &&
    !subscription.isExpired
  );

  const [selectedPlan, setSelectedPlan] = useState<string>(() => {
    if (hasActivePaidSubscription && subscription?.plan) {
      return subscription.plan;
    }
    return 'premium';
  });

  const handlePlanSelection = useCallback(() => {
    if (hasActivePaidSubscription || selectedPlan === 'free') return;
    navigate('/payment', { state: { planKey: selectedPlan } });
  }, [hasActivePaidSubscription, selectedPlan, navigate]);

  return {
    subscription,
    isLoading,
    selectedPlan,
    setSelectedPlan,
    hasActivePaidSubscription,
    handlePlanSelection
  };
};