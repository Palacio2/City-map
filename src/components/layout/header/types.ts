import type { User } from '@supabase/supabase-js';

export const SUPPORTED_LANGUAGES = ['uk', 'en', 'pl'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export interface HeaderNavProps {
  isAuthenticated: boolean;
  user: User | null;
  onLinkClick: () => void;
}

export interface HeaderDesktopProps {
  theme: string;
  toggleTheme: () => void;
  isAuthenticated: boolean;
  isPremium: boolean;
  isRealtor: boolean;
  hasConsent: boolean;
  handleAiClick: () => void;
  handleAuthClick: () => void;
  iconBtnClass: string;
}

export interface HeaderMobileProps extends HeaderDesktopProps {
  user: User | null;
  onClose: () => void;
}
