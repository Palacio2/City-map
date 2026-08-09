import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SeoMeta from '@seo/SeoMeta';

export default function NotFoundPage() {
  const { t } = useTranslation('db');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fadeIn">
      <SeoMeta title={t('notFound.seo.title')} description={t('notFound.desc')} />
      <h1 className="font-heading text-6xl md:text-8xl font-black text-accent mb-4">404</h1>
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-textMain mb-4">
        {t('notFound.title')}
      </h2>
      <p className="text-textSecondary text-lg mb-8 max-w-md">
        {t('notFound.desc')}
      </p>
      <Link to="/" className="inline-flex items-center justify-center px-8 py-4 bg-textMain text-surface rounded-xl font-heading font-bold uppercase tracking-widest transition-all hover:bg-accent hover:-translate-y-1 shadow-md">
        {t('notFound.button')}
      </Link>
    </div>
  );
}