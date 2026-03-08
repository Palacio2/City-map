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

    const tabStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
    
    const getIconStyle = (tabName, color) => ({
        fontSize: '1.2rem',
        color: activeTab === tabName ? color : 'var(--text-muted)',
        transition: 'color 0.2s ease'
    });

    return (
        <div className={styles.container}>
            <header className={styles.headerContainer}>
                <div>
                    <h1 className={styles.title}>{t('adminPanel.title')}</h1>
                    <div className={styles.tabs}>
                        
                        <button className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('dashboard')}>
                            <FaChartPie style={getIconStyle('dashboard', '#3b82f6')} /> {t('adminPanel.tabDashboard')}
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'map' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('map')}>
                            <FaMapMarkedAlt style={getIconStyle('map', '#10b981')} /> {t('adminPanel.tabMap')}
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'parser' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('parser')}>
                            <FaCloudDownloadAlt style={getIconStyle('parser', '#8b5cf6')} /> {t('adminPanel.tabParser')}
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('manual')}>
                            <FaEdit style={getIconStyle('manual', '#f59e0b')} /> {t('adminPanel.tabManual')}
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'feedback' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('feedback')}>
                            <FaComments style={getIconStyle('feedback', '#ec4899')} /> {t('adminPanel.tabFeedback')}
                        </button>
                        <button className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('ai')}>
                            <FaBrain style={getIconStyle('ai', '#06b6d4')} /> {t('adminPanel.tabAi')}
                        </button>

                        {isSuperAdmin && (
                            <>
                                <div style={{ width: '2px', height: '24px', background: 'var(--border)', margin: '0 8px', borderRadius: '2px' }}></div>
                                <button className={`${styles.tabBtn} ${activeTab === 'users' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('users')}>
                                    <FaUsers style={getIconStyle('users', '#6366f1')} /> {t('adminPanel.tabUsers')}
                                </button>
                                {/* ДОДАНО ПЕРЕКЛАД */}
                                <button className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('notifications')}>
                                    <FaBullhorn style={getIconStyle('notifications', '#f97316')} /> {t('adminPanel.tabNotifications')}
                                </button>
                                {/* ДОДАНО ПЕРЕКЛАД */}
                                <button className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.active : ''}`} style={tabStyle} onClick={() => setActiveTab('audit')}>
                                    <FaShieldAlt style={getIconStyle('audit', '#ef4444')} /> {t('adminPanel.tabAudit')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaSignOutAlt /> {t('adminPanel.logout')}
                </button>
            </header>

            <main>
                <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}><DashboardTab /></div>
                <div style={{ display: activeTab === 'map' ? 'block' : 'none', height: '75vh' }}><MapTab /></div>
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