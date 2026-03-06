import React from 'react';
import styles from './EntityModal.module.css';
import { useTranslation } from 'react-i18next';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing }) {
    const { t } = useTranslation('admin');
    
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.messageText}>
                    {message}
                </p>
                <div className={styles.actions}>
                    <button type="button" onClick={onClose} className={`${styles.btn} ${styles.cancelBtn}`} disabled={isProcessing}>
                        {t('confirmModal.cancelBtn')}
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirm} 
                        className={`${styles.btn} ${styles.dangerBtn}`} 
                        disabled={isProcessing}
                    >
                        {isProcessing ? t('confirmModal.processing') : t('confirmModal.deleteBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
}