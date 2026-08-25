// src/pages/admin/core/hooks/useSystemStatus.ts
import { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';

export function useSystemStatus() {
  const [dbStatus, setDbStatus] = useState({ online: false, latency: 0 });
  const [apiStatus, setApiStatus] = useState({ online: false, latency: 0 });
  const [stats, setStats] = useState({ users: 0, districts: 0, cities: 0 });

  useEffect(() => {
    let mounted = true;

    const pingDb = async () => {
      const start = performance.now();
      try {
        const { error } = await supabase.from('cities').select('id').limit(1);
        if (mounted) {
          setDbStatus({ online: !error, latency: error ? 0 : Math.round(performance.now() - start) });
        }
      } catch {
        if (mounted) setDbStatus({ online: false, latency: 0 });
      }
    };

    const pingApi = async () => {
      const start = performance.now();
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/api/health`, { method: 'GET' });
        if (mounted) {
          setApiStatus({ online: res.ok, latency: res.ok ? Math.round(performance.now() - start) : 0 });
        }
      } catch {
        if (mounted) setApiStatus({ online: false, latency: 0 });
      }
    };

    const getStats = async () => {
      try {
        const [citiesRes, districtsRes, usersCountRes] = await Promise.all([
          supabase.from('cities').select('id', { count: 'exact', head: true }),
          supabase.from('districts').select('id', { count: 'exact', head: true }),
          // @ts-expect-error - Supabase generated types don't include this custom RPC yet
          supabase.rpc('get_total_users')
        ]);
        
        if (mounted) {
          setStats({
            users: (typeof usersCountRes.data === 'number' ? usersCountRes.data : 0),
            districts: districtsRes.count || 0,
            cities: citiesRes.count || 0
          });
        }
      } catch (err) { console.error('Error caught in empty catch block:', err); }
    };

    pingDb();
    pingApi();
    getStats();

    const interval = setInterval(() => {
      pingDb();
      pingApi();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { dbStatus, apiStatus, stats };
}