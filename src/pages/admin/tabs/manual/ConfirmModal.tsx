import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { FaExclamationTriangle, FaInfoCircle, FaBolt } from 'react-icons/fa';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isProcessing, confirmText, confirmVariant = 'danger' }: any) {
    const { t } = useTranslation('db');

    const actions = (
        <>
            <Button variant="cancel" size="sm" onClick={onClose} disabled={isProcessing}>
                {t('admin_manual.entity_modal.cancel_btn')}
            </Button>
            <Button variant={confirmVariant} size="sm" onClick={onConfirm} disabled={isProcessing}>
                {isProcessing ? '...' : (confirmText || t('common.confirm'))}
            </Button>
        </>
    );

    const getIcon = () => {
        if (confirmVariant === 'danger') return <FaExclamationTriangle className="text-danger text-base" />;
        if (confirmVariant === 'warning') return <FaBolt className="text-warning text-base" />;
        return <FaInfoCircle className="text-primary text-base" />;
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="380px" actions={actions}>
            <div className="flex flex-col items-center text-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-main border border-border flex items-center justify-center">
                    {getIcon()}
                </div>
                <p className="text-xs text-textMain m-0 leading-relaxed font-normal">
                    {message}
                </p>
            </div>
        </BaseModal>
    );
}