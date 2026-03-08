import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminProfile = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                if (!session) return;

                const userId = session.user.id;
                const baseRole = session.user.app_metadata?.role || 'user';

                const { data, error } = await supabase
                    .from('admin_profiles')
                    .select('role, assigned_cities')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = запис не знайдено
                    console.error("Помилка отримання профілю адміна:", error);
                }

                setCurrentAdmin({
                    id: userId,
                    email: session.user.email,
                    role: data?.role || baseRole,
                    cities: data?.assigned_cities || []
                });
            } catch (error) {
                console.error("Critical error in fetchAdminProfile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminProfile();
    }, []);

    // ОПТИМІЗАЦІЯ: Мемоізуємо значення контексту, щоб уникнути зайвих рендерів
    const value = useMemo(() => ({
        currentAdmin,
        loadingAdmin: loading
    }), [currentAdmin, loading]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};