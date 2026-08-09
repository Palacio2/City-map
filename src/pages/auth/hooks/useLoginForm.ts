import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginUser } from '../api/authApi';
import { getLoginSchema } from '../validation';
import type { LoginFormValues } from '../validation';
import { useSocialLogin } from './useSocialLogin';

export const useLoginForm = () => {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [globalError, setGlobalError] = useState('');

  const { socialLogin, isSocialLoading } = useSocialLogin(setGlobalError);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(getLoginSchema(t)),
    defaultValues: {
      email: localStorage.getItem('userEmail') || '',
      rememberMe: localStorage.getItem('rememberMe') === 'true'
    }
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      if (variables.rememberMe) {
        localStorage.setItem('userEmail', variables.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('rememberMe');
      }
      navigate('/', { replace: true });
    },
    onError: (e: Error & { status?: number }) => {
      setGlobalError(e.status === 429 ? t('auth.errors.too_many_requests') : t('auth.errors.login_failed'));
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