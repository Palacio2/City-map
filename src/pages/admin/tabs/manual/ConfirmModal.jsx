import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing }) {
    const { t } = useTranslation('admin');
    
    const actions = (
        <>
            <button type="button" onClick={onClose} className={`${uiStyles.btn} ${uiStyles.btnCancel}`} disabled={isProcessing}>
                {t('confirmModal.cancelBtn', {defaultValue: 'Cancel'})}
            </button>
            <button type="button" onClick={onConfirm} className={`${uiStyles.btn} ${uiStyles.btnDanger}`} disabled={isProcessing}>
                {isProcessing ? t('confirmModal.processing', {defaultValue: '...'}) : t('confirmModal.deleteBtn', {defaultValue: 'Delete'})}
            </button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px" actions={actions}>
            <p className={uiStyles.modalSubtitle}>
                {message}
            </p>
        </BaseModal>
    );
}