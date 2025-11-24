import { useEffect, useState } from 'react';
import styles from './Header.module.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaGlobe, FaHeart } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
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
    console.log('Зміна мови на:', lang);
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
          <div className={styles.authButton}>Завантаження...</div>
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
          Головна
        </Link>
        <Link to="/about" className={`${styles.navLink} ${isActive('/about')}`}>
          Про проект
        </Link>
        <Link to="/contacts" className={`${styles.navLink} ${isActive('/contacts')}`}>
          Контакти
        </Link>
        <Link to="/subscription" className={`${styles.navLink} ${isActive('/subscription')}`}>
          Підписка
        </Link>
        
        {isAuthenticated && (
          <Link to="/profile" className={`${styles.navLink} ${isActive('/profile')}`}>
            Профіль
          </Link>
        )}
      </nav>
      <div className={styles.userControls}>
        {/* Іконка Мої збереження для преміум-користувачів */}
        {isAuthenticated && isPremium && (
          <button 
            className={styles.favoritesButton}
            onClick={handleFavoritesClick}
            title="Мої збереження"
          >
            <FaHeart className={styles.favoritesIcon} />
          </button>
        )}

        {/* Кнопка зміни мови */}
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
    </header>
  );
}