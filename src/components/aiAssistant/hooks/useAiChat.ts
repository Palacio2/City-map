import { useState, useCallback, useRef, useEffect } from 'react';
import { aiApi } from '../api/aiApi';
import { AI_LIMITS } from '../../../../shared/aiContract';
import type { AiMessage, AiPreferences } from '../types';

// Only completed turns belong in the next request's history.
function boundedHistory(messages: AiMessage[]) {
  const history = messages.slice(-AI_LIMITS.historyMessages);
  let size = history.reduce((total, row) => total + row.content.length, 0);
  while (size > AI_LIMITS.historyChars && history.length) {
    size -= history.splice(0, 2).reduce((total, row) => total + row.content.length, 0);
  }
  return history;
}

export const useAiChat = (preferences: AiPreferences | null) => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isError, setIsError] = useState(false);
  const transcript = useRef<AiMessage[]>([]);
  const generation = useRef(0);
  const busy = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => { generation.current++; busy.current = false; }, []);

  const sendMessage = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || busy.current) return;
    if (content.length > AI_LIMITS.messageChars) { setIsError(true); return; }
    busy.current = true;
    setIsTyping(true);
    setIsError(false);
    const requestGeneration = generation.current;
    const history = boundedHistory(transcript.current);
    const userMessage: AiMessage = { id: crypto.randomUUID(), role: 'user', content, timestamp: Date.now() };
    setMessages([...transcript.current, userMessage]);
    try {
      const reply = await aiApi.chat(content, history, preferences);
      if (generation.current !== requestGeneration) return;
      const assistant: AiMessage = { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: Date.now() };
      transcript.current = boundedHistory([...transcript.current, userMessage, assistant]);
      setMessages(transcript.current);
    } catch {
      if (generation.current !== requestGeneration) return;
      setMessages(transcript.current);
      setIsError(true);
    } finally {
      if (generation.current === requestGeneration) {
        busy.current = false;
        setIsTyping(false);
      }
    }
  }, [preferences]);

  const clearChat = useCallback(() => {
    generation.current++;
    busy.current = false;
    transcript.current = [];
    setMessages([]);
    setIsTyping(false);
    setIsError(false);
  }, []);
  return { messages, isTyping, isError, sendMessage, clearChat, messagesEndRef };
};
