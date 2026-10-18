export interface PaymentRequest {
  action: 'checkout';
  planKey: string;
  promoCode?: string;
}
export interface PaymentResponse {
  sessionId: string;
  completed: boolean;
  url: string | null;
}
export interface PaymentLocationState {
  planKey?: string;
}
