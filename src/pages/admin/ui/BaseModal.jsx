import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

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
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-[fadeInModal_0.2s_ease-out] z-[var(--z-modal-backdrop)]" 
                onClick={disableEscClose ? undefined : onClose}
            ></div>

            <div 
                className="relative w-full m-auto bg-surface flex flex-col rounded-xl shadow-2xl border border-border animate-[slideUpModal_0.3s_cubic-bezier(0.16,1,0.3,1)] max-h-[90vh] shrink-0 z-[var(--z-modal)]" 
                style={{ maxWidth }} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 sm:px-6 sm:py-5 border-b border-border bg-main/50 shrink-0">
                    <h3 className="m-0 text-[1.15rem] text-textMain font-extrabold flex items-center gap-3 tracking-tight">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="bg-surface border border-border text-textMuted cursor-pointer transition-all duration-200 w-8 h-8 rounded-md flex items-center justify-center shadow-sm hover:text-danger hover:bg-red-500/10 hover:border-red-500/20"
                        aria-label="Close"
                    >
                        <FaTimes size={14} />
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
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default BaseModal;