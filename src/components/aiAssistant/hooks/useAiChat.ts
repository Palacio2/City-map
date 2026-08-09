import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import type { AiMessage, AiPreferences } from '../types';

export const useAiChat = (preferences: AiPreferences | null) => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (text: string) => aiApi.chat(text, messages, preferences),
    onSuccess: (reply) => {
      const aiMsg: AiMessage = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    }
  });

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: AiMessage = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    chatMutation.mutate(text.trim());
  }, [chatMutation]);

  const clearChat = useCallback(() => setMessages([]), []);

  return {
    messages,
    isTyping: chatMutation.isPending,
    isError: chatMutation.isError,
    sendMessage,
    clearChat,
    messagesEndRef
  };
};