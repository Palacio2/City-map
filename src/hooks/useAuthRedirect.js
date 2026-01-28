import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@supabaseClient';

export default function useAuthRedirect() {
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); 

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && !error) {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else {
          setIsAutoLoginAttempted(true);
        }
      } catch (error) {
        setIsAutoLoginAttempted(true);
      }
    };

    checkSession();
  }, [navigate, location]);

  return isAutoLoginAttempted;
}