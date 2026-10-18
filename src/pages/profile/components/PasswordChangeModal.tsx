import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaLock, FaSave, FaShieldAlt, FaChevronDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { usePasswordChange } from '../hooks/usePasswordChange';
import type { PasswordChangeModalProps } from '../types';

export const PasswordChangeModal = ({ isOpen, onClose }: PasswordChangeModalProps) => {
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

  const { 
    form, 
    onSubmit, 
    statusMessage, 
    isSaving, 
    isTipsOpen, 
    setIsTipsOpen, 
    showPasswords, 
    togglePasswordVisibility, 
    parsedTips 
  } = usePasswordChange(handleClose);

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
              {t('profile.password_page.title')}
            </div>
          </div>

          <div className="relative z-10 mb-6 text-left px-2 sm:px-0">
            <h2 className="text-lg font-bold font-sans text-textMain mb-1">
              {t('profile.password_page.form_title')}
            </h2>
            <p className="text-textSecondary text-[0.9rem]">
              {t('profile.password_page.form_subtitle')}
            </p>
          </div>

          <form onSubmit={(e) => { onSubmit(e); }} className="flex flex-col gap-5 sm:gap-6 relative z-10" noValidate>
            <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} />
            
            {statusMessage.text && (
              <div 
                className={`flex items-center gap-3 p-4 rounded-2xl font-medium text-[0.9rem] animate-slideDown ${statusMessage.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`} 
                role="alert"
              >
                {statusMessage.type === 'success' ? <FaCheckCircle className="shrink-0 text-lg" /> : <FaTimesCircle className="shrink-0 text-lg" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-sans ml-1">
                <FaLock className="text-primary opacity-80 text-[0.9rem]" />
                {t('profile.password_page.new_pass')}
              </label>
              <div className="relative flex items-center w-full">
                <input
                  id="newPassword" 
                  type={showPasswords.new ? "text" : "password"}
                  className={`w-full p-4 pr-12 bg-black/5 dark:bg-black/20 border border-transparent rounded-xl text-textMain font-sans text-[1rem] transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed ${form.formState.errors.newPassword ? 'border-danger focus:border-danger' : 'focus:border-primary hover:border-border'}`}
                  placeholder={t('profile.password_page.placeholders.new')}
                  disabled={isSaving} 
                  autoComplete="new-password"
                  {...form.register('newPassword')}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-textSecondary cursor-pointer p-2 flex items-center justify-center transition-all hover:text-textMain hover:scale-110" 
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
              {form.formState.errors.newPassword && (
                <span className="text-danger text-[0.85rem] font-medium ml-1">{form.formState.errors.newPassword.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-sans ml-1">
                <FaLock className="text-primary opacity-80 text-[0.9rem]" />
                {t('profile.password_page.confirm_pass')}
              </label>
              <div className="relative flex items-center w-full">
                <input
                  id="confirmPassword" 
                  type={showPasswords.confirm ? "text" : "password"}
                  className={`w-full p-4 pr-12 bg-black/5 dark:bg-black/20 border border-transparent rounded-xl text-textMain font-sans text-[1rem] transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed ${form.formState.errors.confirmPassword ? 'border-danger focus:border-danger' : 'focus:border-primary hover:border-border'}`}
                  placeholder={t('profile.password_page.placeholders.confirm')}
                  disabled={isSaving} 
                  autoComplete="new-password"
                  {...form.register('confirmPassword')}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-textSecondary cursor-pointer p-2 flex items-center justify-center transition-all hover:text-textMain hover:scale-110" 
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <span className="text-danger text-[0.85rem] font-medium ml-1">{form.formState.errors.confirmPassword.message}</span>
              )}
            </div>

            <div className="mt-6 sm:mt-8">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 p-4 sm:p-5 bg-primary text-white border border-transparent rounded-xl font-sans text-[1rem] font-bold transition-all shadow-xs hover:not-disabled:brightness-110 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-md active:not-disabled:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed" 
                disabled={isSaving}
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave />}
                {isSaving ? t('profile.actions.saving') : t('profile.actions.change_password')}
              </button>
            </div>

            <div className="mt-4 bg-black/5 dark:bg-black/20 rounded-xl border border-transparent overflow-hidden transition-colors hover:border-primary/20">
              <button 
                type="button" 
                className={`flex items-center justify-between p-5 cursor-pointer w-full bg-transparent border-b border-transparent text-textMain transition-all hover:bg-black/5 ${isTipsOpen ? 'border-border' : ''}`} 
                onClick={() => setIsTipsOpen(!isTipsOpen)}
              >
                <span className="flex items-center gap-2.5 font-semibold font-sans text-[0.9rem]">
                  <FaShieldAlt className="text-success text-lg"/>
                  {t('profile.password_page.tips_title')}
                </span>
                <FaChevronDown className={`text-textSecondary transition-transform duration-[400ms] ${isTipsOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>
              
              <div className={`grid transition-all duration-[400ms] ${isTipsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className={`p-5 pt-2 transition-all duration-300 delay-100 ${isTipsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    <ul className="m-0 pl-0 list-none flex flex-col gap-3">
                      {parsedTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-[0.9rem] text-textSecondary leading-relaxed">
                          <span className="text-primary font-bold mt-0.5">•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
          </form>
        </div>
      </div>
    </>
  );
}
