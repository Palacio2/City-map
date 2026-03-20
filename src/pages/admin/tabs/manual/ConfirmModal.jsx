import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing }) {
    const { t } = useTranslation('admin');
    
    const actions = (
        <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className={`${uiStyles.btn} ${uiStyles.btnCancel}`} disabled={isProcessing}>
                {t('confirmModal.cancelBtn', {defaultValue: 'Cancel'})}
            </button>
            <button type="button" onClick={onConfirm} className={`${uiStyles.btn} ${uiStyles.btnDanger}`} disabled={isProcessing}>
                {isProcessing ? t('confirmModal.processing', {defaultValue: 'Processing...'}) : t('confirmModal.deleteBtn', {defaultValue: 'Delete'})}
            </button>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px" actions={actions}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                <div style={{ fontSize: '3rem', color: 'var(--danger)', textAlign: 'center', marginBottom: '8px' }}>⚠️</div>
                <p className={uiStyles.modalSubtitle} style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                    {message}
                </p>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    This action cannot be undone.
                </p>
            </div>
        </BaseModal>
    );
}