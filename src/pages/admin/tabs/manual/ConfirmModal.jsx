import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { FaExclamationTriangle, FaInfoCircle, FaBolt } from 'react-icons/fa';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing, confirmText, confirmVariant = 'danger' }) {
    const { t } = useTranslation('db');
    
    const actions = (
        <>
            <Button variant="cancel" onClick={onClose} disabled={isProcessing} className="!border-transparent">
                {t('admin_manual.entity_modal.cancel_btn')}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} disabled={isProcessing} className="shadow-md">
                {isProcessing ? '...' : (confirmText || t('common.confirm'))}
            </Button>
        </>
    );

    const getIcon = () => {
        if (confirmVariant === 'danger') return <FaExclamationTriangle size={24} />;
        if (confirmVariant === 'warning') return <FaBolt size={24} />;
        return <FaInfoCircle size={24} />;
    };

    const getColorClass = () => {
        if (confirmVariant === 'danger') return 'bg-red-500/10 text-danger border-red-500/20';
        if (confirmVariant === 'warning') return 'bg-amber-500/10 text-[#d97706] border-amber-500/20';
        return 'bg-blue-500/10 text-primary border-blue-500/20';
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px" actions={actions}>
            <div className="flex flex-col items-center gap-4 py-6 px-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 border shadow-inner ${getColorClass()}`}>
                    {getIcon()}
                </div>
                <p className="text-center text-[1.05rem] font-bold text-textMain m-0 leading-relaxed">
                    {message}
                </p>
            </div>
        </BaseModal>
    );
}