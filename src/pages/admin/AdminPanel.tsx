import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Login from './Login';
import { AdminProvider, useAdmin } from './hooks/AdminContext';
import { ModalProvider } from './ui/ModalContext';
import SeoMeta from '@/seo/SeoMeta';
import './admin.css';
import {
    FaSignOutAlt, FaChartPie, FaMapMarkedAlt, FaCloudDownloadAlt,
    FaEdit, FaComments, FaBrain, FaUsers, FaBullhorn, FaShieldAlt, 
    FaCogs, FaGlobe, FaSearchDollar, FaBars, FaTimes
} from 'react-icons/fa';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

const DashboardTab = React.lazy(() => import('./tabs/dashboard/DashboardTab'));
const ParserTab = React.lazy(() => import('./tabs/parser/ParserTab'));
const ManualTab = React.lazy(() => import('./tabs/manual/ManualTab'));
const MapTab = React.lazy(() => import('./tabs/map/MapTab'));
const FeedbackTab = React.lazy(() => import('./tabs/feedback/FeedbackTab'));
const UsersTab = React.lazy(() => import('./tabs/users/UsersTab'));
const AiLogsTab = React.lazy(() => import('./tabs/aiLogs/AiLogsTab'));
const AuditLogsTab = React.lazy(() => import('./tabs/auditLogs/AuditLogsTab'));
const NotificationsTab = React.lazy(() => import('./tabs/notifications/NotificationsTab'));
const FieldsManagerTab = React.lazy(() => import('./tabs/adminManager/FieldsManager'));
const TranslationsManagerTab = React.lazy(() => import('./tabs/adminManager/TranslationsManager'));
const ScraperManagerTab = React.lazy(() => import('./tabs/adminManager/ScraperManager'));
const CommentsTab = React.lazy(() => import('./tabs/comments/CommentsTab'));

const TabSpinner = () => (
    <div className="flex items-center justify-center py-20 w-full">
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
);

export default function AdminPanel() {
    const [isFullyAuthed, setIsFullyAuthed] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const isAdmin = ['admin', 'super_admin'].includes(session.user.app_metadata?.role);
                if (!isAdmin) {
                    if (isMounted) navigate('/', { replace: true });
                    return;
                }
                const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (aalData?.currentLevel === 'aal2' && isMounted) setIsFullyAuthed(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        checkAuth();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT' && isMounted) setIsFullyAuthed(false);
            else if (['SIGNED_IN', 'MFA_CHALLENGE_VERIFIED'].includes(event)) checkAuth();
        });
        return () => { isMounted = false; subscription.unsubscribe(); };
    }, [navigate]);

    if (loading) return null;
    if (!isFullyAuthed) return <Login />;

    return (
        <QueryClientProvider client={queryClient}>
            <AdminProvider>
                <ModalProvider>
                    <AdminContent />
                </ModalProvider>
            </AdminProvider>
        </QueryClientProvider>
    );
}

function AdminContent() {
    const { t } = useTranslation('db');
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Відновлення активної вкладки з URL або localStorage
    const savedTab = searchParams.get('tab') || localStorage.getItem('admin_active_tab') || 'dashboard';
    const [activeTab, setActiveTab] = useState(savedTab);
    const [visitedTabs, setVisitedTabs] = useState(new Set([savedTab]));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentAdmin, loadingAdmin } = useAdmin();

    const changeTab = (tabId: string) => {
        setActiveTab(tabId);
        setVisitedTabs(prev => new Set(prev).add(tabId));
        setSearchParams({ tab: tabId }, { replace: true });
        localStorage.setItem('admin_active_tab', tabId);
        setSidebarOpen(false);
    };

    const handleLogout = async () => {
        localStorage.removeItem('admin_active_tab');
        await supabase.auth.signOut();
        window.location.reload();
    };

    if (loadingAdmin) return null;

    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const allowedTabs = currentAdmin?.allowed_tabs || [];
    const canSee = (tab: string) => isSuperAdmin || allowedTabs.includes(tab);

    const navSections = [
        {
            title: 'Аналітика',
            items: [
                { id: 'dashboard', label: t('admin_panel.tabs.dashboard'), icon: FaChartPie, show: canSee('dashboard') },
                { id: 'map', label: t('admin_panel.tabs.map'), icon: FaMapMarkedAlt, show: canSee('map') },
            ]
        },
        {
            title: 'Дані та контент',
            items: [
                { id: 'parser', label: t('admin_panel.tabs.parser'), icon: FaCloudDownloadAlt, show: canSee('parser') },
                { id: 'manual', label: t('admin_panel.tabs.manual'), icon: FaEdit, show: canSee('manual') },
                { id: 'scraper', label: t('admin_panel.tabs.scraper'), icon: FaSearchDollar, show: isSuperAdmin && canSee('scraper') },
            ]
        },
        {
            title: 'Користувачі',
            items: [
                { id: 'users', label: t('admin_panel.tabs.users'), icon: FaUsers, show: isSuperAdmin && canSee('users') },
                { id: 'comments', label: 'Коментарі', icon: FaComments, show: canSee('comments') },
                { id: 'feedback', label: t('admin_panel.tabs.feedback'), icon: FaComments, show: canSee('feedback') },
            ]
        },
        {
            title: 'Система',
            items: [
                { id: 'ai', label: t('admin_panel.tabs.ai'), icon: FaBrain, show: canSee('ai') },
                { id: 'fields', label: t('admin_panel.tabs.fields'), icon: FaCogs, show: isSuperAdmin },
                { id: 'translations', label: t('admin_panel.tabs.translations'), icon: FaGlobe, show: isSuperAdmin },
                { id: 'notifications', label: t('admin_panel.tabs.notifications'), icon: FaBullhorn, show: isSuperAdmin },
                { id: 'audit', label: t('admin_panel.tabs.audit'), icon: FaShieldAlt, show: isSuperAdmin },
            ]
        }
    ];

    return (
        <div className="admin-layout flex min-h-[calc(100vh-64px)] bg-main text-textMain overflow-hidden font-sans">
            <SeoMeta title={t('seo.admin.title')} description={t('seo.admin.desc')} />

            
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm tracking-tight text-textMain">CityMaps</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-main border border-border rounded text-textMuted">Admin</span>
                </div>
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-textMuted hover:text-textMain rounded-md hover:bg-hover transition-colors"
                >
                    {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
            </header>

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative top-0 bottom-0 left-0 z-40
                w-64 bg-surface border-r border-border flex flex-col shrink-0
                transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                pt-14 lg:pt-0
            `}>
                <div className="hidden lg:flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-semibold text-sm tracking-tight">CityMaps Console</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-main border border-border rounded text-textMuted">v2.0</span>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
                    {navSections.map((section, idx) => {
                        const visibleItems = section.items.filter(item => item.show);
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className="space-y-1">
                                <div className="px-2 text-[11px] font-medium tracking-wider text-textMuted uppercase">
                                    {section.title}
                                </div>
                                {visibleItems.map(item => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => changeTab(item.id)}
                                            className={`
                                                w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                                                transition-colors duration-150 text-left
                                                ${isActive 
                                                    ? 'bg-primary text-white shadow-subtle' 
                                                    : 'text-textMuted hover:text-textMain hover:bg-hover'}
                                            `}
                                        >
                                            <Icon className={`text-sm ${isActive ? 'text-white' : 'text-textMuted'}`} />
                                            <span className="truncate">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-border bg-surface shrink-0">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-main border border-border mb-2">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-textMain truncate">{currentAdmin?.email}</span>
                            <span className="text-[10px] text-textMuted capitalize">{currentAdmin?.role}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-subtle rounded-lg transition-colors border border-transparent hover:border-danger/20"
                    >
                        <FaSignOutAlt />
                        <span>{t('admin_panel.header.logout')}</span>
                    </button>
                </div>
            </aside>

            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col p-4 md:p-6 lg:p-8 mt-14 lg:mt-0 bg-main w-full">
                <div className="flex-1 flex flex-col w-full">
                    {canSee('dashboard') && (
                        <div className={activeTab === 'dashboard' ? 'block w-full' : 'hidden'}>
                            {visitedTabs.has('dashboard') && <Suspense fallback={<TabSpinner />}><DashboardTab /></Suspense>}
                        </div>
                    )}
                    {canSee('map') && (
                        <div className={activeTab === 'map' ? 'block w-full h-full min-h-[80vh]' : 'hidden'}>
                            {visitedTabs.has('map') && <Suspense fallback={<TabSpinner />}><MapTab /></Suspense>}
                        </div>
                    )}
                    {canSee('parser') && (
                        <div className={activeTab === 'parser' ? 'block w-full' : 'hidden'}>
                            {visitedTabs.has('parser') && <Suspense fallback={<TabSpinner />}><ParserTab /></Suspense>}
                        </div>
                    )}
                    {canSee('manual') && (
                        <div className={activeTab === 'manual' ? 'block w-full' : 'hidden'}>
                            {visitedTabs.has('manual') && <Suspense fallback={<TabSpinner />}><ManualTab /></Suspense>}
                        </div>
                    )}
                    {canSee('comments') && (
                        <div className={activeTab === 'comments' ? 'block w-full' : 'hidden'}>
                            {visitedTabs.has('comments') && <Suspense fallback={<TabSpinner />}><CommentsTab /></Suspense>}
                        </div>
                    )}
                    {canSee('feedback') && (
                        <div className={activeTab === 'feedback' ? 'block w-full' : 'hidden'}>
                            {visitedTabs.has('feedback') && <Suspense fallback={<TabSpinner />}><FeedbackTab /></Suspense>}
                        </div>
                    )}
                    {canSee('ai') && (
                        <div className={activeTab === 'ai' ? 'block w-full' : 'hidden'}>
                            {visitedTabs.has('ai') && <Suspense fallback={<TabSpinner />}><AiLogsTab /></Suspense>}
                        </div>
                    )}
                    {isSuperAdmin && (
                        <>
                            <div className={activeTab === 'fields' ? 'block w-full' : 'hidden'}>
                                {visitedTabs.has('fields') && <Suspense fallback={<TabSpinner />}><FieldsManagerTab /></Suspense>}
                            </div>
                            <div className={activeTab === 'translations' ? 'block w-full' : 'hidden'}>
                                {visitedTabs.has('translations') && <Suspense fallback={<TabSpinner />}><TranslationsManagerTab /></Suspense>}
                            </div>
                            <div className={activeTab === 'scraper' ? 'block w-full' : 'hidden'}>
                                {visitedTabs.has('scraper') && <Suspense fallback={<TabSpinner />}><ScraperManagerTab /></Suspense>}
                            </div>
                            <div className={activeTab === 'users' ? 'block w-full' : 'hidden'}>
                                {visitedTabs.has('users') && <Suspense fallback={<TabSpinner />}><UsersTab /></Suspense>}
                            </div>
                            <div className={activeTab === 'notifications' ? 'block w-full' : 'hidden'}>
                                {visitedTabs.has('notifications') && <Suspense fallback={<TabSpinner />}><NotificationsTab /></Suspense>}
                            </div>
                            <div className={activeTab === 'audit' ? 'block w-full' : 'hidden'}>
                                {visitedTabs.has('audit') && <Suspense fallback={<TabSpinner />}><AuditLogsTab /></Suspense>}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}