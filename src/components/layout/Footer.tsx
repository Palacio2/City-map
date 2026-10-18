import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('db');
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 text-white/70 pt-10 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 mt-auto overflow-hidden border-t border-white/10 font-sans">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none opacity-50" />

      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-12 mb-10 sm:mb-16 text-left">
          
          <div className="flex flex-col items-start col-span-2 lg:col-span-2 lg:max-w-md">
            <Link to="/" className="font-sans text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center mb-3 sm:mb-4 group">
              KVARTAL<span className="text-primary text-4xl leading-none ml-0.5 group-hover:animate-pulse">.</span>
            </Link>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed font-medium pr-4 sm:pr-0">
              {t('footer.description')}
            </p>
          </div>

          <div className="flex flex-col items-start col-span-1">
            <h4 className="font-sans text-primary font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-4 sm:mb-5 opacity-80">
              {t('footer.nav_title')}
            </h4>
            <nav className="flex flex-col gap-3 sm:gap-3.5 w-full">
              {[
                { to: '/', label: t('footer.home') },
                { to: '/about', label: t('footer.about') },
                { to: '/contacts', label: t('footer.contacts') },
                { to: '/faq', label: t('footer.faq') }
              ].map((link) => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  className="group flex items-center text-sm sm:text-base font-medium text-white/70 transition-colors hover:text-white py-0.5 relative w-max"
                >
                  <div className="flex items-center justify-center w-0 group-hover:w-3 sm:group-hover:w-4 overflow-hidden transition-all duration-300">
                    <span className="w-2 sm:w-3 h-[2px] bg-primary rounded-full" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col items-start col-span-1">
            <h4 className="font-sans text-primary font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-4 sm:mb-5 opacity-80">
              {t('footer.contacts_title')}
            </h4>
            <div className="flex flex-col gap-3 sm:gap-4 w-full">
              <a 
                href={`mailto:${t('footer.email')}`} 
                className="text-sm sm:text-base font-medium text-white/70 hover:text-white transition-colors relative pb-0.5 sm:pb-1 group w-max"
              >
                {t('footer.email')}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] rounded-full bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
              <a 
                href={`tel:${t('footer.phone_raw')}`} 
                className="text-sm sm:text-base font-medium text-white/70 hover:text-white transition-colors relative pb-0.5 sm:pb-1 group w-max whitespace-nowrap"
              >
                {t('footer.phone')}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] rounded-full bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-0 text-xs sm:text-sm font-medium text-white/40 pb-[env(safe-area-inset-bottom)]">
          <p className="text-center sm:text-left">
            © {year} Kvartal. {t('footer.rights')}.
          </p>
          <div className="flex items-center gap-4">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}