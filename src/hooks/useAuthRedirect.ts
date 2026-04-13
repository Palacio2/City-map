import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';

export default function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return !isLoading;
}