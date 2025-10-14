import { useEffect, useState } from 'react';
import styles from './Header.module.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaGlobe, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setShowLanguageDropdown(false);
  };

  const changeLanguage = (lang) => {
    console.log('Зміна мови на:', lang);
    setShowLanguageDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setShowLanguageDropdown(false);
  };

  if (isLoading) {
    return (
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Link to="/" onClick={closeAllMenus}>GeoAnalyzer</Link>
          </div>
          <div className={styles.userControls}>
            <div className={styles.authButton}>Завантаження...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <Link to="/" onClick={closeAllMenus}>GeoAnalyzer</Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="Меню"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation */}
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${isActive('/')}`}
            onClick={closeAllMenus}
          >
            Головна
          </Link>
          <Link 
            to="/about" 
            className={`${styles.navLink} ${isActive('/about')}`}
            onClick={closeAllMenus}
          >
            Про проект
          </Link>
          <Link 
            to="/contacts" 
            className={`${styles.navLink} ${isActive('/contacts')}`}
            onClick={closeAllMenus}
          >
            Контакти
          </Link>
          <Link 
            to="/subscription" 
            className={`${styles.navLink} ${isActive('/subscription')}`}
            onClick={closeAllMenus}
          >
            Підписка
          </Link>
          
          {isAuthenticated && (
            <Link 
              to="/profile" 
              className={`${styles.navLink} ${isActive('/profile')}`}
              onClick={closeAllMenus}
            >
              Профіль
            </Link>
          )}

          {/* Mobile auth button */}
          <div className={styles.mobileAuthSection}>
            <button 
              className={isAuthenticated ? styles.logoutButton : styles.authButton}
              onClick={handleAuthClick}
            >
              {isAuthenticated ? 'Вийти' : 'Увійти'}
            </button>
          </div>
        </nav>

        {/* Desktop user controls */}
        <div className={styles.userControls}>
          <div className={styles.languageContainer}>
            <button 
              className={styles.languageButton}
              onClick={toggleLanguageDropdown}
              title="Змінити мову"
            >
              <FaGlobe className={styles.languageIcon} />
            </button>
            
            {showLanguageDropdown && (
              <div className={styles.languageDropdown}>
                <button 
                  className={styles.languageOption}
                  onClick={() => changeLanguage('uk')}
                >
                  Українська
                </button>
                <button 
                  className={styles.languageOption}
                  onClick={() => changeLanguage('en')}
                >
                  English
                </button>
                <button 
                  className={styles.languageOption}
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
            {isAuthenticated ? 'Вийти' : 'Увійти'}
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={closeAllMenus} />
      )}
    </header>
  );
}