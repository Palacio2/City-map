import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';
import type { CancelModalProps } from '../types';

export const CancelModal = ({ onClose, onConfirm, isProcessing, error }: CancelModalProps) => {
  const { t } = useTranslation('db');

  return (
    <div className="fixed inset-0 w-full h-full bg-black/70 backdrop-blur-xs z-[1000] flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-surface p-8 rounded-2xl w-full max-w-[450px] text-center shadow-modal border border-borderClient animate-popIn">
        <div className="text-[2.5rem] text-danger mb-4 bg-danger/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <FaExclamationTriangle />
        </div>
        
        <h3 className="font-sans text-[1.5rem] mb-3 text-textMain font-bold tracking-tight">
          {t('billing.cancel_sub')}
        </h3>
        <p className="text-textSecondary mb-6 leading-relaxed">
          {t('billing.cancel_confirm')}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger/10 text-danger border border-danger/20 font-medium text-[0.95rem]">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 p-3 bg-black/5 dark:bg-black/20 border border-transparent text-textMain rounded-xl font-bold font-sans text-[0.95rem] transition-all cursor-pointer hover:bg-black/10 dark:hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('billing.back_to_profile')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 p-3 bg-danger text-white rounded-xl font-bold font-sans text-[0.95rem] transition-all cursor-pointer shadow-xs hover:brightness-110 active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('billing.cancel_btn')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};