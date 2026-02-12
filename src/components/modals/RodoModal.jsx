import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaSignOutAlt, FaCheck } from 'react-icons/fa';
import styles from './RodoModal.module.css';

export default function RodoModal({ onAccept, onDecline }) {
  const { t } = useTranslation('rodo');
  const [isProcessing, setIsProcessing] = useState(false);

  // Блокуємо скрол сторінки, поки модалка відкрита
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Повертаємо скрол при закритті компонента
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAcceptClick = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const modalHTML = (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.iconWrapper}>
          <FaShieldAlt className={styles.icon} />
        </div>
        
        <h2>{t('rodo.welcome')}</h2>
        
        <p className={styles.text}>
          {t('rodo.description_prefix')}{' '}
          <Link to="/terms" className={styles.link}>
            {t('rodo.terms_link')}
          </Link>.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.infoTitle}>{t('rodo.we_store_title')}</p>
          <ul>
            <li>{t('rodo.store_history')}</li>
            <li>{t('rodo.store_favorites')}</li>
            <li>{t('rodo.store_stats')}</li>
          </ul>
          <p className={styles.analyticsNote}>{t('rodo.analytics_note')}</p>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.acceptBtn} 
            onClick={handleAcceptClick}
            disabled={isProcessing}
          >
            {isProcessing ? t('rodo.processing') : (
              <>
                <FaCheck /> {t('rodo.accept_btn')}
              </>
            )}
          </button>
          
          <button 
            className={styles.declineBtn} 
            onClick={onDecline}
            disabled={isProcessing}
          >
            <FaSignOutAlt /> {t('rodo.decline_btn')}
          </button>
        </div>
        
        <p className={styles.footerText}>
          {t('rodo.guest_mode_note')}
        </p>
      </div>
    </div>
  );

  return createPortal(modalHTML, document.body);
}