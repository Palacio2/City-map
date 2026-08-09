import type { IconType } from 'react-icons';

export interface PlanConfig {
  name: string;
  icon: IconType;
  features: string[];
  disabledFeatures: string[];
}

export interface SubscriptionData {
  plan: string;
  isExpired?: boolean;
  expiresAt?: string | null;
  cancel_at?: string | null;
  status?: string;
  features?: string[];
  [key: string]: unknown;
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