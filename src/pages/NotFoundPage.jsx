import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaMapMarkedAlt, FaHome } from 'react-icons/fa';
import SeoMeta from '@components/seo/SeoMeta';

export default function NotFoundPage() {
  const { t } = useTranslation('db');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <SeoMeta 
        title={t('notFound.seo.title')} 
        noIndex={true} 
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] sm:text-[30rem] font-heading font-black text-textMain opacity-[0.02] select-none pointer-events-none -z-10 tracking-tighter leading-none">
        404
      </div>

      <div className="ui-glass-panel relative z-10 p-8 sm:p-12 md:p-16 max-w-lg w-full text-center flex flex-col items-center animate-popIn">
        
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-surface border-2 border-borderClient flex items-center justify-center text-accent shadow-sm group-hover:scale-110 group-hover:border-accent transition-all duration-500">
            <FaMapMarkedAlt className="text-4xl" />
          </div>
        </div>

        <h1 className="ui-heading-1 mb-4 text-transparent bg-clip-text bg-gradient-to-br from-textMain to-textSecondary">
          {t('notFound.title')}
        </h1>
        
        <p className="ui-text-muted mb-10 max-w-sm mx-auto">
          {t('notFound.desc')}
        </p>
        
        <Link 
          to="/" 
          className="ui-button-primary w-full sm:w-auto group overflow-hidden relative"
        >
          <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
          <FaHome className="text-xl group-hover:-translate-y-0.5 transition-transform" />
          <span>{t('notFound.button')}</span>
        </Link>
      </div>
    </div>
  );
}