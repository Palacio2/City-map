import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSubscription } from '@subscription/contex/SubscriptionContext';

interface ProtectedRouteProps {
  readonly children: ReactNode;
  readonly requiredPlan?: 'premium' | 'realtor';
}

export default function ProtectedRoute({ children, requiredPlan = 'premium' }: ProtectedRouteProps) {
  const { isLoading, isPremium, isRealtor } = useSubscription();

  if (isLoading) {
    return null;
  }

  if (requiredPlan === 'realtor' && !isRealtor) {
    return <Navigate to="/subscription" replace />;
  }

  if (requiredPlan === 'premium' && !isPremium) {
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
}