import React, { useEffect, useState } from 'react';
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
    hideHeader?: boolean;
    noPadding?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '480px',
    actions = null,
    bodyStyle = {},
    disableEscClose = false,
    hideHeader = false,
    noPadding = false
}) => {
    const { t } = useTranslation('db');
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsVisible(true));
            });
        } else {
            setIsVisible(false);
            // Зменшено таймер з 150 до 120 для швидшого закриття
            const timer = setTimeout(() => setIsRendered(false), 120);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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

    if (!isRendered) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex p-3 sm:p-6 overflow-y-auto text-textMain items-end sm:items-center justify-center">
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 ease-out ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={!disableEscClose ? onClose : undefined}
                aria-hidden="true"
            />
            <div
                className={`relative bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col w-full border border-border/80 overflow-hidden z-10 my-auto transition-all duration-150 ease-out transform ${
                    isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.98] translate-y-2'
                }`}
                style={{ maxWidth, maxHeight: 'calc(100vh - 40px)' }}
                role="dialog"
                aria-modal="true"
            >
                {!hideHeader && (
                    <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/70 shrink-0 bg-surface">
                        <div className="m-0 text-sm sm:text-base font-bold tracking-tight text-textMain flex items-center gap-2">
                            {title}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-textMuted hover:text-textMain hover:bg-hover rounded-xl transition-colors"
                            aria-label={t('common.close')}
                        >
                            <FaTimes className="text-xs" />
                        </button>
                    </div>
                )}
                <div
                    className={`overflow-y-auto scrollbar-thin bg-surface flex-1 ${!noPadding ? 'p-5 sm:p-6' : ''}`}
                    style={bodyStyle}
                >
                    {children}
                </div>
                {actions && (
                    <div className="px-5 sm:px-6 py-3.5 bg-main/40 border-t border-border/70 flex justify-end gap-2.5 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default BaseModal;