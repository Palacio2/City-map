import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaPaperPlane, FaSketch, FaCog, FaTrashAlt, FaExclamationCircle } from 'react-icons/fa';
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
      try {
        const savedPrefs = localStorage.getItem('geo_analyzer_ai_prefs');
        if (savedPrefs) {
          setChatContext(JSON.parse(savedPrefs));
        }
      } catch (err) {
        console.error("Failed to parse AI prefs", err);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = useMemo(() => {
    if (!chatContext?.city) return ["Як працює пошук?", "Які міста доступні?", "Як оцінюється безпека?", "Що таке рейтинг районів?"];
    
    const city = chatContext.city;
    let prompts = [];
    
    if (chatContext.purpose === 'investment') prompts.push(`Найкращі райони для інвестицій у м. ${city}`);
    if (chatContext.purpose === 'living') prompts.push(`Де краще жити у м. ${city}?`);
    if (chatContext.budget) prompts.push(`Що можна купити за ${chatContext.budget}?`);
    if (chatContext.propertyType === 'Будинок') prompts.push(`В яких районах найкраще купувати будинок?`);
    if (chatContext.safetyImportance === 'Критично') prompts.push(`Назви найбезпечніші райони м. ${city}`);
    if (chatContext.ecologyImportance === 'Дуже важливо') prompts.push(`Райони з найкращим повітрям та парками`);
    if (chatContext.transport === 'public' && chatContext.maxCommute) prompts.push(`Райони з хорошим транспортом (до ${chatContext.maxCommute} хв)`);
    if (chatContext.pets) prompts.push("Де найкраще жити з собакою?");

    if (prompts.length < 4) {
      prompts.push(`Зроби загальний огляд ринку м. ${city}`);
      prompts.push(`Які райони зараз найдешевші?`);
    }

    return prompts.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [chatContext]);

  if (!isOpen) return null;

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
        text: "⚠️ Вибачте, сталася помилка при підключенні до AI. Спробуйте пізніше або перевірте інтернет-з'єднання." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([]);

  const sidebarContent = (
    <>
      <div className={styles.overlay} />
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
            <button className={styles.iconBtn} onClick={onClose} title="Закрити">
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
                
                {chatContext?.city ? (
                  <p>
                    Я налаштований на пошук у місті <strong>{chatContext.city}</strong>. 
                    {chatContext.safetyImportance === 'Критично' && ' Буду звертати особливу увагу на рівень безпеки.'}
                    {chatContext.ecologyImportance === 'Дуже важливо' && ' Врахую наявність парків та якість повітря.'}
                  </p>
                ) : (
                  <div style={{ color: 'var(--warning-color)', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <FaExclamationCircle />
                    <span>Ви ще не налаштували параметри пошуку. Натисніть на шестірню зверху.</span>
                  </div>
                )}
                
                <p style={{ marginTop: '1rem' }}>Оберіть швидке питання або напишіть своє:</p>
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