import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaPaperPlane, FaSketch, FaCog, FaTrashAlt } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import ReactMarkdown from 'react-markdown';
import styles from './AiSidebar.module.css';

export default function AiSidebar({ isOpen, onClose, onOpenSettings }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const savedPrefs = localStorage.getItem('geo_analyzer_ai_prefs');
      if (savedPrefs) {
        setChatContext(JSON.parse(savedPrefs));
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const generateQuickPrompts = () => {
    const prompts = ["Зроби огляд ринку", "Які райони найзеленіші?"];
    if (!chatContext) return prompts;
    
    if (chatContext.purpose === 'investment') prompts.unshift(`Топ райони для інвестицій у м. ${chatContext.city || 'вашому місті'}`);
    if (chatContext.purpose === 'living') prompts.unshift(`Найбезпечніші райони у м. ${chatContext.city || 'вашому місті'}`);
    if (chatContext.pets) prompts.push("Райони з великими парками");
    if (chatContext.budget) prompts.push(`Що можна купити за ${chatContext.budget}?`);
    
    return prompts.slice(0, 4);
  };

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

      if (!response.ok) throw new Error('Помилка сервера AI');

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
        text: 'Вибачте, сталася помилка при підключенні до AI. Спробуйте пізніше.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([]);

  const sidebarContent = (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.aiAvatar}>
              <FaSketch />
            </div>
            <div>
              <h3>AI Аналітик</h3>
              <span className={styles.status}>Онлайн</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            {messages.length > 0 && (
              <button className={styles.iconBtn} onClick={clearChat} title="Очистити чат">
                <FaTrashAlt />
              </button>
            )}
            <button className={styles.iconBtn} onClick={onOpenSettings} title="Налаштування пошуку">
              <FaCog />
            </button>
            <button className={styles.iconBtn} onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className={styles.chatArea}>
          {messages.length === 0 && (
            <div className={styles.welcomeState}>
              <div className={styles.welcomeMessage}>
                <FaSketch className={styles.welcomeIcon} />
                <h4>Привіт! Я ваш AI-помічник.</h4>
                <p>
                  Я пам'ятаю, що ви шукаєте нерухомість у місті <strong>{chatContext?.city || '...'}</strong> 
                  {chatContext?.budget && ` з бюджетом ${chatContext.budget}`}.
                </p>
                <p>Оберіть швидке питання або напишіть своє:</p>
              </div>
              
              <div className={styles.quickPrompts}>
                {generateQuickPrompts().map((prompt, idx) => (
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
                <ReactMarkdown className={styles.markdownContent}>
                  {msg.text}
                </ReactMarkdown>
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
            placeholder="Запитайте про райони, ціни, інфраструктуру..."
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