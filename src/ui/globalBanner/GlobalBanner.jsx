import React, { useEffect, useState } from 'react';
import { supabase } from '@supabaseClient';

export default function GlobalBanner() {
    const [banner, setBanner] = useState(null);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const { data, error } = await supabase
                    .from('global_notifications')
                    .select('*')
                    .eq('is_active', true)
                    .maybeSingle();

                if (!error && data) {
                    setBanner(data);
                }
            } catch (err) {
                console.error("Banner fetch error:", err);
            }
        };

        fetchBanner();

        // Підписка на оновлення в реальному часі (якщо адмін змінить банер, у юзерів він оновиться миттєво)
        const channel = supabase
            .channel('public:global_notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'global_notifications' }, () => {
                fetchBanner();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!banner) return null;

    const bgColors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };

    return (
        <div style={{
            background: bgColors[banner.type] || bgColors.info,
            color: 'white',
            padding: '12px 20px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '0.95rem',
            position: 'relative',
            zIndex: 9999,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            {banner.message}
        </div>
    );
}