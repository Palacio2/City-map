export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
}

export interface ProfileEditPayload {
  full_name: string;
  phone?: string;
}

export interface StatusMessage {
  type: 'success' | 'error' | '';
  text: string;
}

export interface BillingItem {
  id: string;
  plan_name?: string;
  cancel_at?: string;
  created_at: string;
  amount: number;
  payment_id?: string;
  status?: string;
}

export interface BillingHistoryResponse {
  subscriptions: BillingItem[];
  count: number;
}