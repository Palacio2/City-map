// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) {
  const { t } = useTranslation('db');
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-[9999] backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface p-8 rounded-2xl w-full max-w-[400px] text-center shadow-modal border border-borderClient flex flex-col items-center animate-popIn" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-5 border border-danger/20">
          <FaExclamationTriangle className="text-danger text-3xl" />
        </div>
        <h3 className="text-xl font-heading font-bold text-textMain m-0 mb-3">{title}</h3>
        <p className="text-textSecondary text-base m-0 mb-7 leading-relaxed">{message}</p>
        <div className="flex gap-4 justify-center w-full">
          <button className="flex-1 p-3 rounded-lg border border-borderClient bg-body text-textMain font-heading font-semibold cursor-pointer transition-all text-[0.95rem] hover:bg-hover hover:border-textSecondary" onClick={onClose}>
            {t('stats.actions.cancel')}
          </button>
          <button className="flex-1 p-3 rounded-lg border-none bg-danger text-white font-heading font-semibold cursor-pointer transition-all text-[0.95rem] shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0" onClick={onConfirm}>
            {t('stats.actions.delete')}
          </button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(modalContent, document.body);
}
