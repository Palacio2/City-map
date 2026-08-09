import { authenticatedApiRequest } from '@api/apiClient';
import type { AiMessage, AiPreferences } from '../types';

export const aiApi = {
  chat: async (message: string, history: AiMessage[], prefs: AiPreferences | null): Promise<string> => {
    const response = await authenticatedApiRequest<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, prefs })
    });
    return response.reply;
  }
};