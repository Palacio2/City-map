import React, { createContext, useContext, useState, useCallback } from 'react';
import BaseModal from './BaseModal';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const ModalContext = createContext();

export const useModals = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const { t } = useTranslation('db');

    const [confirmState, setConfirmState] = useState({
        isOpen: false, title: '', message: '', onConfirm: null,
        confirmText: '', cancelText: '', confirmVariant: 'danger', isLoading: false
    });

    const [alertState, setAlertState] = useState({
        isOpen: false, title: '', message: '', type: 'info'
    });

    const showConfirm = useCallback((title, message, onConfirm, options = {}) => {
        setConfirmState({
            isOpen: true, title, message, onConfirm,
            // Тепер дефолтні значення беруться з перекладів
            confirmText: options.confirmText || t('common.confirm'),
            cancelText: options.cancelText || t('common.cancel'),
            confirmVariant: options.confirmVariant || 'danger',
            isLoading: false
        });
    }, [t]);

    const showAlert = useCallback((title, message, type = 'info') => {
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
    }, [confirmState.onConfirm, closeConfirm]);

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-danger flex items-center justify-center"><FaExclamationTriangle size={16} /></div>;
            case 'success': return <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-success flex items-center justify-center"><FaCheckCircle size={16} /></div>;
            case 'warning': return <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f97316] flex items-center justify-center"><FaExclamationCircle size={16} /></div>;
            default: return <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-primary flex items-center justify-center"><FaInfoCircle size={16} /></div>;
        }
    };

    return (
        <ModalContext.Provider value={{ showConfirm, showAlert }}>
            {children}

            <BaseModal
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                title={
                    <div className="flex items-center gap-3">
                        {confirmState.confirmVariant === 'danger' 
                            ? <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-danger flex items-center justify-center"><FaExclamationTriangle size={16} /></div>
                            : <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-primary flex items-center justify-center"><FaInfoCircle size={16} /></div>
                        }
                        <span className="text-[1.2rem]">{confirmState.title}</span>
                    </div>
                }
                maxWidth="450px"
                actions={
                    <>
                        <Button variant="cancel" onClick={closeConfirm} disabled={confirmState.isLoading} className="!px-5 !border-transparent">
                            {confirmState.cancelText}
                        </Button>
                        <Button variant={confirmState.confirmVariant} onClick={handleConfirmSubmit} disabled={confirmState.isLoading} className="!px-6 shadow-md">
                            {confirmState.isLoading ? '...' : confirmState.confirmText}
                        </Button>
                    </>
                }
            >
                <div className="p-6 text-[1rem] text-textMuted font-medium leading-relaxed">
                    {confirmState.message}
                </div>
            </BaseModal>

            <BaseModal
                isOpen={alertState.isOpen}
                onClose={closeAlert}
                title={
                    <div className="flex items-center gap-3">
                        {getAlertIcon(alertState.type)}
                        <span className="text-[1.2rem]">{alertState.title}</span>
                    </div>
                }
                maxWidth="400px"
                // Оновлено тут 👇
                actions={<Button variant="primary" onClick={closeAlert} className="!px-8 shadow-md">{t('common.ok')}</Button>}
            >
                <div className="p-6 text-[1rem] text-textMuted font-medium leading-relaxed">
                    {alertState.message}
                </div>
            </BaseModal>
        </ModalContext.Provider>
    );
};