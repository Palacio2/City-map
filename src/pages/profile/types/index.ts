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
  plan_name?: string | null;
  invoice_number?: string | null;
  cancel_at?: string;
  created_at: string;
  amount: number;
  amount_minor: number;
  currency: string;
  payment_id?: string;
  status?: string;
}

export interface BillingHistoryResponse {
  subscriptions: BillingItem[];
  count: number;
}

export interface ProfileHeaderProps {
  readonly profile: UserProfile;
}

export interface QuickActionsProps {
  onEditClick?: () => void;
  onChangePasswordClick?: () => void;
  onBillingClick?: () => void;
}

import type { SubscriptionData } from '@subscription/types';

export interface SubscriptionCardProps {
  readonly subscription: SubscriptionData | null;
  readonly onManage: () => void;
  readonly onCancel?: (id: string) => void;
  readonly isCancelling: boolean;
  readonly error?: string | null;
}

export interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface BillingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface BillingTableProps {
  readonly history: BillingItem[];
  readonly expandedItems: Record<string, boolean>;
  readonly onToggleRow: (id: string) => void;
}

export interface AvatarUploadProps {
  readonly uid: string | null;
  readonly url: string | null;
  readonly onUpload: (url: string) => void;
}

export interface CancelModalProps {
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isProcessing: boolean;
  readonly error?: string | null;
}
