import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';
import AuthForm from '@ui/authForm/AuthForm';
import useAuthRedirect from '@hooks/useAuthRedirect';
import { useSocialLogin } from '@hooks/useSocialLogin';
import { validateRegisterForm } from './validation';

const LoadingScreen = () => (
  <div className="loading-container">
    <div className="spinner">...</div>
  </div>
);

export default function Register() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const isAutoLoginAttempted = useAuthRedirect();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const socialLogin = useSocialLogin(setIsLoading, setErrors);

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
      if (error.message && error.message.includes('already registered')) errorMessage = t('errors.user_exists');
      if (error.message && error.message.includes('password')) errorMessage = t('errors.password_short');
      
      setErrors({ submit: errorMessage });
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