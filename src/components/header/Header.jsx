import { useEffect, useState } from 'react';
import styles from './Header.module.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { 
  FaGlobe, 
  FaHeart, 
  FaBars, 
  FaTimes, 
  FaChevronDown, 
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
  
  const isDarkMode = theme === 'dark';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
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

  useEffect(() => {
    const overflowValue = isMenuOpen ? 'hidden' : '';
    document.documentElement.style.overflow = overflowValue;
    document.body.style.overflow = overflowValue;
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setIsLoading(false);
  };

  const isActive = (path) => location.pathname === path ? styles.navLinkActive : '';
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleLanguageDropdown = () => setShowLanguageDropdown(!showLanguageDropdown);
  
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
    setIsMenuOpen(false);
  };

  const handleAuthClick = () => {
    if (isAuthenticated) handleLogout();
    else navigate('/login');
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
            <button className={`${styles.navButton} ${styles.themeToggle}`} onClick={toggleTheme}>
              {isDarkMode ? <FaSun className={styles.icon} /> : <FaMoon className={styles.icon} />}
              <span className={styles.buttonText}>
                {isDarkMode ? t('header:light_mode') : t('header:dark_mode')}
              </span>
            </button>

            {isAuthenticated && isPremium && (
              <button className={`${styles.navButton} ${styles.favoritesButton}`} onClick={() => navigate('/favorites')}>
                <FaHeart className={styles.icon} />
                <span className={styles.buttonText}>{t('header:favorites_title')}</span>
              </button>
            )}

            <div className={styles.languageContainer}>
              <button className={`${styles.navButton} ${styles.languageButton}`} onClick={toggleLanguageDropdown}>
                <FaGlobe className={styles.icon} />
                <span className={styles.buttonText}>{t('header:language_title')}</span>
                <FaChevronDown className={styles.chevron} />
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