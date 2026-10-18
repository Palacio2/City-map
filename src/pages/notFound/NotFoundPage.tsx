import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaMapSigns, FaArrowLeft } from 'react-icons/fa';
import SeoMeta from '@seo/SeoMeta';

export default function NotFoundPage() {
  const { t } = useTranslation('db');

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] text-center px-4 overflow-hidden bg-body">
      <SeoMeta title={t('notFound.seo.title')} description={t('notFound.desc')} />
      
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-body" />
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.15] dark:opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(var(--border-color) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
        }}
      />
      <div className="ambient-glow-1 opacity-50" />
      <div className="ambient-glow-2 opacity-50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-slide-up-fade">
        <div className="relative mb-6">
          <div className="text-[120px] sm:text-[180px] font-black leading-none font-sans tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-accent to-primary opacity-90 select-none">
            404
          </div>
          <div className="absolute -top-2 -right-4 sm:-top-4 sm:-right-8 text-accent animate-bounce">
            <FaMapSigns className="text-[40px] sm:text-[64px]" />
          </div>
        </div>

        <h2 className="font-sans text-3xl md:text-4xl font-bold text-textMain mb-4 max-w-2xl tracking-tight">
          {t('notFound.title')}
        </h2>
        
        <p className="text-textSecondary text-lg md:text-xl mb-10 max-w-md mx-auto font-medium leading-relaxed">
          {t('notFound.desc')}
        </p>
        
        <Link 
          to="/" 
          className="group inline-flex items-center gap-3 px-8 py-4 bg-textMain text-surface rounded-2xl font-sans font-bold uppercase tracking-widest transition-all duration-300 hover:bg-primary hover:-translate-y-1 shadow-lg hover:shadow-primary/25"
        >
          <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
          {t('notFound.button')}
        </Link>
      </div>
    </div>
  );
}