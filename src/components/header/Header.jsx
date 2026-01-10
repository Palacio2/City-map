import { useEffect, useState } from 'react';
import styles from './Header.module.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaGlobe, FaHeart, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isPremium } = useSubscription();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowLanguageDropdown(false);
  }, [location]);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Помилка:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path ? styles.navLinkActive : '';

  const handleAuthClick = () => {
    if (isAuthenticated) handleLogout();
    else navigate('/login');
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/');
  };

  const toggleLanguageDropdown = () => setShowLanguageDropdown(!showLanguageDropdown);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (isLoading) return <div className={styles.header}></div>;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">GeoAnalyzer</Link>
        </div>

        <button className={styles.burgerButton} onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`${styles.navWrapper} ${isMenuOpen ? styles.navOpen : ''}`}>
          <nav className={styles.nav}>
            <Link to="/" className={`${styles.navLink} ${isActive('/')}`}>{t('home')}</Link>
            <Link to="/about" className={`${styles.navLink} ${isActive('/about')}`}>{t('about')}</Link>
            <Link to="/contacts" className={`${styles.navLink} ${isActive('/contacts')}`}>{t('contacts')}</Link>
            <Link to="/subscription" className={`${styles.navLink} ${isActive('/subscription')}`}>{t('subscription')}</Link>
            {isAuthenticated && (
              <Link to="/profile" className={`${styles.navLink} ${isActive('/profile')}`}>{t('profile')}</Link>
            )}
          </nav>

          <div className={styles.userControls}>
            {/* Кнопка Улюблені */}
            {isAuthenticated && isPremium && (
              <button 
                className={`${styles.navButton} ${styles.favoritesButton}`}
                onClick={() => navigate('/favorites')}
                title={t('favorites_title')}
              >
                <FaHeart className={styles.icon} />
                <span className={styles.buttonText}>{t('favorites_title')}</span>
              </button>
            )}

            {/* Блок Мови */}
            <div className={styles.languageContainer}>
              <button 
                className={`${styles.navButton} ${styles.languageButton}`}
                onClick={toggleLanguageDropdown}
                title={t('language_title')}
              >
                <FaGlobe className={styles.icon} />
                <span className={styles.buttonText}>{t('language_title')}</span>
                {/* Стрілочка тільки для мобільного */}
                <FaChevronDown className={styles.chevron} />
              </button>
              
              {showLanguageDropdown && (
                <div className={styles.languageDropdown}>
                  <button onClick={() => changeLanguage('ua')} className={styles.languageOption}>Українська</button>
                  <button onClick={() => changeLanguage('en')} className={styles.languageOption}>English</button>
                  <button onClick={() => changeLanguage('pl')} className={styles.languageOption}>Polski</button>
                </div>
              )}
            </div>

            {/* Вхід / Вихід */}
            <button 
              className={isAuthenticated ? styles.logoutButton : styles.authButton}
              onClick={handleAuthClick}
            >
              {isAuthenticated ? t('logout') : t('login')}
            </button>
          </div>
        </div>

        {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}
      </div>
    </header>
  );
}