import React from 'react';
import styles from './EntityModal.module.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing }) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {message}
                </p>
                <div className={styles.actions}>
                    <button type="button" onClick={onClose} className={`${styles.btn} ${styles.cancelBtn}`} disabled={isProcessing}>
                        Скасувати
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirm} 
                        className={`${styles.btn} ${styles.submitBtn}`} 
                        style={{ background: '#ef4444', color: 'white' }} 
                        disabled={isProcessing}
                    >
                        {isProcessing ? '⏳...' : '🗑️ Видалити'}
                    </button>
                </div>
            </div>
        </div>
    );
}