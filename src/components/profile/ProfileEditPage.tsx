import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaTimes, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import enLabels from 'react-phone-number-input/locale/en.json';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI } from '@api/edit-profileApi';
import { validateProfileForm } from '@utils/profileValidation';

export default function ProfileEditPage() {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, setState] = useState({ name: '', email: '', phone: '', originalEmail: '' });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Використовуємо React Query для отримання даних
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: profileAPI.getProfile,
  });

  useEffect(() => {
    if (profile) {
      setState({
        name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        originalEmail: profile.email || ''
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await profileAPI.updateProfile({ full_name: state.name.trim(), phone: state.phone });
      if (state.email.trim() !== state.originalEmail) {
        await profileAPI.updateEmail(state.email.trim());
        return 'email_updated';
      }
      return 'success';
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] }); // Оновлюємо глобальний стейт юзера
      
      if (result === 'email_updated') {
        setStatusMessage({ type: 'success', text: t('profile.edit_page.email_update_sent') });
        setState(s => ({ ...s, originalEmail: state.email.trim() }));
      } else {
        setStatusMessage({ type: 'success', text: t('profile.edit_page.success') });
        setTimeout(() => navigate('/profile'), 1500);
      }
    },
    onError: (error: any) => {
      const msg = (error?.message || '').toLowerCase();
      let errorText = error.message || t('profile.errors.unknown_error');

      if (msg.includes('jwt')) errorText = t('profile.errors.auth_error');
      else if (msg.includes('fetch')) errorText = t('profile.errors.network_error');
      else if (msg.includes('already registered')) errorText = t('profile.errors.email_taken');
      else if (msg.includes('rate limit')) errorText = t('profile.errors.too_many_requests');
      else if (msg.includes('invalid')) errorText = t('profile.errors.email_invalid_format');

      setStatusMessage({ type: 'error', text: errorText });
    }
  });

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    const validationError = validateProfileForm(state, t);
    if (validationError) {
        setStatusMessage(validationError);
        return; 
    }

    if (state.phone && !isValidPhoneNumber(state.phone)) {
        setStatusMessage({ type: 'error', text: t('profile.edit_page.errors.phone_invalid') });
        return;
    }

    updateProfileMutation.mutate();
  };

  const isSaving = updateProfileMutation.isPending;

  return (
    <div className="min-h-[100dvh] bg-body text-textMain py-8 px-4 md:px-8 font-body animate-fadeIn">
      {/* Хедер залишається тим самим */}
      <div className="max-w-[1200px] mx-auto mb-10 flex flex-col gap-4">
        <Link to="/profile" className="inline-flex items-center gap-2 text-textSecondary font-heading font-semibold text-[0.85rem] tracking-widest uppercase transition-all w-fit hover:text-accent hover:-translate-x-1 decoration-none">
          <FaArrowLeft /> {t('profile.actions.back_to_profile')}
        </Link>
        <div className="mt-2">
          <h1 className="font-heading text-3xl md:text-[2.5rem] font-bold text-accent mb-2 inline-block">
            {t('profile.edit_page.title')}
          </h1>
          <p className="text-textSecondary text-base max-w-[600px] leading-relaxed">
            {t('profile.edit_page.subtitle')}
          </p>
        </div>
      </div>
      
      <div className="max-w-[700px] mx-auto w-full">
        <div className="ui-glass-panel p-6 md:p-10 shadow-card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-8" noValidate>
            <div className="text-center border-b border-borderClient pb-6 mb-2">
              <h2 className="font-heading text-textMain text-2xl font-bold mb-2">{t('profile.edit_page.main_info')}</h2>
              <p className="text-textSecondary text-[0.9rem] m-0">{t('profile.edit_page.enter_data')}</p>
            </div>
            
            {statusMessage.text && (
              <div className={`flex items-center gap-3 p-4 rounded-lg font-medium text-[0.9rem] animate-slideDown ${statusMessage.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`} role="alert">
                {statusMessage.type === 'success' ? <FaCheckCircle className="shrink-0 text-lg" /> : <FaExclamationTriangle className="shrink-0 text-lg" />}
                <span>{statusMessage.text}</span>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-[0.03em]">
                <FaUser className="text-accent text-[0.9rem]" /> {t('profile.labels.full_name')} *
              </label>
              <input
                id="name" type="text" name="name" value={state.name} onChange={handleInputChange}
                className="w-full p-4 bg-body border border-borderClient rounded-lg text-textMain font-body text-base transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-hover"
                placeholder={t('profile.edit_page.placeholders.name')} required disabled={isSaving} maxLength={30}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-[0.03em]">
                <FaEnvelope className="text-accent text-[0.9rem]" /> {t('profile.labels.email')} *
              </label>
              <input
                id="email" type="email" name="email" value={state.email} onChange={handleInputChange}
                className="w-full p-4 bg-body border border-borderClient rounded-lg text-textMain font-body text-base transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-hover"
                placeholder={t('profile.edit_page.placeholders.email')} required disabled={isSaving} maxLength={60} 
              />
              
              {state.email !== state.originalEmail && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-2.5 mt-2 text-[0.85rem] text-warning" role="note">
                  <FaExclamationTriangle className="shrink-0" />
                  <span>{t('profile.edit_page.email_warning')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-[0.03em]">
                <FaPhone className="text-accent text-[0.9rem]" /> {t('profile.labels.phone')}
              </label>
              
              <div className="flex items-center w-full px-4 bg-body border border-borderClient rounded-lg transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 
              [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:py-4 [&_.PhoneInputInput]:text-textMain [&_.PhoneInputInput]:font-body [&_.PhoneInputInput]:text-base [&_.PhoneInputInput]:outline-none 
              [&_.PhoneInputCountrySelect]:bg-body [&_.PhoneInputCountrySelect]:text-textMain [&_.PhoneInputCountrySelect_option]:bg-body [&_.PhoneInputCountrySelect_option]:text-textMain 
              [&_.PhoneInputCountry]:mr-3 [&_.PhoneInputCountry]:pr-3 [&_.PhoneInputCountry]:border-r [&_.PhoneInputCountry]:border-borderClient 
              aria-disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:bg-hover" aria-disabled={isSaving}>
                <PhoneInput
                  international defaultCountry="PL" value={state.phone}
                  onChange={(val) => setState(prev => ({ ...prev, phone: val || '' }))}
                  disabled={isSaving} labels={enLabels} limitMaxLength={true}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <button type="submit" className="flex-[2] flex items-center justify-center gap-2.5 p-4 bg-gradient-to-br from-accent to-accent-hover text-white border-none rounded-lg font-heading text-[0.9rem] font-bold uppercase tracking-widest cursor-pointer transition-all shadow-sm hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-md hover:not(:disabled):brightness-110 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSaving}>
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave className="text-lg" />}
                {isSaving ? t('profile.actions.saving') : t('profile.actions.save')}
              </button>
              
              <Link to="/profile" className="flex-[1] flex items-center justify-center gap-2.5 p-4 bg-transparent text-textMain border border-borderClient rounded-lg font-heading text-[0.9rem] font-bold uppercase tracking-widest cursor-pointer transition-all decoration-none hover:bg-hover hover:border-textSecondary">
                <FaTimes className="text-lg" /> {t('profile.actions.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}