import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import Login from './Login';
import styles from './AdminPanel.module.css';
import DashboardTab from './tabs/dashboard/DashboardTab';
import ParserTab from './tabs/parser/ParserTab';
import ManualTab from './tabs/manual/ManualTab';
import MapTab from './tabs/map/MapTab';
import { FaSignOutAlt } from 'react-icons/fa';

export default function AdminPanel() {
    const [isFullyAuthed, setIsFullyAuthed] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Перевіряємо, чи є секретний ключ в URL (наприклад: /parser?key=boss)
    const queryParams = new URLSearchParams(location.search);
    const hasSecretKey = queryParams.get('key') === 'boss';

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) return;

                // Перевірка ТОКЕНА
                const isAdmin = session.user.app_metadata?.role === 'admin';
                if (!isAdmin) {
                    if (isMounted) navigate('/', { replace: true });
                    return;
                }

                // Перевірка 2FA
                const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (aalError) throw aalError;

                if (aalData?.currentLevel === 'aal2' && isMounted) {
                    setIsFullyAuthed(true);
                }
            } catch (e) {
                console.error("Auth check failed:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

    // Поки перевіряємо, нічого не показуємо (щоб не "світити" сторінку)
    if (loading) return null; 
    
    // Якщо ти ще не увійшов у систему (або сесія злетіла)
    if (!isFullyAuthed) {
        // Якщо в URL є секретний ключ - показуємо форму входу
        if (hasSecretKey) {
            return <Login />;
        }
        // Якщо секретного ключа немає - миттєво викидаємо на головну!
        return <Navigate to="/" replace />;
    }

    // Якщо все супер - показуємо Адмінку
    return <AdminContent />;
}

function AdminContent() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <header className={styles.headerContainer}>
                <div>
                    <h1 className={styles.title}>🛠 City Maps Admin v4.0</h1>
                    <div className={styles.tabs}>
                        <button className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Дашборд</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'parser' ? styles.active : ''}`} onClick={() => setActiveTab('parser')}>🤖 Автоматичний Парсер</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.active : ''}`} onClick={() => setActiveTab('manual')}>🌍 Ручне редагування</button>
                        <button className={`${styles.tabBtn} ${activeTab === 'map' ? styles.active : ''}`} onClick={() => setActiveTab('map')}>🗺️ Карта міста</button>
                    </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <FaSignOutAlt /> Вийти
                </button>
            </header>

            <main>
                <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}><DashboardTab /></div>
                <div style={{ display: activeTab === 'parser' ? 'block' : 'none' }}><ParserTab /></div>
                <div style={{ display: activeTab === 'manual' ? 'block' : 'none' }}><ManualTab /></div>
                <div style={{ display: activeTab === 'map' ? 'block' : 'none', height: '75vh' }}><MapTab /></div>
            </main>
        </div>
    );
}