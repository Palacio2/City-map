export interface AiPreferences {
  city: string;
  budget: string;
  purpose: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AiSidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onOpenSettings: () => void;
}

export interface AiAssistantModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}