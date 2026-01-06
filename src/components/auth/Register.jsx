import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthForm from '@ui/authForm/AuthForm';
import { supabase } from '../../supabaseClient';
import { validateRegisterForm } from './validation';
import useAuthRedirect from '../../hooks/useAuthRedirect';

const LoadingScreen = () => (
  <div className="loading-container">
    <div className="spinner">...</div>
  </div>
);

export default function Register() {
  const { t } = useTranslation('auth');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const isAutoLoginAttempted = useAuthRedirect();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTogglePassword = (fieldName) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateRegisterForm(formData, t);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setErrors({ submit: t('errors.user_exists') });
      } else {
        navigate('/register-success', { state: { email: formData.email } });
      }

    } catch (error) {
      let errorMessage = t('errors.generic');
      if (error.message.includes('already registered')) errorMessage = t('errors.user_exists');
      if (error.message.includes('password')) errorMessage = t('errors.password_short');
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false
        }
      });
      if (error) throw error;
    } catch (error) {
      setErrors({ submit: t('errors.generic') });
    } finally {
      setIsLoading(false);
    }
  };

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