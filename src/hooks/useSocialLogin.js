import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';

export const useSocialLogin = (setIsLoading, setErrors) => {
  const { t } = useTranslation('db'); // Змінено на 'db'

  const socialLogin = async (provider) => {
    try {
      setIsLoading(true);
      setErrors({});

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false
        }
      });
      
      if (error) throw error;
    } catch {
      setErrors({ submit: t('auth.errors.generic') }); // Оновлений ключ
    } finally {
      setIsLoading(false);
    }
  };

  return socialLogin;
};