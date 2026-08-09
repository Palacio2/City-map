import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@auth/context/AuthContext';
import { supabase } from '@supabaseClient';

export default function AdminRoute({ children }: { readonly children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      if (isAuthenticated && user) {
        try {
          const { data } = await supabase.auth.getSession();
          const currentRole = data?.session?.user?.app_metadata?.role || user?.app_metadata?.role;
          
          if (mounted) {
            setIsAdmin(currentRole === 'admin' || currentRole === 'super_admin');
          }
        } catch {
          if (mounted) setIsAdmin(false);
        }
      }
      if (mounted) setIsChecking(false);
    };

    if (!authLoading) {
      verifyAdmin();
    }

    return () => { mounted = false; };
  }, [authLoading, isAuthenticated, user]);

  if (authLoading || isChecking) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}