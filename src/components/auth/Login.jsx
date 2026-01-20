import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';
import AuthForm from '@ui/authForm/AuthForm';
import useAuthRedirect from '@hooks/useAuthRedirect'; 
import { useSocialLogin } from '@hooks/useSocialLogin';
import { validateLoginForm } from './validation';

const LoadingScreen = () => (
  <div className="loading-container">
    <div className="spinner">...</div>
  </div>
);

export default function Login() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const isAutoLoginAttempted = useAuthRedirect();
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    rememberMe: false
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const socialLogin = useSocialLogin(setIsLoading, setErrors);
  
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
      const { error } = await supabase.auth.signInWithPassword({ 
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