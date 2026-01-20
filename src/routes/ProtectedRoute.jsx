import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../pages/subscription/SubscriptionContext';

const ProtectedRoute = ({ children, requiredPlan = 'premium' }) => {
  const { isLoading, isPremium, isPro } = useSubscription();

  if (isLoading) {
    return null;
  }

  if (requiredPlan === 'premium' && !isPremium) {
    return <Navigate to="/subscription" replace />;
  }

  if (requiredPlan === 'pro' && !isPro && !isPremium) {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};

export default ProtectedRoute;