import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';
import styles from './CancelModal.module.css';

const CancelModal = ({ onClose, onConfirm, isProcessing, error }) => {
  const { t } = useTranslation('billing');

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalWarningIcon}><FaExclamationTriangle /></div>
        <h3>{t('cancel_sub')}</h3>
        <p>{t('cancel_confirm')}</p>
        
        {error && <p className={styles.errorText}>{error}</p>}
        
        <div className={styles.modalActions}>
          <button 
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('back_to_profile')}
          </button>
          <button 
            className={styles.btnDanger}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? t('processing') : t('cancel_btn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;