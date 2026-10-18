import type { IconType } from 'react-icons';

export interface PlanConfig {
  name: string;
  icon: IconType;
  features: string[];
  disabledFeatures: string[];
}

export interface SubscriptionData {
  billingUnavailable?: boolean;
  id?: string | null;
  source?: 'paid' | 'gift' | null;
  paidSubscriptions?: PaidSubscription[];
  plan: string;
  isExpired?: boolean;
  expiresAt?: string | null;
  cancel_at?: string | null;
  status?: string;
  features?: string[];
  [key: string]: unknown;
}

export interface PaidSubscription {
  id: string;
  plan: string;
  status: string;
  expiresAt: string | null;
  cancel_at: string | null;
}

export interface SubscriptionContextType {
  subscription: SubscriptionData;
  isLoading: boolean;
  hasFeature: (feature: string) => boolean;
  isPremium: boolean;
  isRealtor: boolean;
  isFree: boolean;
  updateSubscription: (waitForPlan?: string | null) => Promise<void>;
  getFeatureKeys: () => string[];
}
