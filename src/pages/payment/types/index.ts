export interface PaymentRequest {
  planKey: string;
  promoCode?: string | null;
}

export interface PaymentResponse {
  clientSecret: string;
  amount: number;
  mode: 'payment' | 'setup';
}

export interface PaymentLocationState {
  planKey?: string;
  amount?: number;
}