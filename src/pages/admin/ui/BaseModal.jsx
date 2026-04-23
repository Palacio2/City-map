import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('db');

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
        <div className="admin-layout fixed inset-0 z-[var(--z-modal)] flex p-4 sm:p-6 overflow-y-auto text-textMain">            
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-[fadeInModal_0.2s_ease-out]" 
                onClick={!disableEscClose ? onClose : undefined} 
                aria-hidden="true"
            ></div>
            
            <div 
                className="relative bg-surface m-auto rounded-2xl shadow-2xl flex flex-col w-full border border-border animate-[slideUpModal_0.3s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden" 
                style={{ maxWidth, maxHeight: 'calc(100vh - 40px)' }}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 sm:px-6 sm:py-5 border-b border-border shrink-0 bg-main/50 backdrop-blur-sm z-10">
                    <h3 className="m-0 text-[1.2rem] font-extrabold tracking-tight text-textMain flex items-center gap-3">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="bg-surface border border-border text-textMuted cursor-pointer transition-all duration-200 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm hover:text-danger hover:bg-red-500/10 hover:border-red-500/20"
                        aria-label={t('common.close')}
                    >
                        <FaTimes size={12} />
                    </button>
                </div>
                
                <div className="overflow-y-auto scrollbar-thin bg-surface flex-1" style={bodyStyle}>
                    {children}
                </div>

                {actions && (
                    <div className="p-4 sm:px-6 sm:py-4 bg-main/50 border-t border-border flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes fadeInModal {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUpModal {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default BaseModal;