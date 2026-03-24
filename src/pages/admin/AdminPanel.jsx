import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Login from './Login';
import { AdminProvider, useAdmin } from './hooks/AdminContext';
import { ModalProvider } from './ui/ModalContext';
import './admin.css';

import { 
    FaSignOutAlt, FaChartPie, FaMapMarkedAlt, FaCloudDownloadAlt, 
    FaEdit, FaComments, FaBrain, FaUsers, FaBullhorn, FaShieldAlt, FaCogs, FaGlobe, FaSearchDollar 
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
const FieldsManagerTab = React.lazy(() => import('./tabs/adminManeger/FieldsManager')); 
const TranslationsManagerTab = React.lazy(() => import('./tabs/adminManeger/TranslationsManager')); 
const ScraperManagerTab = React.lazy(() => import('./tabs/adminManeger/ScraperManager'));

const TabSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-main/50 backdrop-blur-sm z-50">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
    </div>
);

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-main text-textMain">
                    <div className="text-center bg-surface p-10 rounded-lg shadow-md border border-border">
                        <h2 className="text-2xl font-bold text-danger mb-4">Щось пішло не так</h2>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-white rounded-md font-bold">Оновити сторінку</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

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
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AdminProvider>
                    <ModalProvider>
                        <AdminContent />
                    </ModalProvider>
                </AdminProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

function AdminContent() {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [visitedTabs, setVisitedTabs] = useState(new Set(['dashboard']));
    const { currentAdmin, loadingAdmin } = useAdmin();

    useEffect(() => {
        setVisitedTabs(prev => new Set(prev).add(activeTab));
    }, [activeTab]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    if (loadingAdmin) return null; 
    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const getTabClass = (tabName) => `flex items-center gap-2.5 px-4 lg:px-5 py-2.5 lg:py-3 rounded-md font-semibold text-[0.9rem] lg:text-[0.95rem] transition-all cursor-pointer border-none ${activeTab === tabName ? "bg-textMain text-surface shadow-md" : "text-textMuted bg-transparent hover:bg-hover hover:text-textMain"}`;
    const getIconStyle = (tabName, color) => ({ fontSize: '1.25rem', color: activeTab === tabName ? color : 'currentColor', transform: activeTab === tabName ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.3s' });

    return (
        <div className="admin-layout flex flex-col min-h-[100dvh] bg-main text-textMain transition-colors duration-300 p-4 md:p-6 lg:p-10">
            <header className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-[1.6rem] lg:text-[2.2rem] font-extrabold m-0 text-textMain tracking-[-0.03em]">{t('adminPanel.title')}</h1>
                    <button onClick={handleLogout} className="flex items-center gap-2.5 p-3 md:px-5 md:py-3 bg-red-500/10 text-danger border border-red-500/20 rounded-md font-bold text-[0.95rem] transition-all hover:bg-danger hover:text-white">
                        <FaSignOutAlt /> <span className="hidden md:inline">{t('adminPanel.logout')}</span>
                    </button>
                </div>
                
                <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
                    <div className="inline-flex bg-surface p-1.5 md:p-2 rounded-md lg:rounded-lg shadow-sm gap-1.5 border border-border whitespace-nowrap">
                        <button className={getTabClass('dashboard')} onClick={() => setActiveTab('dashboard')}><FaChartPie style={getIconStyle('dashboard', '#3b82f6')} /> <span>{t('adminPanel.tabDashboard')}</span></button>
                        <button className={getTabClass('map')} onClick={() => setActiveTab('map')}><FaMapMarkedAlt style={getIconStyle('map', '#10b981')} /> <span>{t('adminPanel.tabMap')}</span></button>
                        <button className={getTabClass('parser')} onClick={() => setActiveTab('parser')}><FaCloudDownloadAlt style={getIconStyle('parser', '#8b5cf6')} /> <span>{t('adminPanel.tabParser')}</span></button>
                        <button className={getTabClass('manual')} onClick={() => setActiveTab('manual')}><FaEdit style={getIconStyle('manual', '#f59e0b')} /> <span>{t('adminPanel.tabManual')}</span></button>
                        <button className={getTabClass('feedback')} onClick={() => setActiveTab('feedback')}><FaComments style={getIconStyle('feedback', '#ec4899')} /> <span>{t('adminPanel.tabFeedback')}</span></button>
                        <button className={getTabClass('ai')} onClick={() => setActiveTab('ai')}><FaBrain style={getIconStyle('ai', '#06b6d4')} /> <span>{t('adminPanel.tabAi')}</span></button>
                    
                        {isSuperAdmin && (
                            <>
                                <div className="w-[2px] bg-border my-2 mx-2 rounded-sm"></div>
                                
                                <button className={getTabClass('fields')} onClick={() => setActiveTab('fields')}>
                                    <FaCogs style={getIconStyle('fields', '#14b8a6')} /> 
                                    <span>{t('adminPanel.tabFields', 'Конструктор')}</span>
                                </button>
                                
                                <button className={getTabClass('translations')} onClick={() => setActiveTab('translations')}>
                                    <FaGlobe style={getIconStyle('translations', '#ec4899')} /> 
                                    <span>{t('adminPanel.tabTranslations', 'Переклади')}</span>
                                </button>

                                <button className={getTabClass('scraper')} onClick={() => setActiveTab('scraper')}>
                                    <FaSearchDollar style={getIconStyle('scraper', '#9333ea')} /> 
                                    <span>{t('adminPanel.tabScraper', 'Скрапер')}</span>
                                </button>

                                <button className={getTabClass('users')} onClick={() => setActiveTab('users')}><FaUsers style={getIconStyle('users', '#6366f1')} /> <span>{t('adminPanel.tabUsers')}</span></button>
                                <button className={getTabClass('notifications')} onClick={() => setActiveTab('notifications')}><FaBullhorn style={getIconStyle('notifications', '#f97316')} /> <span>{t('adminPanel.tabNotifications')}</span></button>
                                <button className={getTabClass('audit')} onClick={() => setActiveTab('audit')}><FaShieldAlt style={getIconStyle('audit', '#ef4444')} /> <span>{t('adminPanel.tabAudit')}</span></button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col animate-[fadeIn_0.4s_ease-out] relative">
                <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
                    {visitedTabs.has('dashboard') && <Suspense fallback={<TabSpinner />}><DashboardTab /></Suspense>}
                </div>
                <div style={{ display: activeTab === 'map' ? 'block' : 'none', height: '100%', minHeight: '75vh' }}>
                    {visitedTabs.has('map') && <Suspense fallback={<TabSpinner />}><MapTab /></Suspense>}
                </div>
                <div style={{ display: activeTab === 'parser' ? 'block' : 'none' }}>
                    {visitedTabs.has('parser') && <Suspense fallback={<TabSpinner />}><ParserTab /></Suspense>}
                </div>
                <div style={{ display: activeTab === 'manual' ? 'block' : 'none' }}>
                    {visitedTabs.has('manual') && <Suspense fallback={<TabSpinner />}><ManualTab /></Suspense>}
                </div>
                <div style={{ display: activeTab === 'feedback' ? 'block' : 'none' }}>
                    {visitedTabs.has('feedback') && <Suspense fallback={<TabSpinner />}><FeedbackTab /></Suspense>}
                </div>
                <div style={{ display: activeTab === 'ai' ? 'block' : 'none' }}>
                    {visitedTabs.has('ai') && <Suspense fallback={<TabSpinner />}><AiLogsTab /></Suspense>}
                </div>
                
                {isSuperAdmin && (
                    <>
                        <div style={{ display: activeTab === 'fields' ? 'block' : 'none' }}>
                            {visitedTabs.has('fields') && <Suspense fallback={<TabSpinner />}><FieldsManagerTab /></Suspense>}
                        </div>
                        <div style={{ display: activeTab === 'translations' ? 'block' : 'none' }}>
                            {visitedTabs.has('translations') && <Suspense fallback={<TabSpinner />}><TranslationsManagerTab /></Suspense>}
                        </div>
                        <div style={{ display: activeTab === 'scraper' ? 'block' : 'none' }}>
                            {visitedTabs.has('scraper') && <Suspense fallback={<TabSpinner />}><ScraperManagerTab /></Suspense>}
                        </div>
                        <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
                            {visitedTabs.has('users') && <Suspense fallback={<TabSpinner />}><UsersTab /></Suspense>}
                        </div>
                        <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
                            {visitedTabs.has('notifications') && <Suspense fallback={<TabSpinner />}><NotificationsTab /></Suspense>}
                        </div>
                        <div style={{ display: activeTab === 'audit' ? 'block' : 'none' }}>
                            {visitedTabs.has('audit') && <Suspense fallback={<TabSpinner />}><AuditLogsTab /></Suspense>}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}