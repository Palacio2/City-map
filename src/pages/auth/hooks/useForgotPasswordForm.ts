import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../api/authApi';
import { getForgotPasswordSchema } from '../validation';
import type { ForgotPasswordFormValues } from '../validation';

export const useForgotPasswordForm = () => {
  const { t } = useTranslation('db');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string>('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(getForgotPasswordSchema(t)),
  });

  const mutation = useMutation({
    mutationFn: async (cleanEmail: string) => {
      await resetPassword(cleanEmail);
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: () => {
      setGlobalError(t('auth.errors.generic'));
    }
  });

  const onSubmit = form.handleSubmit((data) => {
    setGlobalError('');
    mutation.mutate(data.email.trim());
  });

  return {
    form,
    onSubmit,
    globalError,
    isSubmitted,
    setIsSubmitted,
    isLoading: mutation.isPending
  };
};