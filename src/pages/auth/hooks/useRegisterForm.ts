import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { registerUser } from '../api/authApi';
import { getRegisterSchema } from '../validation';
import type { RegisterFormValues } from '../validation';
import { useSocialLogin } from './useSocialLogin';

export const useRegisterForm = () => {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState('');

  const { socialLogin, isSocialLoading } = useSocialLogin(setGlobalError);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(getRegisterSchema(t)),
    mode: 'onTouched'
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data, variables) => {
      if (data.user?.identities?.length === 0) {
        setGlobalError(t('auth.errors.user_exists'));
      } else {
        navigate('/register-success', { state: { email: variables.email } });
      }
    },
    onError: (e: Error) => {
      if (e.message?.includes('already registered')) {
        setGlobalError(t('auth.errors.user_exists'));
      } else {
        setGlobalError(t('auth.errors.generic'));
      }
    }
  });

  const onSubmit = form.handleSubmit((data) => {
    setGlobalError('');
    mutation.mutate(data);
  });

  return {
    form,
    onSubmit,
    globalError,
    isLoading: mutation.isPending || isSocialLoading,
    socialLogin
  };
};