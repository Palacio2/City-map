import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SeoMeta from '@components/seo/SeoMeta';

const UPDATE_DATE = '2025-06-20';

export default function TermsOfService() {
  const { t, i18n } = useTranslation('db');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const sections = useMemo(() => {
    const rawSections = t('terms.sections', { returnObjects: true });
    if (typeof rawSections === 'string') {
      try {
        return JSON.parse(rawSections);
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(rawSections) ? rawSections : [];
  }, [t]);

  const formattedDate = new Date(UPDATE_DATE).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center">
      <SeoMeta
        title={t('terms.seo.title')}
        description={t('terms.seo.desc')}
      />

      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/20 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="text-center max-w-3xl mb-14 animate-slideUp">
        <h1 className="ui-heading-1 mb-6">
          {t('terms.title')}
        </h1>
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-borderClient bg-surface/60 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-bold tracking-widest uppercase text-textSecondary">
            {t('terms.last_updated', { date: formattedDate })}
          </span>
        </div>
      </div>

      <div className="ui-glass-panel w-full max-w-4xl p-8 sm:p-12 md:p-16 relative animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <div className="ui-watermark absolute top-6 right-10 z-0">§</div>

        <div className="relative border-l-2 border-borderClient ml-2 sm:ml-4 space-y-14 pb-4 z-10">
          {sections.map((section, index) => (
            <section key={index} className="relative pl-8 sm:pl-12 group">
              <span className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-surface border-4 border-accent group-hover:scale-125 transition-transform duration-300 shadow-sm" />

              <h2 className="ui-heading-2 group-hover:text-accent transition-colors duration-300">
                {section.title}
              </h2>

              <div className="space-y-5 mt-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="ui-text-body text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-borderClient relative z-10 flex flex-col items-center justify-center text-center gap-6">
          <p className="ui-text-muted text-base">
            {t('terms.footer.return')}{' '}
            <Link to="/register" className="ui-link">{t('terms.footer.register')}</Link>
            {' '}{t('terms.footer.or')}{' '}
            <Link to="/" className="ui-link">{t('terms.footer.home')}</Link>
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-main border border-borderClient text-textSecondary hover:text-accent hover:border-accent hover:-translate-y-1 transition-all shadow-sm"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}