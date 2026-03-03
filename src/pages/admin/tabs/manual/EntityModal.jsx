import React, { useState, useEffect, useRef } from 'react';
import styles from './EntityModal.module.css';

export default function EntityModal({ isOpen, onClose, onSubmit, title, placeholder, isSubmitting }) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSubmit(inputValue.trim());
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={`${styles.btn} ${styles.cancelBtn}`} disabled={isSubmitting}>
                            Скасувати
                        </button>
                        <button type="submit" className={`${styles.btn} ${styles.submitBtn}`} disabled={!inputValue.trim() || isSubmitting}>
                            {isSubmitting ? '⏳...' : 'Створити'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}