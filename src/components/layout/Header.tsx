import { useEffect, useState, useCallback, memo, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { useAuth } from '@auth/context/AuthContext';
import { useTheme } from './ThemeContext';
import Loader from '@components/loader/Loader';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useUserConsent } from '@hooks/useUserConsent';
import { STORAGE_KEYS } from '@config/constants';
import GlobalBanner from './GlobalBanner';

import HeaderNav from './header/HeaderNav';
import HeaderDesktop from './header/HeaderDesktop';
import HeaderMobile from './header/HeaderMobile';
const AiAssistantModal = lazy(() => import('../aiAssistant/AiAssistantModal'));
const AiSidebar = lazy(() => import('../aiAssistant/AiSidebar'));

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('db');

  const { isPremium, isRealtor } = useSubscription();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, isLoading, signOut } = useAuth();
  const { hasConsent } = useUserConsent();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [hasOpenedAi, setHasOpenedAi] = useState(false);

  useBodyScrollLock(isMenuOpen);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleAiClick = useCallback(() => {
    setHasOpenedAi(true);
    const hasPrefs = localStorage.getItem(STORAGE_KEYS.AI_PREFS);
    if (hasPrefs) setIsAiSidebarOpen(true);
    else setIsAiModalOpen(true);
  }, []);

  const openAiSettings = useCallback(() => {
    setIsAiSidebarOpen(false);
    setIsAiModalOpen(true);
  }, []);

  const handleAuthClick = useCallback(async () => {
    if (isAuthenticated) {
      await signOut();
      navigate('/');
    } else {
      navigate('/login');
    }
    setIsMenuOpen(false);
  }, [isAuthenticated, signOut, navigate]);

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 w-full h-[var(--header-height)] flex items-center justify-center bg-surface z-[1000]">
        <Loader size="small" />
      </div>
    );
  }

  const iconBtnClass = "flex items-center justify-center w-12 h-12 lg:w-10 lg:h-10 rounded-xl lg:rounded-full bg-surface lg:bg-transparent border border-borderClient shadow-[0_2px_10px_rgba(0,0,0,0.02)] lg:shadow-none text-textMain hover:border-accent hover:text-accent lg:hover:bg-accent/10 transition-all cursor-pointer outline-hidden shrink-0";

  return (
    <>
      <header className="sticky top-0 left-0 w-full z-[1000] flex flex-col pt-[env(safe-area-inset-top)] border-b border-borderClient transition-colors duration-300 bg-surface">
        <GlobalBanner />
        <div className="w-full h-[var(--header-height,70px)]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="shrink-0 z-[1060]">
              <Link to="/" className="font-heading text-xl sm:text-2xl font-bold text-textMain uppercase tracking-wider flex items-center group relative">
                KVARTAL<span className="text-accent text-3xl leading-none ml-0.5 group-hover:animate-pulse">.</span>
              </Link>
            </div>

            {/* MOBILE ONLY: Burger Button */}
            <div className="flex items-center gap-2 lg:hidden z-[1030]">
              <button
                type="button"
                className="text-2xl text-textMain p-2 hover:text-accent transition-colors bg-transparent border-none cursor-pointer outline-hidden"
                onClick={() => setIsMenuOpen(true)}
                aria-label={t('header.toggle_menu')}
              >
                <FaBars />
              </button>
            </div>

            {/* MOBILE OVERLAY */}
            <button
              type="button"
              className={`fixed inset-0 w-full h-[100dvh] border-none appearance-none cursor-default bg-black/60 backdrop-blur-xs z-[1090] lg:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
              onClick={() => setIsMenuOpen(false)}
              aria-label={t('header.close_menu')}
              tabIndex={-1}
            />

            {/* MAIN SIDEBAR/NAV CONTAINER */}
            <div className={`
              fixed lg:static top-0 right-0 h-[100dvh] lg:h-auto w-[320px] sm:w-[380px] lg:w-auto bg-surface lg:bg-transparent
              border-l border-borderClient lg:border-none shadow-2xl lg:shadow-none z-[1100] lg:z-auto
              flex flex-col lg:flex-row flex-1 transition-transform duration-300 ease-out overflow-hidden lg:overflow-visible
              ${isMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>

              {/* MOBILE SIDEBAR HEADER */}
              <div className="flex lg:hidden items-center justify-between px-6 h-[70px] border-b border-borderClient relative z-10 shrink-0 bg-surface">
                <span className="font-heading text-xl font-bold text-textMain uppercase tracking-wider">
                  KVARTAL<span className="text-accent">.</span>
                </span>
                <button
                  type="button"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-body border border-borderClient text-textSecondary hover:text-textMain hover:bg-borderClient transition-colors cursor-pointer outline-hidden"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <HeaderNav
                isAuthenticated={isAuthenticated}
                user={user}
                onLinkClick={() => setIsMenuOpen(false)}
              />

              <HeaderDesktop
                theme={theme}
                toggleTheme={toggleTheme}
                isAuthenticated={isAuthenticated}
                isPremium={isPremium}
                isRealtor={isRealtor}
                hasConsent={hasConsent}
                handleAiClick={handleAiClick}
                handleAuthClick={handleAuthClick}
                iconBtnClass={iconBtnClass}
              />

              <HeaderMobile
                theme={theme}
                toggleTheme={toggleTheme}
                isAuthenticated={isAuthenticated}
                user={user}
                isPremium={isPremium}
                isRealtor={isRealtor}
                hasConsent={hasConsent}
                handleAiClick={handleAiClick}
                handleAuthClick={handleAuthClick}
                onClose={() => setIsMenuOpen(false)}
                iconBtnClass={iconBtnClass}
              />

            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
      {isAiModalOpen && <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={() => setIsAiSidebarOpen(true)}
      />}
      {hasOpenedAi && isAuthenticated && isRealtor && hasConsent && <AiSidebar
        key={user?.id}
        isOpen={isAiSidebarOpen}
        onClose={() => setIsAiSidebarOpen(false)}
        onOpenSettings={openAiSettings}
      />}
      </Suspense>
    </>
  );
};

export default memo(Header);
