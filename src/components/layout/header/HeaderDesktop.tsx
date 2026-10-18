import { useNavigate } from 'react-router-dom';
import { FaSun, FaMoon, FaHeart, FaGlobe } from 'react-icons/fa';
import { useLanguageDropdown } from './hooks/useLanguageDropdown';
import { type HeaderDesktopProps, SUPPORTED_LANGUAGES } from './types';

const HeaderDesktop = ({
  theme, toggleTheme, isAuthenticated, isPremium, isRealtor, hasConsent, handleAiClick, handleAuthClick, iconBtnClass
}: HeaderDesktopProps) => {
  const { t, showLanguageDropdown, setShowLanguageDropdown, langRef, changeLanguage } = useLanguageDropdown();
  const navigate = useNavigate();

  return (
    <div className="hidden lg:flex flex-row items-center gap-3 w-auto pl-8 border-l border-borderClient">
      <button type="button" className={iconBtnClass} onClick={toggleTheme} title={theme === 'dark' ? t('header.light_mode') : t('header.dark_mode')}>
        {theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
      </button>
      
      {isAuthenticated && isPremium && (
        <button type="button" className={iconBtnClass} onClick={() => { navigate('/favorites'); }} title={t('header.favorites_title')}>
          <FaHeart className="text-lg hover:text-danger" />
        </button>
      )}
      
      <div className="relative shrink-0" ref={langRef}>
        <button type="button" className={`${iconBtnClass} ${showLanguageDropdown ? 'border-accent text-accent' : ''}`} onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} title={t('header.language_title')}>
          <FaGlobe className="text-lg" />
        </button>
        {showLanguageDropdown && (
          <div className="absolute top-[calc(100%+8px)] right-0 bg-surface border border-borderClient rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-2 flex flex-col min-w-[160px] animate-fadeIn z-[1060]">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button key={lang} type="button" onClick={() => changeLanguage(lang)} className="text-left px-4 py-2.5 text-sm font-medium bg-transparent border-none text-textMain rounded-lg hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer">
                {t(`header.lang_${lang}`)}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {isAuthenticated && isRealtor && hasConsent && (
        <button type="button" className={`${iconBtnClass} group`} onClick={handleAiClick} title={t('header.ai_assistant')}>
          <span className="font-heading font-extrabold text-[13px] tracking-wide group-hover:text-accent transition-colors">AI</span>
        </button>
      )}
      
      <button type="button" onClick={handleAuthClick} className={`px-6 h-10 rounded-xl font-heading font-bold text-sm uppercase tracking-wider transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${isAuthenticated ? 'bg-danger/10 border-2 border-solid border-danger text-danger hover:bg-danger hover:text-white' : 'bg-textMain border-2 border-solid border-transparent text-surface hover:bg-accent hover:border-accent hover:text-white'}`}>
        {isAuthenticated ? t('header.logout') : t('header.login')}
      </button>
    </div>
  );
};

export default HeaderDesktop;
