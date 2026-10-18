import { supabase } from '@supabaseClient';
import i18n from '../../../i18n/i18n';
import { AI_LIMITS, parseAiRequest } from '../../../../shared/aiContract';
import type { AiMessage, AiPreferences } from '../types';

export const aiApi = {
  chat: async (message: string, history: AiMessage[], prefs: AiPreferences | null): Promise<string> => {
    const body = parseAiRequest({ message,
      history: history.map(({ role, content }) => ({ role, content })), context: prefs,
      language: i18n.resolvedLanguage?.split('-')[0] || 'uk' });
    const { data, error } = await supabase.functions.invoke<{ text: string }>('gemini-chat', {
      body,
    });
    if (error) throw error;
    if (!data || typeof data.text !== 'string' || !data.text.trim() || data.text.length > AI_LIMITS.responseChars) throw new Error('Invalid AI response');
    return data.text;
  }
};
