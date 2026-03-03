import React from 'react';
import styles from './EntityModal.module.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing }) {
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
                        Скасувати
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirm} 
                        className={`${styles.btn} ${styles.dangerBtn}`} 
                        disabled={isProcessing}
                    >
                        {isProcessing ? '⏳...' : '🗑️ Видалити'}
                    </button>
                </div>
            </div>
        </div>
    );
}