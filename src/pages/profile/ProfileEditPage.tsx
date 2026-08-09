import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaTimes, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { PhoneInput } from '@ui/PhoneInput';
import { useProfileEdit } from './hooks/useProfileEdit';

export default function ProfileEditPage() {
  const { t } = useTranslation('db');
  const { form, onSubmit, statusMessage, isSaving, originalEmail } = useProfileEdit();

  const currentEmail = form.watch('email');
  const currentPhone = form.watch('phone') || '';

  return (
    <div className="min-h-[100dvh] bg-body text-textMain py-8 px-4 md:px-8 font-body animate-fadeIn">
      <div className="max-w-[1200px] mx-auto mb-10 flex flex-col gap-4">
        <Link 
          to="/profile" 
          className="inline-flex items-center gap-2 text-textSecondary font-heading font-semibold text-[0.85rem] tracking-widest uppercase transition-all w-fit hover:text-accent hover:-translate-x-1 decoration-none"
        >
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
          <form onSubmit={onSubmit} className="flex flex-col gap-6 md:gap-8" noValidate>
            
            <div className="text-center border-b border-borderClient pb-6 mb-2">
              <h2 className="font-heading text-textMain text-2xl font-bold mb-2">
                {t('profile.edit_page.main_info')}
              </h2>
              <p className="text-textSecondary text-[0.9rem] m-0">
                {t('profile.edit_page.enter_data')}
              </p>
            </div>

            {statusMessage.text && (
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg font-medium text-[0.9rem] animate-slideDown ${statusMessage.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`} 
                role="alert"
              >
                {statusMessage.type === 'success' ? <FaCheckCircle className="shrink-0 text-lg" /> : <FaExclamationTriangle className="shrink-0 text-lg" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-wide">
                <FaUser className="text-accent text-[0.9rem]" /> {t('profile.labels.full_name')} *
              </label>
              <input
                id="name" 
                type="text" 
                className={`w-full p-4 bg-body border rounded-lg text-textMain font-body text-base transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-hover ${form.formState.errors.name ? 'border-danger focus:border-danger' : 'border-borderClient focus:border-accent'}`}
                placeholder={t('profile.edit_page.placeholders.name')} 
                disabled={isSaving} 
                maxLength={30}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <span className="text-danger text-sm mt-1">{form.formState.errors.name.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-wide">
                <FaEnvelope className="text-accent text-[0.9rem]" /> {t('profile.labels.email')} *
              </label>
              <input
                id="email" 
                type="email" 
                className={`w-full p-4 bg-body border rounded-lg text-textMain font-body text-base transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-hover ${form.formState.errors.email ? 'border-danger focus:border-danger' : 'border-borderClient focus:border-accent'}`}
                placeholder={t('profile.edit_page.placeholders.email')} 
                disabled={isSaving} 
                maxLength={60}
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <span className="text-danger text-sm mt-1">{form.formState.errors.email.message}</span>
              )}
              {currentEmail !== originalEmail && !form.formState.errors.email && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-2.5 mt-2 text-[0.85rem] text-warning" role="note">
                  <FaExclamationTriangle className="shrink-0" />
                  <span>{t('profile.edit_page.email_warning')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-wide">
                <FaPhone className="text-accent text-[0.9rem]" /> {t('profile.labels.phone')}
              </label>
              <PhoneInput
                value={currentPhone}
                onChange={(val) => form.setValue('phone', val)}
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <button 
                type="submit" 
                className="flex-[2] flex items-center justify-center gap-2.5 p-4 bg-gradient-to-br from-accent to-accent-hover text-white border-none rounded-lg font-heading text-[0.9rem] font-bold uppercase tracking-widest cursor-pointer transition-all shadow-sm hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-md hover:not(:disabled):brightness-110 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isSaving}
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave className="text-lg" />}
                {isSaving ? t('profile.actions.saving') : t('profile.actions.save')}
              </button>
              <Link 
                to="/profile" 
                className="flex-[1] flex items-center justify-center gap-2.5 p-4 bg-transparent text-textMain border border-borderClient rounded-lg font-heading text-[0.9rem] font-bold uppercase tracking-widest cursor-pointer transition-all decoration-none hover:bg-hover hover:border-textSecondary"
              >
                <FaTimes className="text-lg" /> {t('profile.actions.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}