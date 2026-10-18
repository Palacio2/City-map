import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { mapSupabaseError } from '@utils/errorHandler';
import { updatePassword } from '../api/profileApi';
import { getChangePasswordSchema } from '../validation';
import type { ChangePasswordFormValues } from '../validation';
import type { StatusMessage } from '../types';

export const usePasswordChange = (onSuccessClose?: () => void) => {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({ type: '', text: '' });
  const [isTipsOpen, setIsTipsOpen] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(getChangePasswordSchema(t)),
    mode: 'onTouched',
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const mutation = useMutation({
    mutationFn: async (data: ChangePasswordFormValues) => {
      await updatePassword(data.newPassword);
    },
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: t('profile.password_page.success') });
      form.reset();
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => {
        if (onSuccessClose) {
          onSuccessClose();
        } else {
          navigate('/profile');
        }
      }, 1500);
    },
    onError: (error: unknown) => {
      setStatusMessage({ type: 'error', text: mapSupabaseError(error, t) });
    }
  });

  const onSubmit = form.handleSubmit((data) => {
    setStatusMessage({ type: '', text: '' });
    mutation.mutate(data);
  });

  const securityTips = t('profile.password_page.tips', { returnObjects: true });
  let parsedTips: string[] = [];
  try {
    const tips: unknown = typeof securityTips === 'string' ? JSON.parse(securityTips) : securityTips;
    if (Array.isArray(tips)) parsedTips = tips.filter((tip): tip is string => typeof tip === 'string');
  } catch { /* Missing or malformed translations must not break password recovery. */ }

  return {
    form,
    onSubmit,
    statusMessage,
    isSaving: mutation.isPending,
    isTipsOpen,
    setIsTipsOpen,
    showPasswords,
    togglePasswordVisibility,
    parsedTips
  };
};
