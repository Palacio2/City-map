import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithProvider } from '../api/authApi';

export const useSocialLogin = (setGlobalError: (err: string) => void) => {
  const { t } = useTranslation('db');
  const [isSocialLoading, setIsSocialLoading] = useState<boolean>(false);

  const socialLogin = async (provider: 'google') => {
    try {
      setIsSocialLoading(true);
      setGlobalError('');
      await signInWithProvider(provider);
    } catch {
      setGlobalError(t('auth.errors.generic'));
      setIsSocialLoading(false);
    }
  };

  return { socialLogin, isSocialLoading };
};