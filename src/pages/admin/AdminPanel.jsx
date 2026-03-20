import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import Login from './Login';
import styles from './AdminPanel.module.css';
import DashboardTab from './tabs/dashboard/DashboardTab';
import ParserTab from './tabs/parser/ParserTab';
import ManualTab from './tabs/manual/ManualTab';
import MapTab from './tabs/map/MapTab';
import FeedbackTab from './tabs/feedback/FeedbackTab';
import UsersTab from './tabs/users/UsersTab';
import AiLogsTab from './tabs/aiLogs/AiLogsTab';
import AuditLogsTab from './tabs/auditLogs/AuditLogsTab';
import NotificationsTab from './tabs/notifications/NotificationsTab';
import { useTranslation } from 'react-i18next';
import { AdminProvider, useAdmin } from './hooks/AdminContext'; 

import { 
    FaSignOutAlt, 
    FaChartPie, 
    FaMapMarkedAlt, 
    FaCloudDownloadAlt, 
    FaEdit, 
    FaComments, 
    FaBrain, 
    FaUsers, 
    FaBullhorn, 
    FaShieldAlt 
} from 'react-icons/fa';

export default function AdminPanel() {
    const [isFullyAuthed, setIsFullyAuthed] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const hasSecretKey = queryParams.get('key') === 'boss';

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) return;

                const isAdmin = session.user.app_metadata?.role === 'admin' || session.user.app_metadata?.role === 'super_admin';
                if (!isAdmin) {
                    if (isMounted) navigate('/', { replace: true });
                    return;
                }

                const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (aalError) throw aalError;

                if (aalData?.currentLevel === 'aal2' && isMounted) {
                    setIsFullyAuthed(true);
                }
            } catch {
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                if (isMounted) setIsFullyAuthed(false);
            } else if (event === 'SIGNED_IN' || event === 'MFA_CHALLENGE_VERIFIED') {
                checkAuth();
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [navigate]);

    if (loading) return null; 
    
    if (!isFullyAuthed) {
        if (hasSecretKey) {
            return <Login />;
        }
        return <Navigate to="/" replace />;
    }

    return (
        <AdminProvider>
            <AdminContent />
        </AdminProvider>
    );
}

function AdminContent() {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState('dashboard');
    const { currentAdmin, loadingAdmin } = useAdmin();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    if (loadingAdmin) return null; 

    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    
    const getIconStyle = (tabName, color) => ({
        fontSize: '1.25rem',
        color: activeTab === tabName ? color : 'currentColor',
        transition: 'color 0.3s ease, transform 0.3s ease',
        transform: activeTab === tabName ? 'scale(1.1)' : 'scale(1)'
    });

    return (
        <div className={styles.container}>
            <header className={styles.headerContainer}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>{t('adminPanel.title')}</h1>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <FaSignOutAlt /> <span>{t('adminPanel.logout')}</span>
                    </button>
                </div>
                <div className={styles.tabsWrapper}>
                    <div className={styles.tabs}>
                        <button className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <FaChartPie style={getIconStyle('dashboard', '#3b82f6')} /> <span>{t('adminPanel.tabDashboard')}</span>
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'map' ? styles.active : ''}`} onClick={() => setActiveTab('map')}>
                            <FaMapMarkedAlt style={getIconStyle('map', '#10b981')} /> <span>{t('adminPanel.tabMap')}</span>
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'parser' ? styles.active : ''}`} onClick={() => setActiveTab('parser')}>
                            <FaCloudDownloadAlt style={getIconStyle('parser', '#8b5cf6')} /> <span>{t('adminPanel.tabParser')}</span>
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.active : ''}`} onClick={() => setActiveTab('manual')}>
                            <FaEdit style={getIconStyle('manual', '#f59e0b')} /> <span>{t('adminPanel.tabManual')}</span>
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'feedback' ? styles.active : ''}`} onClick={() => setActiveTab('feedback')}>
                            <FaComments style={getIconStyle('feedback', '#ec4899')} /> <span>{t('adminPanel.tabFeedback')}</span>
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.active : ''}`} onClick={() => setActiveTab('ai')}>
                            <FaBrain style={getIconStyle('ai', '#06b6d4')} /> <span>{t('adminPanel.tabAi')}</span>
                        </button>

                        {isSuperAdmin && (
                            <>
                                <div className={styles.divider}></div>
                                <button className={`${styles.tabBtn} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>
                                    <FaUsers style={getIconStyle('users', '#6366f1')} /> <span>{t('adminPanel.tabUsers')}</span>
                                </button>
                                <button className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.active : ''}`} onClick={() => setActiveTab('notifications')}>
                                    <FaBullhorn style={getIconStyle('notifications', '#f97316')} /> <span>{t('adminPanel.tabNotifications')}</span>
                                </button>
                                <button className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.active : ''}`} onClick={() => setActiveTab('audit')}>
                                    <FaShieldAlt style={getIconStyle('audit', '#ef4444')} /> <span>{t('adminPanel.tabAudit')}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.mainContent}>
                <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}><DashboardTab /></div>
                <div style={{ display: activeTab === 'map' ? 'block' : 'none', height: '100%', minHeight: '75vh' }}><MapTab /></div>
                <div style={{ display: activeTab === 'parser' ? 'block' : 'none' }}><ParserTab /></div>
                <div style={{ display: activeTab === 'manual' ? 'block' : 'none' }}><ManualTab /></div>
                <div style={{ display: activeTab === 'feedback' ? 'block' : 'none' }}><FeedbackTab /></div>
                <div style={{ display: activeTab === 'ai' ? 'block' : 'none' }}><AiLogsTab /></div>
                
                {isSuperAdmin && (
                    <>
                        <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}><UsersTab /></div>
                        <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}><NotificationsTab /></div>
                        <div style={{ display: activeTab === 'audit' ? 'block' : 'none' }}><AuditLogsTab /></div>
                    </>
                )}
            </main>
        </div>
    );
}