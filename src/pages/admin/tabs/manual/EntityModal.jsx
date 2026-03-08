import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';

export default function EntityModal({ isOpen, onClose, onSubmit, title, placeholder, isSubmitting }) {
    const { t } = useTranslation('admin');
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) onSubmit(inputValue.trim());
    };

    const actions = (
        <>
            <button type="button" onClick={onClose} className={`${uiStyles.btn} ${uiStyles.btnCancel}`} disabled={isSubmitting}>
                {t('entityModal.cancelBtn', {defaultValue: 'Cancel'})}
            </button>
            <button type="submit" form="entityForm" className={`${uiStyles.btn} ${uiStyles.btnPrimary}`} disabled={!inputValue.trim() || isSubmitting}>
                {isSubmitting ? t('entityModal.processing', {defaultValue: '...'}) : t('entityModal.createBtn', {defaultValue: 'Create'})}
            </button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px" actions={actions}>
            <form id="entityForm" onSubmit={handleSubmit} className={uiStyles.formGroup}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isSubmitting}
                    className={uiStyles.input}
                />
            </form>
        </BaseModal>
    );
}