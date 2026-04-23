import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation('db');

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        navigate('/', { replace: true });
      }
    });
    const timer = setTimeout(() => { navigate('/', { replace: true }); }, 3000);
    return () => {
      if (authListener?.subscription) authListener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-5">
      <div className="flex flex-col items-center gap-5">
        <div className="w-12 h-12 border-[4px] border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-textMain font-heading font-semibold text-lg tracking-wider animate-pulse m-0">
          {t('auth.callback.loading')}
        </p>
      </div>
    </div>
  );
}