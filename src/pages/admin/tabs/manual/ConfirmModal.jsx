import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing, confirmText, confirmVariant = 'danger' }) {
    const { t } = useTranslation('adminManual');
    
    const actions = (
        <>
            <Button variant="cancel" onClick={onClose} disabled={isProcessing}>
                {t('confirmModal.cancelBtn', {defaultValue: 'Cancel'})}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} disabled={isProcessing}>
                {isProcessing ? t('confirmModal.processing', {defaultValue: 'Processing...'}) : (confirmText || t('confirmModal.deleteBtn', {defaultValue: 'Delete'}))}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px" actions={actions}>
            <div className="flex flex-col items-center gap-4 py-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-[2.5rem] mb-2 border shadow-sm ${confirmVariant === 'danger' ? 'bg-red-500/10 text-danger border-red-500/20' : confirmVariant === 'warning' ? 'bg-amber-500/10 text-[#d97706] border-amber-500/20' : 'bg-blue-500/10 text-primary border-blue-500/20'}`}>
                    {confirmVariant === 'danger' ? '⚠️' : confirmVariant === 'warning' ? '⚡' : 'ℹ️'}
                </div>
                <p className="text-center text-[1.05rem] font-bold text-textMain m-0 leading-relaxed px-4">
                    {message}
                </p>
                {confirmVariant === 'danger' && (
                    <p className="text-center text-[0.85rem] font-semibold text-textMuted m-0 bg-main py-1.5 px-3 rounded-md border border-border">
                        {t('confirmModal.cannotUndo', {defaultValue: 'This action cannot be undone.'})}
                    </p>
                )}
            </div>
        </BaseModal>
    );
}