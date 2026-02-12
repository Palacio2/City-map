import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import styles from './CancelModal.module.css';

const CancelModal = ({ onClose, onConfirm, isProcessing, error, t }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalWarningIcon}><FaExclamationTriangle /></div>
        <h3>{t('billing:cancel_sub')}</h3>
        <p>{t('billing:cancel_confirm')}</p>
        
        {error && <p className={styles.errorText}>{error}</p>}
        
        <div className={styles.modalActions}>
          <button 
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('profile:actions.back_to_profile')}
          </button>
          <button 
            className={styles.btnDanger}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'billing:processing' : t('billing:cancel_btn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;