import { z } from 'zod';

export const PaymentResponseSchema = z.object({
  clientSecret: z.string().min(1),
  amount: z.number().min(0),
  mode: z.enum(['payment', 'setup']),
});