import { useEffect, useState, useCallback } from 'react';
import styles from './Header.module.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { 
  FaGlobe, 
  FaHeart, 
  FaBars, 
  FaTimes, 
  FaSun, 
  FaMoon 
} from 'react-icons/fa';
import { useSubscription } from '@subscription/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['header', 'common']);
  const { isPremium } = useSubscription();
  const { theme, toggleTheme } = useTheme(); 
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuthStatus();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, [checkAuthStatus]);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowLanguageDropdown(false);
  }, [location]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      await supabase.auth.signOut();
      navigate('/');
    } else {
      navigate('/login');
    }
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path ? styles.navLinkActive : '';

  if (isLoading) return null;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">GeoAnalyzer<span>.</span></Link>
        </div>

        <button className={styles.burgerButton} onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`${styles.navWrapper} ${isMenuOpen ? styles.navOpen : ''}`}>
          <nav className={styles.nav}>
            <Link to="/" className={`${styles.navLink} ${isActive('/')}`}>
              {t('header:home')}
            </Link>
            <Link to="/about" className={`${styles.navLink} ${isActive('/about')}`}>
              {t('header:about')}
            </Link>
            <Link to="/contacts" className={`${styles.navLink} ${isActive('/contacts')}`}>
              {t('header:contacts')}
            </Link>
            <Link to="/subscription" className={`${styles.navLink} ${isActive('/subscription')}`}>
              {t('header:subscription')}
            </Link>
            {isAuthenticated && (
              <Link to="/profile" className={`${styles.navLink} ${isActive('/profile')}`}>
                {t('header:profile')}
              </Link>
            )}
          </nav>

          <div className={styles.userControls}>
            <button className={styles.navButton} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <FaSun className={styles.icon} /> : <FaMoon className={styles.icon} />}
              <span className={styles.buttonText}>
                {theme === 'dark' ? t('header:light_mode') : t('header:dark_mode')}
              </span>
            </button>

            {isAuthenticated && isPremium && (
              <button className={styles.navButton} onClick={() => navigate('/favorites')}>
                <FaHeart className={styles.icon} />
                <span className={styles.buttonText}>{t('header:favorites_title')}</span>
              </button>
            )}

            <div className={styles.languageContainer}>
              <button className={styles.navButton} onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}>
                <FaGlobe className={styles.icon} />
                <span className={styles.buttonText}>{t('header:language_title')}</span>
              </button>

              {showLanguageDropdown && (
                <div className={styles.languageDropdown}>
                  <button onClick={() => changeLanguage('uk')} className={styles.languageOption}>Українська</button>
                  <button onClick={() => changeLanguage('en')} className={styles.languageOption}>English</button>
                  <button onClick={() => changeLanguage('pl')} className={styles.languageOption}>Polski</button>
                </div>
              )}
            </div>

            <button className={isAuthenticated ? styles.logoutButton : styles.authButton} onClick={handleAuthClick}>
              {isAuthenticated ? t('header:logout') : t('header:login')}
            </button>
          </div>
        </div>

        {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}
      </div>
    </header>
  );
}