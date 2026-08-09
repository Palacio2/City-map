import { z } from 'zod';
import type { SubscriptionContextType } from '../types';

export const SubscriptionContextSchema = z.custom<SubscriptionContextType>(
  (val) => val !== null && typeof val === 'object',
  "useSubscription must be used within a SubscriptionProvider"
);