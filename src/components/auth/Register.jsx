import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';
import AuthForm from '@/components/auth/AuthForm';
import useAuthRedirect from '@hooks/useAuthRedirect';
import { useSocialLogin } from '@hooks/useSocialLogin';
import { validateRegisterForm, sanitizeName, sanitizePassword } from './validation';

const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-[100dvh] bg-body p-5">
    <div className="w-10 h-10 border-[3px] border-accent/30 border-t-accent rounded-full animate-spin"></div>
  </div>
);

export default function Register() {
  const { t } = useTranslation('db'); // Змінено на 'db'
  const navigate = useNavigate();
  const isAutoLoginAttempted = useAuthRedirect();
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const socialLogin = useSocialLogin(setIsLoading, setErrors);

  const handleChange = useCallback((e) => {
    let { name, value } = e.target;

    if (name === 'name') value = sanitizeName(value);
    if (name === 'password' || name === 'confirmPassword') value = sanitizePassword(value);

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => (prev[name] ? { ...prev, [name]: '' } : prev));
  }, []);

  const handleTogglePassword = useCallback((fieldName) => {
    setPasswordVisibility(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const formToSubmit = {
      ...formData,
      email: formData.email.trim()
    };

    const formErrors = validateRegisterForm(formToSubmit, t);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formToSubmit.email,
        password: formToSubmit.password,
        options: {
          data: { full_name: formToSubmit.name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setErrors({ submit: t('auth.errors.user_exists') });
      } else {
        navigate('/register-success', { state: { email: formToSubmit.email } });
      }

    } catch (error) {
      let errorMessage = t('auth.errors.generic');
      const msg = error.message?.toLowerCase() || '';
      
      if (msg.includes('already registered')) errorMessage = t('auth.errors.user_exists');
      else if (msg.includes('password')) errorMessage = t('auth.errors.password_short');
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }, [formData, navigate, t]);

  if (!isAutoLoginAttempted) {
    return <LoadingScreen />;
  }

  return (
    <AuthForm
      mode="register"
      formData={formData}
      errors={errors}
      isLoading={isLoading}
      passwordVisibility={passwordVisibility}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onTogglePassword={handleTogglePassword}
      onSwitchMode={() => navigate('/login')}
      onSocialLogin={socialLogin}
    />
  );
}