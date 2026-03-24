import React, { createContext, useContext, useState, useCallback } from 'react';
import BaseModal from './BaseModal';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const ModalContext = createContext();

export const useModals = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const { t } = useTranslation('admin');

    // Стан для Confirm Modal
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: '',
        cancelText: '',
        confirmVariant: 'danger', // default 'danger'
        isLoading: false
    });

    // Стан для Alert Modal
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' // info, error, success, warning
    });

    // Оновлена функція виклику Confirm
    // Тепер вона приймає 4-й аргумент options
    const showConfirm = useCallback((title, message, onConfirm, options = {}) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            onConfirm,
            confirmText: options.confirmText || t('common.delete', { defaultValue: 'Видалити' }),
            cancelText: options.cancelText || t('common.cancel', { defaultValue: 'Скасувати' }),
            confirmVariant: options.confirmVariant || 'danger',
            isLoading: false
        });
    }, [t]);

    const showAlert = useCallback((title, message, type = 'info') => {
        setAlertState({ isOpen: true, title, message, type });
    }, []);

    const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));
    const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));

    const handleConfirmSubmit = async () => {
        if (!confirmState.onConfirm) return;
        setConfirmState(prev => ({ ...prev, isLoading: true }));
        try {
            await confirmState.onConfirm();
        } catch (error) {
            console.error(error);
        } finally {
            closeConfirm();
        }
    };

    const getAlertIcon = (type) => {
        switch(type) {
            case 'error': return <FaExclamationTriangle className="text-danger text-[2rem]" />;
            case 'success': return <FaCheckCircle className="text-success text-[2rem]" />;
            case 'warning': return <FaExclamationCircle className="text-warning text-[2rem]" />;
            default: return <FaInfoCircle className="text-primary text-[2rem]" />;
        }
    };

    return (
        <ModalContext.Provider value={{ showConfirm, showAlert }}>
            {children}

            {/* Глобальна модалка підтвердження */}
            <BaseModal
                isOpen={confirmState.isOpen}
                onClose={confirmState.isLoading ? undefined : closeConfirm}
                title={confirmState.title}
                maxWidth="400px"
                disableEscClose={confirmState.isLoading}
                actions={
                    <>
                        <Button 
                            variant="cancel" 
                            onClick={closeConfirm} 
                            disabled={confirmState.isLoading}
                        >
                            {confirmState.cancelText}
                        </Button>
                        <Button 
                            variant={confirmState.confirmVariant} 
                            onClick={handleConfirmSubmit} 
                            disabled={confirmState.isLoading}
                        >
                            {confirmState.isLoading ? '...' : confirmState.confirmText}
                        </Button>
                    </>
                }
            >
                <div className="p-5 text-[0.95rem] text-textMuted font-medium leading-relaxed">
                    {confirmState.message}
                </div>
            </BaseModal>

            {/* Глобальна модалка сповіщень */}
            <BaseModal
                isOpen={alertState.isOpen}
                onClose={closeAlert}
                title={
                    <div className="flex items-center gap-3">
                        {getAlertIcon(alertState.type)}
                        <span>{alertState.title}</span>
                    </div>
                }
                maxWidth="400px"
                actions={
                    <Button variant="primary" onClick={closeAlert}>
                        ОК
                    </Button>
                }
            >
                <div className="p-5 text-[0.95rem] text-textMuted font-medium leading-relaxed">
                    {alertState.message}
                </div>
            </BaseModal>
        </ModalContext.Provider>
    );
};