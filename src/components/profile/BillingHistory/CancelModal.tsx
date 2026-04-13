import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';

interface CancelModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  error?: string | null;
}

export default function CancelModal({ onClose, onConfirm, isProcessing, error }: CancelModalProps) {
  const { t } = useTranslation('db');

  return (
    <div className="fixed inset-0 w-full h-full bg-black/70 backdrop-blur-sm z-[1000] flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-surface p-8 rounded-2xl w-full max-w-[450px] text-center shadow-modal border border-borderClient animate-popIn">
        <div className="text-[2.5rem] text-danger mb-4 bg-danger/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <FaExclamationTriangle />
        </div>
        <h3 className="font-heading text-[1.5rem] mb-3 color-textMain font-bold">{t('billing.cancel_sub')}</h3>
        <p className="text-textSecondary leading-relaxed mb-6">{t('billing.cancel_confirm')}</p>
        
        {error && <p className="text-danger text-[0.9rem] mb-4 bg-danger/10 p-3 rounded-lg border border-danger/20">{error}</p>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <button 
            className="p-3 bg-transparent border border-borderClient text-textMain rounded-lg font-semibold font-heading uppercase text-[0.85rem] transition-all cursor-pointer hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('billing.back_to_profile')}
          </button>
          <button 
            className="p-3 bg-danger border border-danger text-white rounded-lg font-semibold font-heading uppercase text-[0.85rem] transition-all cursor-pointer shadow-sm hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? t('billing.processing') : t('billing.cancel_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}