import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin, AdminProvider } from '@admin/core/context/AdminContext';
import { ModalProvider } from '@admin/core/context/ModalContext';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { useDBTranslations } from '@admin/core/hooks/useDBTranslations';
import AdminSidebar from '@admin/AdminSidebar';
import LoginTab from '@admin/features/login/LoginTab';
import { FaBars, FaExclamationTriangle } from 'react-icons/fa';

const DashboardTab = lazy(() => import('@admin/features/dashboard/DashboardTab'));
const MapTab = lazy(() => import('@admin/features/map/MapTab'));
const ParserTab = lazy(() => import('@admin/features/parser/ParserTab'));
const ManualTab = lazy(() => import('@admin/features/manual-editor/ManualTab'));
const ScraperManager = lazy(() => import('@admin/features/scraper/ScraperManager'));
const CommentsTab = lazy(() => import('@admin/features/feedback/comments/CommentsTab'));
const FeedbackTab = lazy(() => import('@admin/features/feedback/feedback/FeedbackTab'));
const FieldsManager = lazy(() => import('@admin/features/fields/FieldsManager'));
const TranslationsManager = lazy(() => import('@admin/features/translations/TranslationsManager'));
const NotificationsTab = lazy(() => import('@admin/features/notifications/NotificationsTab'));
const UsersTab = lazy(() => import('@admin/features/users/UsersTab'));
const AiLogsTab = lazy(() => import('@admin/features/logs/ai/AiLogsTab'));
const AuditLogsTab = lazy(() => import('@admin/features/logs/audit/AuditLogsTab'));

import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("AdminPanel ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

function AdminPanelContent() {
    const { t } = useTranslation('db');
    const { currentAdmin, loadingAdmin, adminLogout } = useAdmin();
    const { canDo, isSuperAdmin } = useActionGuard();
    useDBTranslations();

    const [activeTab, setActiveTab] = useState<string>(() => {
        return localStorage.getItem('admin_active_tab') || 'dashboard';
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        if (activeTab) {
            localStorage.setItem('admin_active_tab', activeTab);
        }
    }, [activeTab]);

    const tabTitleMap: Record<string, string> = useMemo(() => ({
        dashboard: t('admin_panel.tabs.dashboard'),
        map: t('admin_panel.tabs.map'),
        manual: t('admin_panel.tabs.manual'),
        parser: t('admin_panel.tabs.parser'),
        scraper: t('admin_panel.tabs.scraper'),
        users: t('admin_panel.tabs.users'),
        comments: t('admin_panel.tabs.comments'),
        feedback: t('admin_panel.tabs.feedback'),
        fields: t('admin_panel.tabs.fields'),
        translations: t('admin_panel.tabs.translations'),
        notifications: t('admin_panel.tabs.notifications'),
        ai: t('admin_panel.tabs.ai'),
        audit: t('admin_panel.tabs.audit'),
    }), [t]);

    const handleLogout = () => {
        adminLogout();
    };

    if (loadingAdmin) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-main text-textMain gap-3 font-sans">
                <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-wider text-textMuted animate-pulse">
                    {t('common.loading')}
                </span>
            </div>
        );
    }

    if (!currentAdmin) {
        return <LoginTab />;
    }

    const hasAccess = isSuperAdmin || canDo(activeTab);

    const renderActiveTab = () => {
        if (!hasAccess) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-surface rounded-3xl border border-[#d6ccbf] dark:border-[#4a3f37]">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-xl mb-3">
                        <FaExclamationTriangle />
                    </div>
                    <h3 className="text-base font-bold text-textMain m-0 mb-1">
                        {t('admin_panel.access_denied_title')}
                    </h3>
                    <p className="text-xs text-textMuted max-w-sm m-0">
                        {t('admin_panel.access_denied_desc')}
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'map':
                return <MapTab />;
            case 'manual':
                return <ManualTab />;
            case 'parser':
                return <ParserTab />;
            case 'scraper':
                return <ScraperManager />;
            case 'users':
                return <UsersTab />;
            case 'comments':
                return <CommentsTab />;
            case 'feedback':
                return <FeedbackTab />;
            case 'fields':
                return <FieldsManager />;
            case 'translations':
                return <TranslationsManager />;
            case 'notifications':
                return <NotificationsTab />;
            case 'ai':
                return <AiLogsTab />;
            case 'audit':
                return <AuditLogsTab />;
            default:
                return <DashboardTab />;
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-main font-sans antialiased text-textMain select-none">
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                <div className="md:hidden shrink-0 z-10">
                    <header className="h-14 px-4 sm:px-6 bg-surface border-b border-[#d6ccbf] dark:border-[#4a3f37] flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => setIsMobileOpen(true)}
                                className="p-2 rounded-xl text-textMuted hover:text-textMain hover:bg-hover border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs transition-colors"
                                aria-label="Open navigation menu"
                            >
                                <FaBars className="text-sm" />
                            </button>
                            <h1 className="text-sm sm:text-base font-bold text-textMain tracking-tight m-0 truncate">
                                {tabTitleMap[activeTab] || activeTab}
                            </h1>
                        </div>
                    </header>
                </div>

                <main className={`flex-1 overflow-y-auto scrollbar-thin ${activeTab === 'map' ? 'p-0' : 'p-4 sm:p-6'}`}>
                    <ErrorBoundary fallback={
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-xl mb-3">
                                <FaExclamationTriangle />
                            </div>
                            <h3 className="text-base font-bold text-textMain m-0 mb-1">
                                {t('common.error')}
                            </h3>
                            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
                                {t('common.refresh', 'Оновити сторінку')}
                            </button>
                        </div>
                    }>
                        <Suspense fallback={
                            <div className="h-full flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
                            </div>
                        }>
                            <div className="w-full h-full flex flex-col">
                                {renderActiveTab()}
                            </div>
                        </Suspense>
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}

export default function AdminPanel() {
    return (
        <AdminProvider>
            <ModalProvider>
                <AdminPanelContent />
            </ModalProvider>
        </AdminProvider>
    );
}