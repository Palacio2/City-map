import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaPaperPlane, FaSketch, FaCog, FaTrashAlt, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

export default function AiSidebar({ isOpen, onClose, onOpenSettings }) {
  const { t, i18n } = useTranslation('db');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  
  // Стани для ідеальної анімації
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let timeoutId;
    let raf1, raf2;

    if (isOpen) {
      setShouldRender(true);
      try {
        const savedPrefs = localStorage.getItem('geo_analyzer_ai_prefs');
        if (savedPrefs) setChatContext(JSON.parse(savedPrefs));
      } catch (err) {
        console.error(err);
      }
      
      // Даємо браузеру відмалювати елемент за межами екрану, а потім запускаємо анімацію
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      
    } else if (shouldRender) {
      setIsAnimating(false);
      // Чекаємо завершення CSS-транзиції (300ms) перед видаленням з DOM
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen, shouldRender]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = useMemo(() => {
    if (!chatContext?.city) return [
      t('assistant.sidebar.prompts.def1'), 
      t('assistant.sidebar.prompts.def2'), 
      t('assistant.sidebar.prompts.def3'), 
      t('assistant.sidebar.prompts.def4')
    ];
    
    const city = chatContext.city;
    let prompts = [];
    
    if (chatContext.purpose === 'investment') prompts.push(t('assistant.sidebar.prompts.investment', { city }));
    if (chatContext.purpose === 'living') prompts.push(t('assistant.sidebar.prompts.living', { city }));
    if (chatContext.budget) prompts.push(t('assistant.sidebar.prompts.budget', { budget: chatContext.budget }));
    if (chatContext.safetyImportance === 'critical') prompts.push(t('assistant.sidebar.prompts.safety', { city }));
    if (chatContext.ecologyImportance === 'high') prompts.push(t('assistant.sidebar.prompts.ecology'));
    if (chatContext.transport === 'public') prompts.push(t('assistant.sidebar.prompts.transport'));
    if (chatContext.amenities?.includes('dog_parks')) prompts.push(t('assistant.sidebar.prompts.pets'));
    if (chatContext.vibe === 'quiet') prompts.push(t('assistant.sidebar.prompts.quiet', { city }));

    if (prompts.length < 4) {
      prompts.push(t('assistant.sidebar.prompts.overview', { city }));
      prompts.push(t('assistant.sidebar.prompts.cheapest'));
    }

    return prompts.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [chatContext, t]);

  if (!shouldRender) return null;

  const handleSend = async (textOrEvent) => {
    if (typeof textOrEvent === 'object') textOrEvent.preventDefault();
    
    const textToSend = typeof textOrEvent === 'string' ? textOrEvent : message;
    if (!textToSend.trim()) return;

    const newUserMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setMessage('');
    setIsTyping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: textToSend,
          context: chatContext,
          history: messages,
          language: i18n.language
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      
      const aiResponse = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: data.text 
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: t('assistant.sidebar.error_msg') 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([]);

  const sidebarContent = (
    <div className="fixed inset-0 z-[9998] flex justify-end">
      {/* Темний Оверлей з анімацією прозорості */}
      <div 
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      {/* Сама панель з анімацією виїзду */}
      <div className={`relative w-full max-w-[480px] h-[100dvh] bg-surface flex flex-col shadow-2xl border-l border-borderClient transition-transform duration-300 ease-out ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Хедер чату */}
        <div className="p-4 md:p-5 border-b border-borderClient flex justify-between items-center bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-accent to-accent-hover text-white rounded-full flex items-center justify-center text-lg shadow-sm">
              <FaSketch />
            </div>
            <div>
              <h3 className="font-heading font-bold text-textMain text-[1.1rem] leading-tight">{t('assistant.sidebar.title')}</h3>
              {/* Статус онлайн видалено */}
            </div>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <button className="w-9 h-9 rounded-full flex items-center justify-center bg-hover text-textSecondary hover:bg-danger hover:text-white transition-colors" onClick={clearChat} title={t('assistant.sidebar.tooltip_clear')}>
                <FaTrashAlt />
              </button>
            )}
            <button className="w-9 h-9 rounded-full flex items-center justify-center bg-hover text-textSecondary hover:bg-accent hover:text-white transition-colors" onClick={onOpenSettings} title={t('assistant.sidebar.tooltip_settings')}>
              <FaCog />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center bg-hover text-textSecondary hover:bg-danger/10 hover:text-danger transition-colors" onClick={onClose} title={t('assistant.sidebar.tooltip_close')}>
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Область повідомлень */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-body custom-scrollbar">
          {messages.length === 0 && (
            <div className="m-auto w-full max-w-[90%]">
              <div className="bg-surface p-6 rounded-2xl border border-borderClient text-center shadow-sm">
                <FaSketch className="text-5xl text-accent mx-auto mb-3 opacity-80" />
                <h4 className="font-heading font-bold text-lg text-textMain mb-2">{t('assistant.sidebar.welcome_title')}</h4>
                
                {chatContext?.city ? (
                  <p className="text-sm text-textSecondary leading-relaxed">
                    {t('assistant.sidebar.welcome_city')} <strong className="text-textMain">{chatContext.city}</strong>. 
                    {chatContext.safetyImportance === 'critical' && t('assistant.sidebar.welcome_safety')}
                    {chatContext.ecologyImportance === 'high' && t('assistant.sidebar.welcome_ecology')}
                  </p>
                ) : (
                  <div className="text-warning text-sm font-medium flex items-center justify-center gap-2 mt-4 bg-warning/10 p-3 rounded-lg border border-warning/20">
                    <FaExclamationCircle className="shrink-0" />
                    <span>{t('assistant.sidebar.welcome_no_prefs')}</span>
                  </div>
                )}
                
                <p className="mt-5 text-sm font-medium text-textMain">{t('assistant.sidebar.welcome_choose_prompt')}</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {quickPrompts.map((prompt, idx) => (
                  <button 
                    key={idx} 
                    className="bg-surface border border-accent/30 text-textMain px-4 py-2 rounded-full text-xs font-medium hover:bg-accent hover:text-white hover:border-transparent transition-all shadow-sm hover:shadow-md"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Список повідомлень */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover text-white rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <FaSketch size={14} />
                </div>
              )}
              <div className={`p-3.5 rounded-2xl text-[0.95rem] leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-br from-accent to-accent-hover text-white rounded-br-sm' 
                  : 'bg-surface text-textMain border border-borderClient rounded-bl-sm'
              }`}>
                <div className="[&>p]:mb-2 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:mb-2 [&_strong]:font-bold [&_strong]:text-current [&_a]:text-blue-400 [&_a]:underline">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* Індикатор друкування */}
          {isTyping && (
            <div className="flex gap-3 max-w-[90%] self-start">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover text-white rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1">
                <FaSketch size={14} />
              </div>
              <div className="bg-surface p-4 rounded-2xl rounded-bl-sm border border-borderClient flex gap-1.5 items-center shadow-sm">
                <span className="w-2 h-2 bg-accent rounded-full animate-[bounce_1.4s_infinite_ease-in-out] [animation-delay:-0.32s]" />
                <span className="w-2 h-2 bg-accent rounded-full animate-[bounce_1.4s_infinite_ease-in-out] [animation-delay:-0.16s]" />
                <span className="w-2 h-2 bg-accent rounded-full animate-[bounce_1.4s_infinite_ease-in-out]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Область вводу */}
        <form onSubmit={handleSend} className="p-4 bg-surface border-t border-borderClient flex gap-3 shrink-0">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('assistant.sidebar.input_placeholder')}
            className="flex-1 ui-input rounded-full py-3.5 px-5 text-[0.95rem]"
          />
          <button 
            type="submit" 
            className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:transform-none disabled:shadow-none shrink-0" 
            disabled={!message.trim() && !isTyping}
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sidebarContent, document.body);
}