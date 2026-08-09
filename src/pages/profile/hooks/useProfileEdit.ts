import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { mapSupabaseError } from '@utils/errorHandler';
import { getProfile, updateProfile, updateEmail } from '../api/profileApi';
import { getProfileEditSchema } from '../validation';
import type { ProfileEditFormValues } from '../validation';
import type { StatusMessage } from '../types';

export const useProfileEdit = () => {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({ type: '', text: '' });
  const [originalEmail, setOriginalEmail] = useState<string>('');

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(getProfileEditSchema(t)),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', phone: '' }
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
      setOriginalEmail(profile.email || '');
    }
  }, [profile, form]);

  const mutation = useMutation({
    mutationFn: async (data: ProfileEditFormValues) => {
      await updateProfile({ full_name: data.name.trim(), phone: data.phone });
      if (data.email.trim() !== originalEmail) {
        await updateEmail(data.email.trim());
        return 'email_updated';
      }
      return 'success';
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      
      if (result === 'email_updated') {
        setStatusMessage({ type: 'success', text: t('profile.edit_page.email_update_sent') });
        setOriginalEmail(variables.email.trim());
      } else {
        setStatusMessage({ type: 'success', text: t('profile.edit_page.success') });
        setTimeout(() => navigate('/profile'), 1500);
      }
    },
    onError: (error: unknown) => {
      setStatusMessage({ type: 'error', text: mapSupabaseError(error, t) });
    }
  });

  const onSubmit = form.handleSubmit((data) => {
    setStatusMessage({ type: '', text: '' });
    
    if (data.phone && !isValidPhoneNumber(data.phone)) {
      setStatusMessage({ type: 'error', text: t('profile.edit_page.errors.phone_invalid') });
      return;
    }
    
    mutation.mutate(data);
  });

  return {
    form,
    onSubmit,
    statusMessage,
    isSaving: mutation.isPending,
    originalEmail
  };
};