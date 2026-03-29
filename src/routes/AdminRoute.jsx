import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { api } from '../services/api';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      if (isAuthenticated && user) {
        try {
          const { data } = await api.auth.getSession();
          const currentRole = data?.session?.user?.app_metadata?.role || user?.app_metadata?.role;
          
          if (mounted) {
            setIsAdmin(currentRole === 'admin' || currentRole === 'super_admin');
          }
        } catch (error) {
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

  return children;
};

export default AdminRoute;