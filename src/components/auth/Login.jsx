import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';
import AuthForm from '@ui/authForm/AuthForm';
import useAuthRedirect from '@hooks/useAuthRedirect'; 
import { useSocialLogin } from '@hooks/useSocialLogin';
import { validateLoginForm, sanitizePassword } from './validation';
import styles from '@ui/authForm/AuthForm.module.css';

const LoadingScreen = () => (
  <div className={styles.container}>
    <div className={styles.spinner} style={{ borderTopColor: 'var(--accent-color)', width: '40px', height: '40px' }}></div>
  </div>
);

export default function Login() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const isAutoLoginAttempted = useAuthRedirect();
  
  const [formData, setFormData] = useState(() => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('userEmail') || '';
    return { 
      email: rememberMe ? savedEmail : '', 
      password: '',
      rememberMe: rememberMe
    };
  });

  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const socialLogin = useSocialLogin(setIsLoading, setErrors);
  
  const handleChange = useCallback((e) => {
    let { name, value, type, checked } = e.target;
    
    if (type !== 'checkbox') {
        if (name === 'password') value = sanitizePassword(value);
    }

    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    setErrors(prev => (prev[name] ? { ...prev, [name]: '' } : prev));
  }, []);

  const handleTogglePassword = useCallback((fieldName) => {
    setPasswordVisibility(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formToSubmit = {
      ...formData,
      email: formData.email.trim()
    };

    const validationErrors = validateLoginForm(formToSubmit, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const { email, password, rememberMe } = formToSubmit;
      const { error } = await supabase.auth.signInWithPassword({ email, password });

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
  }, [formData, navigate, t]);

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