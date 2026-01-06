import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthForm from '@ui/authForm/AuthForm';
import { supabase } from '../../supabaseClient';
import { validateLoginForm } from './validation';
import useAuthRedirect from '../../hooks/useAuthRedirect'; 

const LoadingScreen = () => (
    <div className="loading-container">
        <div className="spinner">...</div>
    </div>
);

export default function Login() {
  const { t } = useTranslation('auth');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    rememberMe: false
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const isAutoLoginAttempted = useAuthRedirect(); 
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
    setIsLoading(true);
    setErrors({});

    const validationErrors = validateLoginForm(formData, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const { email, password, rememberMe } = formData;
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
      }

      navigate('/', { replace: true });
      
    } catch (error) {
      setErrors({ submit: t('errors.login_failed') });
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

  useEffect(() => {
    if (isAutoLoginAttempted) {
      const rememberMe = localStorage.getItem('rememberMe');
      const savedEmail = localStorage.getItem('userEmail');
      
      if (rememberMe === 'true' && savedEmail) {
        setFormData(prev => ({ 
          ...prev, 
          email: savedEmail,
          rememberMe: true 
        }));
      }
    }
  }, [isAutoLoginAttempted]);

  if (!isAutoLoginAttempted) {
    return <LoadingScreen />;
  }

  return (
    <AuthForm
      mode="login"
      formData={formData}
      errors={errors}
      isLoading={isLoading}
      passwordVisibility={passwordVisibility}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onTogglePassword={handleTogglePassword}
      onSwitchMode={() => navigate('/register')}
      onSocialLogin={socialLogin}
    />
  );
}