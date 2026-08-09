import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children?: React.ReactNode;
    maxWidth?: string;
    actions?: React.ReactNode;
    bodyStyle?: React.CSSProperties;
    disableEscClose?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '480px',
    actions = null,
    bodyStyle = {},
    disableEscClose = false
}) => {
    const { t } = useTranslation('db');

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
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
        <div className="fixed inset-0 z-[9999] flex p-4 overflow-y-auto text-textMain items-center justify-center">
            
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
                onClick={!disableEscClose ? onClose : undefined}
                aria-hidden="true"
            />
            
            <div
                className="relative bg-surface rounded-xl shadow-2xl flex flex-col w-full border border-border overflow-hidden z-10 my-auto"
                style={{ maxWidth, maxHeight: 'calc(100vh - 32px)' }}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-main/60">
                    <div className="m-0 text-sm font-semibold tracking-tight text-textMain flex items-center gap-2">
                        {title}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-textMuted hover:text-textMain rounded hover:bg-hover transition-colors"
                        aria-label={t('common.close')}
                    >
                        <FaTimes className="text-xs" />
                    </button>
                </div>
                <div className="overflow-y-auto scrollbar-thin bg-surface flex-1" style={bodyStyle}>
                    {children}
                </div>
                {actions && (
                    <div className="p-3 bg-main/60 border-t border-border flex justify-end gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default BaseModal;