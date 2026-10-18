export const AI_LIMITS = { messageChars: 4000, historyMessages: 20, historyChars: 16000, responseChars: 16000, outputTokens: 2048, hourlyRequests: 30, dailyRequests: 100 } as const;
export interface AiChatRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  context: { city: string; budget: string; purpose: string } | null;
  language: 'uk' | 'en' | 'pl';
}
export function parseAiRequest(value: Record<string, unknown>): AiChatRequest {
  if (typeof value.message !== 'string' || !value.message.trim() || value.message.length > AI_LIMITS.messageChars) throw new Error('Invalid message');
  const history = value.history ?? [];
  if (!Array.isArray(history) || history.length > AI_LIMITS.historyMessages) throw new Error('Invalid history');
  let total = 0;
  const messages = history.map(row => {
    if (!row || typeof row !== 'object' || !['user', 'assistant'].includes(row.role)
      || typeof row.content !== 'string' || !row.content.trim()
      || row.content.length > (row.role === 'assistant' ? AI_LIMITS.responseChars : AI_LIMITS.messageChars)) throw new Error('Invalid history');
    total += row.content.length;
    return { role: row.role as 'user' | 'assistant', content: row.content as string };
  });
  if (total > AI_LIMITS.historyChars || messages.some((row, i) => row.role !== (i % 2 === 0 ? 'user' : 'assistant'))
    || (messages.length && messages.at(-1)?.role !== 'assistant')) throw new Error('Invalid history');
  const raw = value.context;
  let context: AiChatRequest['context'] = null;
  if (raw != null) {
    if (typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid context');
    const data = raw as Record<string, unknown>;
    if (['city', 'budget', 'purpose'].some(key => typeof data[key] !== 'string' || (data[key] as string).length > 200)) throw new Error('Invalid context');
    context = { city: data.city as string, budget: data.budget as string, purpose: data.purpose as string };
  }
  const language = value.language ?? 'uk';
  if (!['uk', 'en', 'pl'].includes(String(language))) throw new Error('Invalid language');
  return { message: value.message.trim(), history: messages, context, language: language as AiChatRequest['language'] };
}
