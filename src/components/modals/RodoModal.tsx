import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaSignOutAlt, FaCheck } from 'react-icons/fa';

export interface RodoModalProps {
  onAccept: () => Promise<void> | void;
  onDecline: () => void;
}

export default function RodoModal({ onAccept, onDecline }: RodoModalProps) {
  const { t } = useTranslation('db');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleAcceptClick = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
    } catch {
      // Помилка обробляється в батьківському компоненті
    } finally {
      setIsProcessing(false);
    }
  };

  const modalHTML = (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn overscroll-contain">
      <div className="ui-glass-panel max-w-[480px] w-full p-6 md:p-10 text-center shadow-2xl rounded-3xl md:rounded-[2.5rem] flex flex-col max-h-[85dvh] md:max-h-[90dvh] overflow-y-auto relative border-borderClient custom-scrollbar">
        
        <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-accent/20 shrink-0">
          <FaShieldAlt className="text-accent text-2xl md:text-3xl" />
        </div>
        
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-textMain mb-3 md:mb-4 leading-tight">
          {t('rodo.welcome')}
        </h2>
        
        <p className="text-textSecondary leading-relaxed mb-6 text-sm md:text-[0.95rem]">
          {t('rodo.description_prefix')}{' '}
          <Link to="/terms" className="text-accent underline decoration-accent/40 hover:text-accent-hover transition-all">
            {t('rodo.terms_link')}
          </Link>.
        </p>

        <div className="bg-surface/50 border border-borderClient p-4 md:p-6 rounded-2xl text-left mb-6 md:mb-8 space-y-3">
          <p className="font-bold text-textMain text-sm uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
            {t('rodo.we_store_title')}
          </p>
          <ul className="space-y-2.5 text-textSecondary text-sm md:text-[0.9rem] pl-4 border-l border-accent/20">
            <li className="flex items-start md:items-center gap-2">
              <FaCheck className="text-accent text-xs mt-1 md:mt-0 shrink-0" /> {t('rodo.store_history')}
            </li>
            <li className="flex items-start md:items-center gap-2">
              <FaCheck className="text-accent text-xs mt-1 md:mt-0 shrink-0" /> {t('rodo.store_favorites')}
            </li>
            <li className="flex items-start md:items-center gap-2">
              <FaCheck className="text-accent text-xs mt-1 md:mt-0 shrink-0" /> {t('rodo.store_stats')}
            </li>
          </ul>
          <p className="text-[11px] md:text-xs text-textSecondary opacity-80 border-t border-borderClient border-dashed pt-3 mt-3">
            {t('rodo.analytics_note')}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-auto">
          <button 
            className="w-full bg-textMain text-surface font-heading font-bold uppercase tracking-widest py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-accent hover:text-white md:hover:-translate-y-0.5 disabled:opacity-50 text-sm md:text-[0.9rem]"
            onClick={handleAcceptClick}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('rodo.processing')}
              </span>
            ) : (
              <><FaCheck /> {t('rodo.accept_btn')}</>
            )}
          </button>
          
          <button 
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-borderClient text-textSecondary text-sm font-medium transition-all hover:border-danger hover:text-danger hover:bg-danger/5"
            onClick={onDecline}
            disabled={isProcessing}
          >
            <FaSignOutAlt /> {t('rodo.decline_btn')}
          </button>
        </div>
        
        <p className="mt-5 md:mt-6 text-[11px] md:text-xs text-textSecondary opacity-60 font-medium">
          {t('rodo.guest_mode_note')}
        </p>
      </div>
    </div>
  );

  return createPortal(modalHTML, document.body);
}