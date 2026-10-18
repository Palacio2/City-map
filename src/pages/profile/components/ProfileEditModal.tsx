import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { PhoneInput } from '@ui/PhoneInput';
import { useProfileEdit } from '../hooks/useProfileEdit';
import type { ProfileEditModalProps } from '../types';

export const ProfileEditModal = ({ isOpen, onClose }: ProfileEditModalProps) => {
  const { t } = useTranslation('db');
  
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  // Reset closing state when opened
  useEffect(() => {
    clearTimeout(closeTimer.current);
    if (isOpen) {
      setIsClosing(false);
    }
    return () => clearTimeout(closeTimer.current);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400); // Wait for slide-down animation
  };

  const { form, onSubmit, statusMessage, isSaving, originalEmail } = useProfileEdit(handleClose);

  const currentEmail = form.watch('email');
  const currentPhone = form.watch('phone') || '';

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* The Modal Overlay */}
      <div className={`fixed inset-0 z-[1100] w-full flex flex-col sm:justify-center items-center ${isClosing ? 'animate-fade-out-custom' : 'animate-fadeIn'}`}>
        
        {/* Dark Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-0 cursor-pointer" 
          aria-label="Close modal" 
          onClick={handleClose}
        />


        
        {/* Bottom Sheet Card */}
        <div className={`w-full sm:max-w-[700px] mt-auto sm:mt-0 bg-surface rounded-t-3xl sm:rounded-[2rem] px-5 py-6 sm:p-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] sm:shadow-card border-t sm:border border-border relative flex flex-col max-h-[95dvh] sm:max-h-[90dvh] overflow-y-auto custom-scrollbar z-10 ${isClosing ? 'animate-slide-down-sheet' : 'animate-slide-up-sheet'}`}>
          {/* Subtle gradient in the form header */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          {/* Header Row (Inside Card) */}
          <div className="flex items-center gap-4 mb-8 relative z-10 px-2 sm:px-0">
            <button 
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-surface shadow-xs border border-border text-textSecondary hover:text-textMain hover:bg-hover transition-all cursor-pointer"
            >
              <FaArrowLeft />
            </button>
            <div className="text-2xl sm:text-3xl font-bold font-sans text-textMain m-0 tracking-tight truncate">
              {t('profile.edit_page.title')}
            </div>
          </div>

          <div className="relative z-10 mb-6 text-left px-2 sm:px-0">
            <h2 className="text-lg font-bold font-sans text-textMain mb-1">
              {t('profile.edit_page.main_info')}
            </h2>
            <p className="text-textSecondary text-[0.9rem]">
              {t('profile.edit_page.enter_data')}
            </p>
          </div>

          <form onSubmit={(e) => { onSubmit(e); }} className="flex flex-col gap-5 sm:gap-6 relative z-10" noValidate>
            {statusMessage.text && (
              <div 
                className={`flex items-center gap-3 p-4 rounded-2xl font-medium text-[0.9rem] animate-slideDown ${statusMessage.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`} 
                role="alert"
              >
                {statusMessage.type === 'success' ? <FaCheckCircle className="shrink-0 text-lg" /> : <FaExclamationTriangle className="shrink-0 text-lg" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-sans ml-1">
                <FaUser className="text-primary opacity-80" /> {t('profile.labels.full_name')} <span className="text-danger">*</span>
              </label>
              <input
                id="name" 
                type="text" 
                className={`w-full p-4 bg-black/5 dark:bg-black/20 border border-transparent rounded-xl text-textMain font-sans text-[1rem] transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed ${form.formState.errors.name ? 'border-danger focus:border-danger' : 'focus:border-primary hover:border-border'}`}
                placeholder={t('profile.edit_page.placeholders.name')} 
                disabled={isSaving} 
                maxLength={30}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <span className="text-danger text-[0.85rem] font-medium ml-1">{form.formState.errors.name.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-sans ml-1">
                <FaEnvelope className="text-primary opacity-80" /> {t('profile.labels.email')} <span className="text-danger">*</span>
              </label>
              <input
                id="email" 
                type="email" 
                className={`w-full p-4 bg-black/5 dark:bg-black/20 border border-transparent rounded-xl text-textMain font-sans text-[1rem] transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed ${form.formState.errors.email ? 'border-danger focus:border-danger' : 'focus:border-primary hover:border-border'}`}
                placeholder={t('profile.edit_page.placeholders.email')} 
                disabled={isSaving} 
                maxLength={60}
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <span className="text-danger text-[0.85rem] font-medium ml-1">{form.formState.errors.email.message}</span>
              )}
              {currentEmail !== originalEmail && !form.formState.errors.email && (
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3 mt-1 text-[0.9rem] text-warning" role="note">
                  <FaExclamationTriangle className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{t('profile.edit_page.email_warning')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-sans ml-1">
                <FaPhone className="text-primary opacity-80" /> {t('profile.labels.phone')}
              </label>
              <div className="phone-input-wrapper">
                <PhoneInput
                  value={currentPhone}
                  onChange={(val) => form.setValue('phone', val)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 p-4 sm:p-5 bg-primary text-white border border-transparent rounded-xl font-sans text-[1rem] font-bold transition-all shadow-xs hover:not-disabled:brightness-110 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-md active:not-disabled:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed" 
                disabled={isSaving}
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave />}
                {isSaving ? t('profile.actions.saving') : t('profile.actions.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}