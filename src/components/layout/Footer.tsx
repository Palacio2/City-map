import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('db');
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 text-white/70 pt-20 pb-8 mt-auto overflow-hidden border-t border-white/10">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-[var(--accent-color)]/10 to-transparent pointer-events-none opacity-50" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 mb-16 text-center lg:text-left">
          
          <div className="flex flex-col items-center lg:items-start max-w-sm">
            <Link to="/" className="font-heading text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider flex items-center mb-4 group">
              GeoAnalyzer<span className="text-[var(--accent-color)] text-4xl leading-none ml-1 group-hover:animate-pulse">.</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed font-medium">
              {t('footer.description')}
            </p>
          </div>

          <div className="flex flex-col items-center lg:items-start min-w-[160px]">
            <h4 className="font-heading text-[var(--accent-color)] font-bold uppercase tracking-[0.15em] text-sm mb-6">
              {t('footer.nav_title')}
            </h4>
            <nav className="flex flex-col gap-3 items-center lg:items-start w-full">
              {[
                { to: '/', label: t('footer.home') },
                { to: '/about', label: t('footer.about') },
                { to: '/contacts', label: t('footer.contacts') },
                { to: '/faq', label: t('footer.faq') }
              ].map((link) => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  className="group flex items-center text-sm font-medium transition-colors hover:text-white py-1 relative"
                >
                  <div className="flex items-center justify-center w-0 group-hover:w-6 overflow-hidden transition-all duration-300">
                    <span className="w-4 h-px bg-[var(--accent-color)]" />
                  </div>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col items-center lg:items-start min-w-[200px]">
            <h4 className="font-heading text-[var(--accent-color)] font-bold uppercase tracking-[0.15em] text-sm mb-6">
              {t('footer.contacts_title')}
            </h4>
            <div className="flex flex-col gap-4 items-center lg:items-start w-full">
              <a 
                href={`mailto:${t('footer.email')}`} 
                className="text-sm font-medium hover:text-white transition-colors relative pb-1 group"
              >
                {t('footer.email')}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--accent-color)] transition-all duration-300 group-hover:w-full" />
              </a>
              <a 
                href={`tel:${t('footer.phone_raw')}`} 
                className="text-sm font-medium hover:text-white transition-colors relative pb-1 group"
              >
                {t('footer.phone')}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--accent-color)] transition-all duration-300 group-hover:w-full" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center lg:justify-between gap-4 text-xs font-medium text-white/40 pb-[env(safe-area-inset-bottom)]">
          <p>
            © {year} GeoAnalyzer. {t('footer.rights')}.
          </p>
          <div className="flex gap-4">
            <span className="w-1 h-1 rounded-full bg-white/20 self-center" />
            <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}