import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaPaperPlane, FaSketch, FaCog, FaTrashAlt, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import styles from './AiSidebar.module.css';

export default function AiSidebar({ isOpen, onClose, onOpenSettings }) {
  const { t } = useTranslation('assistant');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      try {
        const savedPrefs = localStorage.getItem('geo_analyzer_ai_prefs');
        if (savedPrefs) {
          setChatContext(JSON.parse(savedPrefs));
        }
      } catch (err) {
        console.error(err);
      }
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = useMemo(() => {
    if (!chatContext?.city) return [
      t('sidebar.prompts.def1'), 
      t('sidebar.prompts.def2'), 
      t('sidebar.prompts.def3'), 
      t('sidebar.prompts.def4')
    ];
    
    const city = chatContext.city;
    let prompts = [];
    
    if (chatContext.purpose === 'investment') prompts.push(t('sidebar.prompts.investment', { city }));
    if (chatContext.purpose === 'living') prompts.push(t('sidebar.prompts.living', { city }));
    if (chatContext.budget) prompts.push(t('sidebar.prompts.budget', { budget: chatContext.budget }));
    if (chatContext.safetyImportance === 'critical') prompts.push(t('sidebar.prompts.safety', { city }));
    if (chatContext.ecologyImportance === 'high') prompts.push(t('sidebar.prompts.ecology'));
    if (chatContext.transport === 'public') prompts.push(t('sidebar.prompts.transport'));
    if (chatContext.amenities?.includes('dog_parks')) prompts.push(t('sidebar.prompts.pets'));
    if (chatContext.vibe === 'quiet') prompts.push(t('sidebar.prompts.quiet', { city }));

    if (prompts.length < 4) {
      prompts.push(t('sidebar.prompts.overview', { city }));
      prompts.push(t('sidebar.prompts.cheapest'));
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
          history: messages
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
        text: t('sidebar.error_msg') 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([]);

  const sidebarContent = (
    <>
      <div className={`${styles.overlay} ${isClosing ? styles.closing : ''}`} onClick={onClose} />
      <div className={`${styles.sidebar} ${isClosing ? styles.closing : ''}`}>
        
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.aiAvatar}>
              <FaSketch />
            </div>
            <div>
              <h3>{t('sidebar.title')}</h3>
              <span className={styles.status}>{t('sidebar.status_online')}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            {messages.length > 0 && (
              <button className={styles.iconBtn} onClick={clearChat} title={t('sidebar.tooltip_clear')}>
                <FaTrashAlt />
              </button>
            )}
            <button className={styles.iconBtn} onClick={onOpenSettings} title={t('sidebar.tooltip_settings')}>
              <FaCog />
            </button>
            <button className={styles.iconBtn} onClick={onClose} title={t('sidebar.tooltip_close')}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className={styles.chatArea}>
          {messages.length === 0 && (
            <div className={styles.welcomeState}>
              <div className={styles.welcomeMessage}>
                <FaSketch className={styles.welcomeIcon} />
                <h4>{t('sidebar.welcome_title')}</h4>
                
                {chatContext?.city ? (
                  <p>
                    {t('sidebar.welcome_city')} <strong>{chatContext.city}</strong>. 
                    {chatContext.safetyImportance === 'critical' && t('sidebar.welcome_safety')}
                    {chatContext.ecologyImportance === 'high' && t('sidebar.welcome_ecology')}
                  </p>
                ) : (
                  <div style={{ color: 'var(--warning-color)', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <FaExclamationCircle />
                    <span>{t('sidebar.welcome_no_prefs')}</span>
                  </div>
                )}
                
                <p style={{ marginTop: '1rem' }}>{t('sidebar.welcome_choose_prompt')}</p>
              </div>
              
              <div className={styles.quickPrompts}>
                {quickPrompts.map((prompt, idx) => (
                  <button 
                    key={idx} 
                    className={styles.promptBtn}
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.messageWrapper} ${styles[msg.sender]}`}>
              {msg.sender === 'ai' && (
                <div className={styles.messageAvatar}>
                  <FaSketch />
                </div>
              )}
              <div className={styles.messageBubble}>
                <div className={styles.markdownContent}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className={`${styles.messageWrapper} ${styles.ai}`}>
              <div className={styles.messageAvatar}>
                <FaSketch />
              </div>
              <div className={styles.typingIndicator}>
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className={styles.inputArea}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('sidebar.input_placeholder')}
            className={styles.input}
          />
          <button type="submit" className={styles.sendBtn} disabled={!message.trim() && !isTyping}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </>
  );

  return ReactDOM.createPortal(sidebarContent, document.body);
}