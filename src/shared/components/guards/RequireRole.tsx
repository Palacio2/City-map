import React from 'react';
import { useAuth } from '@/pages/auth/context/AuthContext';

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children, fallback = null }) => {
  const { session } = useAuth();
  
  if (!session) return <>{fallback}</>;
  
  const userRole = session.user?.app_metadata?.role || 'user';
  
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};
