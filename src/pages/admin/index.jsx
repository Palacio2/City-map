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
import { FaSignOutAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

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

                const isAdmin = session.user.app_metadata?.role === 'admin';
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
                //
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

    return <AdminContent />;
}

function AdminContent() {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <header className={styles.headerContainer}>
                <div>
                    <h1 className={styles.title}>{t('adminPanel.title')}</h1>
                    <div className={styles.tabs}>
                        <button className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>{t('adminPanel.tabDashboard')}</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>{t('adminPanel.tabUsers')}</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.active : ''}`} onClick={() => setActiveTab('ai')}>{t('adminPanel.tabAi')}</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'parser' ? styles.active : ''}`} onClick={() => setActiveTab('parser')}>{t('adminPanel.tabParser')}</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.active : ''}`} onClick={() => setActiveTab('manual')}>{t('adminPanel.tabManual')}</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'map' ? styles.active : ''}`} onClick={() => setActiveTab('map')}>{t('adminPanel.tabMap')}</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'feedback' ? styles.active : ''}`} onClick={() => setActiveTab('feedback')}>{t('adminPanel.tabFeedback')}</button>
                    </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <FaSignOutAlt /> {t('adminPanel.logout')}
                </button>
            </header>

            <main>
                <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}><DashboardTab /></div>
                <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}><UsersTab /></div>
                <div style={{ display: activeTab === 'ai' ? 'block' : 'none' }}><AiLogsTab /></div>
                <div style={{ display: activeTab === 'parser' ? 'block' : 'none' }}><ParserTab /></div>
                <div style={{ display: activeTab === 'manual' ? 'block' : 'none' }}><ManualTab /></div>
                <div style={{ display: activeTab === 'map' ? 'block' : 'none', height: '75vh' }}><MapTab /></div>
                <div style={{ display: activeTab === 'feedback' ? 'block' : 'none' }}><FeedbackTab /></div>
            </main>
        </div>
    );
}