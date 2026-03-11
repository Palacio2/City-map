import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import styles from './AdminUI.module.css';

const BaseModal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxWidth = '500px', 
    actions = null,
    bodyStyle = {},
    disableEscClose = false
}) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !disableEscClose) onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, disableEscClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div 
                className={styles.modalContent} 
                style={{ maxWidth }} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>{title}</h3>
                    <button onClick={onClose} className={styles.modalCloseBtn} aria-label="Закрити">
                        <FaTimes />
                    </button>
                </div>
                
                <div className={styles.modalBody} style={bodyStyle}>
                    {children}
                </div>

                {actions && (
                    <div className={styles.modalActions}>
                        {actions}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default React.memo(BaseModal);