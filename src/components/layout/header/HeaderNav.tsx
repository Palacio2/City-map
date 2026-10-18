import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHome, FaInfoCircle, FaEnvelope, FaUser, FaShieldAlt, FaCreditCard, FaChevronRight } from 'react-icons/fa';
import { FEATURES_CONFIG } from '../../../config/features';
import type { HeaderNavProps } from './types';

const HeaderNav = ({ isAuthenticated, user, onLinkClick }: HeaderNavProps) => {
  const { t } = useTranslation('db');
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const links = [
    { path: '/', label: t('header.home'), icon: <FaHome /> },
    { path: '/about', label: t('header.about'), icon: <FaInfoCircle /> },
    { path: '/contacts', label: t('header.contacts'), icon: <FaEnvelope /> },
    ...(FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE ? [{ path: '/subscription', label: t('header.subscription'), icon: <FaCreditCard /> }] : []),
    ...(isAuthenticated ? [{ path: '/profile', label: t('header.profile'), icon: <FaUser /> }] : []),
    ...((user?.app_metadata?.role === 'admin' || user?.app_metadata?.role === 'super_admin') 
          ? [{ path: '/admin', label: t('header.admin_panel') || 'Admin Panel', icon: <FaShieldAlt /> }] 
          : [])
  ];

  return (
    <nav className="flex flex-col lg:flex-row w-full lg:w-auto lg:mx-auto lg:items-center px-4 lg:px-0 py-6 lg:py-0 gap-3 lg:gap-8 overflow-y-auto lg:overflow-visible relative z-10 custom-scrollbar">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          onClick={onLinkClick}
          className={`
            flex items-center justify-between w-full lg:w-auto p-4 lg:py-2 lg:px-2 rounded-[1.25rem] lg:rounded-none transition-all group border lg:border-none
            ${isActive(link.path) 
              ? 'bg-accent/10 text-textMain border-accent/20 shadow-xs lg:shadow-none lg:bg-transparent lg:text-textMain' 
              : 'bg-transparent text-textSecondary border-transparent hover:bg-body lg:hover:bg-transparent lg:hover:text-textMain'}
          `}
        >
          <div className="flex items-center gap-3 lg:gap-0 relative pb-0 lg:pb-1 w-max">
            <span className={`lg:hidden text-[1.1rem] ${isActive(link.path) ? 'text-primary' : 'text-textSecondary group-hover:text-primary transition-colors'}`}>
              {link.icon}
            </span>
            <span className="font-heading font-bold uppercase tracking-wider text-[0.95rem] lg:text-sm">{link.label}</span>
            {/* Animated line exactly like in footer */}
            <span className={`hidden lg:block absolute bottom-0 left-0 h-[2px] rounded-full bg-primary transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </div>
          <FaChevronRight className={`lg:hidden text-[0.8rem] transition-colors ${isActive(link.path) ? 'text-primary' : 'text-textSecondary/40 group-hover:text-textMain'}`} />
        </Link>
      ))}
    </nav>
  );
};

export default HeaderNav;
