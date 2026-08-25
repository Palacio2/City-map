/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import BaseModal from '@admin/core/ui/BaseModal';
import { Button } from '@admin/core/ui/Button';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

import { ModalContextType } from '@admin/core/types/ui.types';
export type { ModalContextType };

const ModalContext = createContext<ModalContextType>({
    showConfirm: () => {},
    showAlert: () => {},
});

export const useModals = () => useContext(ModalContext);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation('db');
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean; title: string; message: string; onConfirm: (() => void | Promise<void>) | null;
        confirmText: string; cancelText: string; confirmVariant: 'primary' | 'cancel' | 'danger' | 'success' | 'warning'; isLoading: boolean;
    }>({
        isOpen: false, title: '', message: '', onConfirm: null,
        confirmText: '', cancelText: '', confirmVariant: 'danger', isLoading: false
    });
    const [alertState, setAlertState] = useState<{
        isOpen: boolean; title: string; message: string; type: 'info' | 'error' | 'success' | 'warning';
    }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void | Promise<void>, options: Record<string, unknown> = {}) => {
        setConfirmState({
            isOpen: true, title, message, onConfirm,
            confirmText: (options.confirmText as string) || t('common.confirm'),
            cancelText: (options.cancelText as string) || t('common.cancel'),
            confirmVariant: (options.confirmVariant as 'primary' | 'cancel' | 'danger' | 'success' | 'warning') || 'danger',
            isLoading: false
        });
    }, [t]);

    const showAlert = useCallback((title: string, message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
        setAlertState({ isOpen: true, title, message, type });
    }, []);

    const closeConfirm = useCallback(() => setConfirmState(prev => ({ ...prev, isOpen: false })), []);
    const closeAlert = useCallback(() => setAlertState(prev => ({ ...prev, isOpen: false })), []);

    const handleConfirmSubmit = useCallback(async () => {
        if (!confirmState.onConfirm) return;
        setConfirmState(prev => ({ ...prev, isLoading: true }));
        try {
            await confirmState.onConfirm();
            closeConfirm();
        } catch (error) {
            console.error(error);
            setConfirmState(prev => ({ ...prev, isLoading: false }));
        }
    }, [confirmState, closeConfirm]);

    const getAlertIcon = (type: string, size = "text-sm") => {
        switch (type) {
            case 'error': return <FaExclamationTriangle className={`text-danger ${size}`} />;
            case 'success': return <FaCheckCircle className={`text-success ${size}`} />;
            case 'warning': return <FaExclamationCircle className={`text-warning ${size}`} />;
            default: return <FaInfoCircle className={`text-primary ${size}`} />;
        }
    };
    
    const getAlertBg = (type: string) => {
        switch (type) {
            case 'error': return 'bg-danger-subtle';
            case 'success': return 'bg-success-subtle';
            case 'warning': return 'bg-warning-subtle';
            default: return 'bg-primary-subtle';
        }
    };

    return (
        <ModalContext.Provider value={{ showConfirm, showAlert }}>
            {children}
            <BaseModal
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                title={
                    <div className="flex items-center gap-2">
                        {getAlertIcon(
                            confirmState.confirmVariant === 'danger' ? 'error' : 
                            confirmState.confirmVariant === 'warning' ? 'warning' : 
                            confirmState.confirmVariant === 'success' ? 'success' : 'info'
                        )}
                        <span className="text-sm font-semibold text-textMain">{confirmState.title}</span>
                    </div>
                }
                maxWidth="420px"
                actions={
                    <>
                        <Button variant="cancel" size="sm" onClick={closeConfirm} disabled={confirmState.isLoading}>
                            {confirmState.cancelText}
                        </Button>
                        <Button variant={confirmState.confirmVariant} size="sm" onClick={handleConfirmSubmit} disabled={confirmState.isLoading}>
                            {confirmState.isLoading ? t('common.loading') : confirmState.confirmText}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-textMain leading-relaxed m-0 font-medium">
                        {confirmState.message}
                    </p>
                </div>
            </BaseModal>

            <BaseModal
                isOpen={alertState.isOpen}
                onClose={closeAlert}
                title={
                    <div className="flex items-center gap-2">
                        {getAlertIcon(alertState.type)}
                        <span className="text-sm font-semibold text-textMain">{alertState.title}</span>
                    </div>
                }
                maxWidth="380px"
                actions={
                    <Button variant={alertState.type === 'error' ? 'danger' : 'primary'} size="sm" onClick={closeAlert} className="w-full">
                        {t('common.ok')}
                    </Button>
                }
            >
                <div className="flex flex-col gap-3 text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center border ${getAlertBg(alertState.type)} border-${alertState.type === 'error' ? 'danger' : alertState.type === 'success' ? 'success' : alertState.type === 'warning' ? 'warning' : 'primary'}/20`}>
                        {getAlertIcon(alertState.type, 'text-xl')}
                    </div>
                    <p className="text-sm text-textMain leading-relaxed m-0 font-medium mt-2">
                        {alertState.message}
                    </p>
                </div>
            </BaseModal>
        </ModalContext.Provider>
    );
};