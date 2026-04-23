import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaGlobe, FaHeart, FaBars, FaTimes, FaSun, FaMoon } from 'react-icons/fa';
import { useSubscription } from '@subscription/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useAuth } from '@/components/auth/AuthContext';
import Loader from '@components/loader/Loader';
import AiAssistantModal from '../aiAssistant/AiAssistantModal'; 
import AiSidebar from '../aiAssistant/AiSidebar';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useUserConsent } from '@hooks/useUserConsent';
import GlobalBanner from './GlobalBanner'; 

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('db');
  const { isPremium, isRealtor } = useSubscription();
  
  const { theme, toggleTheme } = useTheme() as any; 
  const { isAuthenticated, isLoading, signOut } = useAuth() as any; 
  
  const { hasConsent } = useUserConsent();
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  const languageRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(isMenuOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };
    if (showLanguageDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageDropdown]);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowLanguageDropdown(false);
  }, [location]);

  const handleAiClick = useCallback(() => {
    const hasPrefs = localStorage.getItem('geo_analyzer_ai_prefs');
    if (hasPrefs) setIsAiSidebarOpen(true);
    else setIsAiModalOpen(true);
  }, []);

  const openAiSettings = useCallback(() => {
    setIsAiSidebarOpen(false);
    setIsAiModalOpen(true);
  }, []);

  const changeLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
  }, [i18n]);

  const handleAuthClick = useCallback(async () => {
    if (isAuthenticated) {
      if (typeof signOut === 'function') {
        await signOut();
      }
      navigate('/');
    } else {
      navigate('/login');
    }
    setIsMenuOpen(false);
  }, [isAuthenticated, signOut, navigate]);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 w-full h-[var(--header-height)] flex items-center justify-center bg-[var(--bg-surface)]/80 backdrop-blur-md z-50">
        <Loader size="small" />
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 left-0 w-full z-[1000] flex flex-col pt-[env(safe-area-inset-top)] shadow-sm bg-[var(--bg-surface)]/85 backdrop-blur-xl border-b border-[var(--border-color)] transition-colors duration-300">
        <GlobalBanner />

        <div className="w-full h-[var(--header-height,70px)]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            
            <div className="shrink-0 z-[1060]">
              <Link to="/" className="font-heading text-xl sm:text-2xl font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center group">
                GeoAnalyzer<span className="text-[var(--accent-color)] text-3xl leading-none ml-0.5 group-hover:animate-pulse">.</span>
              </Link>
            </div>

            <button 
              className="lg:hidden text-2xl text-[var(--text-main)] p-2 z-[1060] hover:text-[var(--accent-color)] transition-colors bg-transparent border-none cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={t('header.toggle_menu')}
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>

            <button 
              type="button"
              className={`fixed inset-0 w-full h-full border-none appearance-none cursor-default bg-black/60 backdrop-blur-sm z-[1040] lg:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
              onClick={() => setIsMenuOpen(false)}
              aria-label={t('header.close_menu')}
              tabIndex={-1}
            />

            <div className={`
              fixed lg:static top-0 right-0 h-[100dvh] lg:h-auto w-[300px] lg:w-auto bg-[var(--bg-surface)] lg:bg-transparent 
              border-l border-[var(--border-color)] lg:border-none shadow-2xl lg:shadow-none z-[1050] lg:z-auto
              flex flex-col lg:flex-row items-start lg:items-center justify-start lg:justify-between flex-1 gap-8 lg:gap-10
              pt-28 pb-8 px-6 lg:p-0 transition-transform duration-300 ease-out
              ${isMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
              
              <nav className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full lg:w-auto lg:mx-auto">
                {[
                  { path: '/', label: t('header.home') },
                  { path: '/about', label: t('header.about') },
                  { path: '/contacts', label: t('header.contacts') },
                  { path: '/subscription', label: t('header.subscription') },
                  ...(isAuthenticated ? [{ path: '/profile', label: t('header.profile') }] : [])
                ].map((link) => (
                  <Link 
                    key={link.path}
                    to={link.path} 
                    className={`relative py-3 lg:py-2 text-[1.1rem] lg:text-sm font-semibold uppercase tracking-wider transition-colors group border-b border-[var(--border-color)] lg:border-none w-full lg:w-auto
                      ${isActive(link.path) ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}
                    `}
                  >
                    {link.label}
                    <span className={`hidden lg:block absolute -bottom-1 left-0 h-[2px] bg-[var(--accent-color)] transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-3 w-full lg:w-auto lg:pl-8 lg:border-l border-[var(--border-color)] mt-auto lg:mt-0">
                
                <button 
                  className="flex items-center gap-3 lg:gap-0 lg:justify-center w-full lg:w-10 h-12 lg:h-10 rounded-xl lg:rounded-full border border-[var(--border-color)] bg-transparent text-[var(--text-main)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-all px-4 lg:px-0 cursor-pointer"
                  onClick={() => { if(typeof toggleTheme === 'function') toggleTheme(); }}
                  title={theme === 'dark' ? t('header.light_mode') : t('header.dark_mode')}
                >
                  {theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
                  <span className="lg:hidden font-medium">{theme === 'dark' ? t('header.light_mode') : t('header.dark_mode')}</span>
                </button>

                {isAuthenticated && isPremium && (
                  <button 
                    className="flex items-center gap-3 lg:gap-0 lg:justify-center w-full lg:w-10 h-12 lg:h-10 rounded-xl lg:rounded-full border border-[var(--border-color)] bg-transparent text-[var(--text-main)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-all px-4 lg:px-0 cursor-pointer"
                    onClick={() => navigate('/favorites')}
                    title={t('header.favorites_title')}
                  >
                    <FaHeart className="text-lg" />
                    <span className="lg:hidden font-medium">{t('header.favorites_title')}</span>
                  </button>
                )}

                <div className="relative w-full lg:w-auto" ref={languageRef}>
                  <button 
                    className="flex items-center gap-3 lg:gap-0 lg:justify-center w-full lg:w-10 h-12 lg:h-10 rounded-xl lg:rounded-full border border-[var(--border-color)] bg-transparent text-[var(--text-main)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-all px-4 lg:px-0 cursor-pointer"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    title={t('header.language_title')}
                  >
                    <FaGlobe className="text-lg" />
                    <span className="lg:hidden font-medium">{t('header.language_title')}</span>
                  </button>
                  
                  {showLanguageDropdown && (
                    <div className="lg:absolute mt-2 lg:mt-0 top-[calc(100%+8px)] right-0 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-glass p-2 flex flex-col min-w-[160px] animate-fadeIn z-[1060]">
                      {['uk', 'en', 'pl'].map(lang => (
                        <button 
                          key={lang}
                          onClick={() => changeLanguage(lang)} 
                          className="text-left px-4 py-2.5 text-sm font-medium bg-transparent border-none text-[var(--text-main)] rounded-lg hover:bg-[var(--accent-color)]/10 hover:text-[var(--accent-color)] transition-colors cursor-pointer"
                        >
                          {t(`header.lang_${lang}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isAuthenticated && isRealtor && hasConsent && (
                  <button 
                    className="flex items-center gap-3 lg:gap-0 lg:justify-center w-full lg:w-10 h-12 lg:h-10 rounded-xl lg:rounded-full border border-[var(--border-color)] bg-transparent text-[var(--text-main)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-all px-4 lg:px-0 group cursor-pointer"
                    onClick={handleAiClick} 
                    title={t('header.ai_assistant')}
                  >
                    <span className="font-heading font-extrabold text-[15px] tracking-wide group-hover:text-[var(--accent-color)] transition-colors">AI</span>
                    <span className="lg:hidden font-medium">{t('header.ai_assistant')}</span>
                  </button>
                )}

                <button 
                  className={`w-full lg:w-auto mt-4 lg:mt-0 px-6 h-12 lg:h-10 rounded-xl font-heading font-bold text-sm uppercase tracking-wider transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer
                    ${isAuthenticated 
                      ? 'bg-transparent border-2 border-solid border-red-500 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'bg-[var(--text-main)] border-2 border-solid border-transparent text-[var(--bg-surface)] hover:bg-[var(--accent-color)] hover:border-[var(--accent-color)] hover:text-white'
                    }
                  `}
                  onClick={handleAuthClick}
                >
                  {isAuthenticated ? t('header.logout') : t('header.login')}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      <AiAssistantModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onSuccess={() => setIsAiSidebarOpen(true)}
      />

      <AiSidebar 
        isOpen={isAiSidebarOpen} 
        onClose={() => setIsAiSidebarOpen(false)}
        onOpenSettings={openAiSettings}
      />
    </>
  );
};

export default memo(Header);