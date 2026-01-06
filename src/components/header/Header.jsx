import { useEffect, useState } from 'react';
import styles from './Header.module.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaGlobe, FaHeart } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  const { t, i18n } = useTranslation(); 

  const { isPremium } = useSubscription();

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

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Помилка перевірки аутентифікації:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? styles.navLinkActive : '';
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      handleLogout();
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Помилка виходу:', error);
    }
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const handleFavoritesClick = () => {
    navigate('/favorites');
  };

  if (isLoading) {
    return (
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link to="/">GeoAnalyzer</Link>
        </div>
        <div className={styles.userControls}>
          <div className={styles.authButton}>{t('loading')}</div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">GeoAnalyzer</Link>
      </div>
      <nav className={styles.nav}>
        <Link to="/" className={`${styles.navLink} ${isActive('/')}`}>
          {t('home')}
        </Link>
        <Link to="/about" className={`${styles.navLink} ${isActive('/about')}`}>
          {t('about')}
        </Link>
        <Link to="/contacts" className={`${styles.navLink} ${isActive('/contacts')}`}>
          {t('contacts')}
        </Link>
        <Link to="/subscription" className={`${styles.navLink} ${isActive('/subscription')}`}>
          {t('subscription')}
        </Link>
        
        {isAuthenticated && (
          <Link to="/profile" className={`${styles.navLink} ${isActive('/profile')}`}>
            {t('profile')}
          </Link>
        )}
      </nav>
      <div className={styles.userControls}>
        {isAuthenticated && isPremium && (
          <button 
            className={styles.favoritesButton}
            onClick={handleFavoritesClick}
            title={t('favorites_title')}
          >
            <FaHeart className={styles.favoritesIcon} />
          </button>
        )}

        <div className={styles.languageContainer}>
          <button 
            className={styles.languageButton}
            onClick={toggleLanguageDropdown}
            title={t('language_title')}
          >
            <FaGlobe className={styles.languageIcon} />
          </button>
          
          {showLanguageDropdown && (
            <div className={styles.languageDropdown}>
              <button 
                className={`${styles.languageOption} ${i18n.language === 'ua' ? styles.activeLang : ''}`}
                onClick={() => changeLanguage('ua')}
              >
                Українська
              </button>
              <button 
                className={`${styles.languageOption} ${i18n.language === 'en' ? styles.activeLang : ''}`}
                onClick={() => changeLanguage('en')}
              >
                English
              </button>
              <button 
                className={`${styles.languageOption} ${i18n.language === 'pl' ? styles.activeLang : ''}`}
                onClick={() => changeLanguage('pl')}
              >
                Polski
              </button>
            </div>
          )}
        </div>

        <button 
          className={isAuthenticated ? styles.logoutButton : styles.authButton}
          onClick={handleAuthClick}
          disabled={isLoading}
        >
          {isAuthenticated ? t('logout') : t('login')}
        </button>
      </div>
    </header>
  );
}