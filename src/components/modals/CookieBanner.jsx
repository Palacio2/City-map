import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCookieBite, FaTimes } from 'react-icons/fa';

export default function CookieBanner() {
  const { t } = useTranslation('db');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed z-[9999] bottom-0 left-0 w-full md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-[min(900px,calc(100%-40px))] animate-slideUp">
      {/* Адаптивна панель: на мобільному прилипає до низу (rounded-t-2xl), на ПК - таблетка (rounded-full) */}
      <div className="ui-glass-panel flex flex-col md:flex-row gap-5 md:gap-6 items-stretch md:items-center justify-between p-6 md:px-8 border-x-0 border-b-0 border-t md:border border-borderClient md:border-accent/30 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl rounded-t-2xl rounded-b-none md:rounded-full bg-surface/95 dark:bg-[#121212]/95">
        
        <div className="flex items-start md:items-center gap-4 flex-1">
          <div className="w-11 h-11 bg-accent/15 rounded-full flex items-center justify-center border border-accent/20 shrink-0 mt-1 md:mt-0">
            <FaCookieBite className="text-accent text-xl" />
          </div>
          <div className="text-[0.95rem] text-textMain leading-relaxed font-medium">
            {t('rodo.cookies.text')}{' '}
            <Link to="/terms" className="text-accent underline decoration-accent/40 hover:text-accent-hover transition-colors whitespace-nowrap">
              {t('rodo.cookies.link')}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0">
          <button 
            className="flex-1 md:flex-none bg-textMain text-surface font-heading font-bold text-sm md:text-xs uppercase tracking-widest px-8 py-3.5 md:py-3 rounded-xl md:rounded-full hover:bg-accent hover:text-white transition-all md:hover:-translate-y-0.5 shadow-sm"
            onClick={accept}
          >
            {t('rodo.cookies.accept')}
          </button>
          <button 
            className="p-2 text-textSecondary hover:text-textMain hover:rotate-90 transition-all flex items-center justify-center"
            onClick={() => setVisible(false)}
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}