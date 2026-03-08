import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import styles from './Header.module.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaGlobe, FaHeart, FaBars, FaTimes, FaSun, FaMoon } from 'react-icons/fa';
import { useSubscription } from '@subscription/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useAuth } from '@ui/authForm/AuthContext';
import Loader from '@components/loader/Loader';
import AiAssistantModal from '../aiAssistant/AiAssistantModal'; 
import AiSidebar from '../aiAssistant/AiSidebar';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useUserConsent } from '@hooks/useUserConsent';
import { supabase } from '@supabaseClient'; // Додано для банера

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('header');
  const { isPremium, isRealtor } = useSubscription();
  const { theme, toggleTheme } = useTheme(); 
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { hasConsent } = useUserConsent();
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  // Стан для глобального банера
  const [banner, setBanner] = useState(null);

  const languageRef = useRef(null);

  useBodyScrollLock(isMenuOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowLanguageDropdown(false);
  }, [location]);

  // Завантаження глобального банера
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data } = await supabase
          .from('global_notifications')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();
        setBanner(data || null);
      } catch {}
    };

    fetchBanner();

    const channel = supabase
      .channel('public:global_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_notifications' }, () => {
        fetchBanner();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAiClick = useCallback(() => {
    const hasPrefs = localStorage.getItem('geo_analyzer_ai_prefs');
    if (hasPrefs) {
      setIsAiSidebarOpen(true);
    } else {
      setIsAiModalOpen(true);
    }
  }, []);

  const openAiSettings = useCallback(() => {
    setIsAiSidebarOpen(false);
    setIsAiModalOpen(true);
  }, []);

  const changeLanguage = useCallback((lang) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
  }, [i18n]);

  const handleAuthClick = useCallback(async () => {
    if (isAuthenticated) {
      await signOut();
      navigate('/');
    } else {
      navigate('/login');
    }
    setIsMenuOpen(false);
  }, [isAuthenticated, signOut, navigate]);

  const isActive = useCallback((path) => {
    return location.pathname === path ? styles.navLinkActive : '';
  }, [location.pathname]);

  if (isLoading) return <div className={styles.headerLoader}><Loader size="small" /></div>;

  // Кольори банера
  const bannerColors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  return (
    <>
      <header className={styles.headerFixedWrapper}>
        {/* ГЛОБАЛЬНИЙ БАНЕР */}
        {banner && (
          <div style={{
            background: bannerColors[banner.type] || bannerColors.info,
            color: 'white',
            padding: '10px 20px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '0.9rem',
            width: '100%',
            zIndex: 1001,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {banner.message}
          </div>
        )}

        {/* ОСНОВНИЙ ХЕДЕР */}
        <div className={styles.header}>
          <div className={styles.container}>
            <div className={styles.logo}>
              <Link to="/">GeoAnalyzer<span>.</span></Link>
            </div>

            <button className={styles.burgerButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>

            <div className={`${styles.navWrapper} ${isMenuOpen ? styles.navOpen : ''}`}>
              <nav className={styles.nav}>
                <Link to="/" className={`${styles.navLink} ${isActive('/')}`}>{t('home')}</Link>
                <Link to="/about" className={`${styles.navLink} ${isActive('/about')}`}>{t('about')}</Link>
                <Link to="/contacts" className={`${styles.navLink} ${isActive('/contacts')}`}>{t('contacts')}</Link>
                <Link to="/subscription" className={`${styles.navLink} ${isActive('/subscription')}`}>{t('subscription')}</Link>
                {isAuthenticated && <Link to="/profile" className={`${styles.navLink} ${isActive('/profile')}`}>{t('profile')}</Link>}
              </nav>

              <div className={styles.userControls}>
                <button 
                  className={styles.navButton} 
                  onClick={toggleTheme}
                  title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
                >
                  {theme === 'dark' ? <FaSun className={styles.icon} /> : <FaMoon className={styles.icon} />}
                  <span className={styles.buttonText}>{theme === 'dark' ? t('light_mode') : t('dark_mode')}</span>
                </button>

                {isAuthenticated && isPremium && (
                  <button 
                    className={styles.navButton} 
                    onClick={() => navigate('/favorites')}
                    title={t('favorites_title')}
                  >
                    <FaHeart className={styles.icon} />
                    <span className={styles.buttonText}>{t('favorites_title')}</span>
                  </button>
                )}

                <div className={styles.languageContainer} ref={languageRef}>
                  <button 
                    className={styles.navButton} 
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    title={t('language_title')}
                  >
                    <FaGlobe className={styles.icon} />
                    <span className={styles.buttonText}>{t('language_title')}</span>
                  </button>
                  {showLanguageDropdown && (
                    <div className={styles.languageDropdown}>
                      <button onClick={() => changeLanguage('uk')} className={styles.languageOption}>{t('lang_uk')}</button>
                      <button onClick={() => changeLanguage('en')} className={styles.languageOption}>{t('lang_en')}</button>
                      <button onClick={() => changeLanguage('pl')} className={styles.languageOption}>{t('lang_pl')}</button>
                    </div>
                  )}
                </div>

                {isAuthenticated && isRealtor && hasConsent && (
                  <button 
                    className={styles.navButton} 
                    onClick={handleAiClick} 
                    title={t('ai_assistant')}
                  >
                    <span className={styles.aiLettersIcon}>AI</span>
                    <span className={styles.buttonText}>{t('ai_assistant')}</span>
                  </button>
                )}

                <button className={isAuthenticated ? styles.logoutButton : styles.authButton} onClick={handleAuthClick}>
                  {isAuthenticated ? t('logout') : t('login')}
                </button>
              </div>
            </div>

            {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}
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