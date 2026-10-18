import { useNavigate, Link } from 'react-router-dom';
import { FaSun, FaMoon, FaHeart, FaGlobe, FaUser } from 'react-icons/fa';
import { useLanguageDropdown } from './hooks/useLanguageDropdown';
import { type HeaderMobileProps, SUPPORTED_LANGUAGES } from './types';

const HeaderMobile = ({
  theme, toggleTheme, isAuthenticated, user, isPremium, isRealtor, hasConsent, handleAiClick, handleAuthClick, onClose, iconBtnClass
}: HeaderMobileProps) => {
  const { t, showLanguageDropdown, setShowLanguageDropdown, langRef, changeLanguage } = useLanguageDropdown();
  const navigate = useNavigate();

  return (
    <div className="flex lg:hidden flex-col mt-auto p-5 bg-body border-t border-borderClient rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0 z-10 gap-4 relative">
      
      {/* Mobile Icons Row */}
      <div className="flex flex-row items-center justify-around gap-2 bg-surface p-2 rounded-[1.25rem] border border-borderClient shadow-xs">
        <button type="button" className={iconBtnClass} onClick={toggleTheme} title={theme === 'dark' ? t('header.light_mode') : t('header.dark_mode')}>
          {theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
        </button>
        
        {isAuthenticated && isPremium && (
          <button type="button" className={iconBtnClass} onClick={() => { navigate('/favorites'); onClose(); }} title={t('header.favorites_title')}>
            <FaHeart className="text-lg text-danger" />
          </button>
        )}
        
        <div className="relative shrink-0" ref={langRef}>
          <button type="button" className={`${iconBtnClass} ${showLanguageDropdown ? 'border-accent text-accent' : ''}`} onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} title={t('header.language_title')}>
            <FaGlobe className="text-lg" />
          </button>
          {showLanguageDropdown && (
            <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-surface border border-borderClient rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] p-2 flex flex-col min-w-[140px] animate-fadeIn z-[1120]">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button key={lang} type="button" onClick={() => changeLanguage(lang)} className="text-center px-4 py-3 text-[1rem] font-medium bg-transparent border-none text-textMain rounded-lg hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer">
                  {t(`header.lang_${lang}`)}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {isAuthenticated && isRealtor && hasConsent && (
          <button type="button" className={`${iconBtnClass} group`} onClick={() => { handleAiClick(); onClose(); }} title={t('header.ai_assistant')}>
            <span className="font-heading font-extrabold text-[15px] tracking-wide group-hover:text-accent transition-colors">AI</span>
          </button>
        )}
      </div>

      {/* Mobile Account Card (User Info + Action) */}
      {isAuthenticated && user ? (
        <div className="flex flex-col bg-surface border border-borderClient rounded-[1.25rem] overflow-hidden shadow-xs">
          <Link to="/profile" onClick={onClose} className="flex items-center gap-4 p-4 hover:bg-body transition-colors">
            <div className="w-11 h-11 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-[1.1rem] shrink-0">
              {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || <FaUser className="text-[1rem]" />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-textMain font-bold text-[0.95rem] truncate">
                {user?.user_metadata?.full_name || t('header.profile')}
              </span>
              <span className="text-textSecondary font-medium text-[0.8rem] truncate">
                {user?.email}
              </span>
            </div>
          </Link>
          <div className="h-[1px] bg-borderClient w-full" />
          <button
            type="button"
            onClick={handleAuthClick}
            className="flex items-center justify-center w-full p-4 text-danger font-bold text-[0.95rem] uppercase tracking-wider hover:bg-danger/5 transition-colors cursor-pointer border-none bg-transparent outline-hidden"
          >
            {t('header.logout')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full p-4 bg-textMain text-surface rounded-[1.25rem] font-bold text-[0.95rem] uppercase tracking-wider shadow-md active:scale-[0.98] transition-transform cursor-pointer border-none outline-hidden"
          onClick={handleAuthClick}
        >
          {t('header.login')}
        </button>
      )}
    </div>
  );
};

export default HeaderMobile;
