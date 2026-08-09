import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaPaperPlane, FaCog, FaTrashAlt, FaExclamationCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { useAiPreferences } from './hooks/useAiPreferences';
import { useAiChat } from './hooks/useAiChat';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import type { AiSidebarProps } from './types';

export default function AiSidebar({ isOpen, onClose, onOpenSettings }: AiSidebarProps) {
  const { t } = useTranslation('db');
  const { preferences, clearPreferences } = useAiPreferences();
  const { messages, isTyping, isError, sendMessage, clearChat, messagesEndRef } = useAiChat(preferences);
  const [input, setInput] = useState('');

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, messagesEndRef]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  };

  const handleClear = () => {
    clearChat();
    clearPreferences();
    onOpenSettings();
  };

  if (!isOpen) return null;

  const sidebarContent = (
    <div className="fixed inset-0 z-[3000] flex justify-end bg-black/40 backdrop-blur-sm animate-fadeIn">
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-none cursor-default"
        onClick={onClose}
        aria-label={t('ia.assistant.sidebar.tooltip_close')}
      />
      <aside className="relative w-full max-w-[400px] h-full bg-surface border-l border-borderClient flex flex-col shadow-2xl animate-slideLeft">
        <header className="flex items-center justify-between p-4 border-b border-borderClient bg-body/50">
          <h2 className="font-heading font-bold text-lg text-textMain flex items-center gap-2">
            <span className="text-accent">AI</span> {t('ia.assistant.sidebar.title')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full flex items-center justify-center text-textSecondary hover:bg-hover hover:text-accent transition-colors cursor-pointer"
              title={t('ia.assistant.sidebar.tooltip_settings')}
            >
              <FaCog />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="w-8 h-8 rounded-full flex items-center justify-center text-textSecondary hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
              title={t('ia.assistant.sidebar.tooltip_clear')}
            >
              <FaTrashAlt />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-textSecondary hover:bg-hover hover:text-textMain transition-colors cursor-pointer"
              title={t('ia.assistant.sidebar.tooltip_close')}
            >
              <FaTimes />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-textSecondary gap-4 opacity-70">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl">
                AI
              </div>
              <p className="max-w-[250px]">{t('ia.assistant.sidebar.welcome_title')}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem] ${msg.role === 'user' ? 'bg-accent text-white rounded-br-none' : 'bg-hover text-textMain border border-borderClient rounded-bl-none'}`}>
                <div className="prose prose-sm dark:prose-invert">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-hover border border-borderClient rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-textSecondary animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-textSecondary animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-textSecondary animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-2 text-danger bg-danger/10 p-3 rounded-lg text-sm">
              <FaExclamationCircle />
              {t('ia.assistant.sidebar.error_msg')}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-borderClient bg-body/50">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('ia.assistant.sidebar.input_placeholder')}
              className="w-full bg-surface border border-borderClient rounded-full pl-4 pr-12 py-3 text-sm text-textMain focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95 cursor-pointer"
            >
              <FaPaperPlane className="text-xs -ml-0.5" />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );

  return createPortal(sidebarContent, document.body);
}