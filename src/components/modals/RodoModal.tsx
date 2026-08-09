import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaSignOutAlt, FaCheck } from 'react-icons/fa';
import { useRodoModal } from './hooks/useRodoModal';
import type { RodoModalProps } from './types';

export default function RodoModal({ onAccept, onDecline }: RodoModalProps) {
  const { t } = useTranslation('db');
  const { isProcessing, handleAccept } = useRodoModal(onAccept);

  const modalContent = (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn overscroll-contain">
      <div className="ui-glass-panel max-w-[480px] w-full p-6 md:p-10 text-center shadow-2xl rounded-3xl md:rounded-[2.5rem] flex flex-col max-h-[85dvh] md:max-h-[90dvh] overflow-y-auto relative border-borderClient custom-scrollbar">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-accent/20">
          <FaShieldAlt className="text-accent text-2xl md:text-3xl" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-textMain mb-3 md:mb-4">
          {t('rodo.title')}
        </h2>
        <p className="text-textSecondary text-sm md:text-base leading-relaxed mb-6 md:mb-8">
          {t('rodo.desc')}
        </p>
        <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8 text-left bg-body/50 p-4 md:p-5 rounded-2xl border border-borderClient/50">
          <div className="flex items-start gap-3">
            <FaCheck className="text-success mt-1 shrink-0" />
            <span className="text-sm text-textSecondary">{t('rodo.storage_history')}</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-success mt-1 shrink-0" />
            <span className="text-sm text-textSecondary">{t('rodo.storage_favorites')}</span>
          </div>
          <div className="flex items-start gap-3">
            <FaCheck className="text-success mt-1 shrink-0" />
            <span className="text-sm text-textSecondary">{t('rodo.storage_stats')}</span>
          </div>
        </div>
        <p className="text-xs text-textSecondary/70 mb-6 md:mb-8">
          {t('rodo.analytics_notice')} <Link to="/terms" className="text-accent hover:underline">{t('rodo.terms_link')}</Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full mt-auto">
          <button
            type="button"
            className="flex-1 py-3.5 md:py-4 px-6 bg-transparent border-2 border-borderClient text-textSecondary rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:border-textMain hover:text-textMain flex items-center justify-center gap-2 cursor-pointer"
            onClick={onDecline}
            disabled={isProcessing}
          >
            <FaSignOutAlt /> {t('rodo.decline')}
          </button>
          <button
            type="button"
            className="flex-1 py-3.5 md:py-4 px-6 bg-accent text-white border-none rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-accent-hover hover:-translate-y-1 shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none cursor-pointer"
            onClick={handleAccept}
            disabled={isProcessing}
          >
            {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('rodo.accept')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}