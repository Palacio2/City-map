import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
    FaChartBar, 
    FaMap, 
    FaEdit, 
    FaCogs, 
    FaRobot, 
    FaUsers, 
    FaComments, 
    FaCommentDots, 
    FaDatabase, 
    FaLanguage, 
    FaBullhorn, 
    FaSignOutAlt,
    FaShieldAlt,
    FaBrain,
    FaHistory,
    FaTimes
} from 'react-icons/fa';
import { useAdmin } from '@admin/core/context/AdminContext';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { ADMIN_PERMISSIONS_CONFIG } from '@admin/core/config/adminRoles';
import { AdminSidebarProps } from '@admin/core/types/admin.types';

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    dashboard: FaChartBar,
    map: FaMap,
    manual: FaEdit,
    parser: FaCogs,
    scraper: FaRobot,
    users: FaUsers,
    comments: FaComments,
    feedback: FaCommentDots,
    ai: FaBrain,
    fields: FaDatabase,
    translations: FaLanguage,
    notifications: FaBullhorn,
    audit: FaHistory,
};

export default function AdminSidebar({ 
    activeTab, 
    setActiveTab, 
    onLogout, 
    isMobileOpen = false, 
    setIsMobileOpen 
}: AdminSidebarProps) {
    const { t } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const { canDo, isSuperAdmin } = useActionGuard();

    const email = currentAdmin?.email || 'admin@citymaps.com';
    const roleName = isSuperAdmin ? 'Super Admin' : (currentAdmin?.role || 'Admin');
    const userInitials = email.substring(0, 2).toUpperCase();

    const handleSelectTab = (tabId: string) => {
        setActiveTab(tabId);
        if (setIsMobileOpen) {
            setIsMobileOpen(false);
        }
    };

    return (
        <>
            {/* Мобільний Backdrop */}
            {isMobileOpen && (
                <div 
                    onClick={() => setIsMobileOpen?.(false)}
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-200 animate-fadeIn"
                    aria-hidden="true"
                />
            )}

            <aside 
                className={`
                    w-72 h-full bg-surface border-r border-border flex flex-col justify-between select-none 
                    transition-transform duration-300 ease-in-out shrink-0 overflow-hidden z-50
                    fixed md:static md:relative inset-y-0 left-0
                    ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 shadow-none'}
                `}
            >
                {/* Фоновий просторовий візерунок у бірюзово-ціановому відтінку */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <svg className="w-full h-full stroke-sky-600/15 dark:stroke-sky-400/15 fill-sky-600/20 dark:fill-sky-400/20" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="spatial-matrix-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                                <path d="M 0 24 L 24 0 M 24 48 L 48 24" fill="none" strokeWidth="0.6" strokeDasharray="2 4" />
                                <path d="M 48 0 L 0 48" fill="none" strokeWidth="0.4" strokeOpacity="0.4" />
                                <circle cx="24" cy="24" r="1.25" />
                                <circle cx="0" cy="0" r="1" />
                                <circle cx="48" cy="48" r="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#spatial-matrix-pattern)" />
                    </svg>
                </div>

                {/* М'який смарагдовий градієнт */}
                <div className="absolute -top-16 -left-16 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none z-0" />

                {/* Хедер бренду */}
                <div className="p-5 border-b border-border/70 flex items-center justify-between relative z-10 bg-surface/75 backdrop-blur-md">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-primary/12 text-primary border border-primary/25 flex items-center justify-center text-xl shadow-2xs shrink-0">
                            <FaShieldAlt />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-serif font-bold text-lg text-textMain tracking-tight leading-none truncate">
                                CityMaps
                            </span>
                            <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest mt-1.5">
                                ADMIN CENTER
                            </span>
                        </div>
                    </div>

                    {setIsMobileOpen && (
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="md:hidden p-2 rounded-xl text-textMuted hover:text-textMain hover:bg-hover transition-colors cursor-pointer"
                            aria-label="Close Sidebar"
                        >
                            <FaTimes className="text-sm" />
                        </button>
                    )}
                </div>

                {/* Список навігації */}
                <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin relative z-10">
                    {ADMIN_PERMISSIONS_CONFIG.map((group) => {
                        const visibleTabs = group.permissions.filter((perm) => canDo(perm.id));
                        if (visibleTabs.length === 0) return null;

                        return (
                            <div key={group.titleKey} className="space-y-1.5">
                                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-textMuted/80 font-mono select-none">
                                    {t(group.titleKey)}
                                </div>

                                <div className="space-y-1">
                                    {visibleTabs.map((item) => {
                                        const Icon = TAB_ICONS[item.id] || FaChartBar;
                                        const isActive = activeTab === item.id;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleSelectTab(item.id)}
                                                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative group cursor-pointer text-left ${
                                                    isActive
                                                        ? 'bg-primary/12 text-primary font-bold shadow-2xs border border-primary/20'
                                                        : 'text-textMuted hover:text-textMain hover:bg-hover/80 border border-transparent'
                                                }`}
                                            >
                                                {/* Лівий індикатор активності */}
                                                {isActive && (
                                                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(5,150,105,0.7)]" />
                                                )}

                                                {/* Внутрішній контейнер із GPU-композитингом */}
                                                <div className="flex items-center gap-3 min-w-0 transform-gpu will-change-transform transition-transform duration-150 ease-out group-hover:translate-x-0.5">
                                                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <Icon className={`text-base transition-colors duration-150 ${
                                                            isActive ? 'text-primary' : 'text-textMuted group-hover:text-primary'
                                                        }`} />
                                                    </span>
                                                    <span className="truncate leading-none">{t(item.translationKey)}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Профіль адміністратора з виділеним бейджем ролі */}
                <div className="p-3.5 border-t border-border/70 bg-main/40 relative z-10 backdrop-blur-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface border border-border shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-inner">
                                {userInitials}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-textMain truncate" title={email}>
                                    {email}
                                </span>
                                <div className="mt-1 flex items-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider border shadow-2xs select-none ${
                                        isSuperAdmin 
                                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25' 
                                            : 'bg-primary/10 text-primary border-primary/25'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            isSuperAdmin ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'
                                        }`} />
                                        {roleName.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {onLogout && (
                            <button
                                type="button"
                                onClick={onLogout}
                                title={t('admin_panel.sidebar.logout')}
                                className="p-2 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0 ml-1 cursor-pointer"
                            >
                                <FaSignOutAlt className="text-sm" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}