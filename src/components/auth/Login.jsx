import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '@ui/authForm/AuthForm';
import { supabase } from '../../supabaseClient';
import { validateLoginForm } from './validation';
// ❗ НОВИЙ ІМПОРТ ❗
import useAuthRedirect from '../../hooks/useAuthRedirect'; 

const ERROR_MESSAGES = {
  'Invalid login credentials': 'Невірний email або пароль',
  'Email not confirmed': 'Будь ласка, підтвердіть вашу email адресу'
};

// ❗ СПІЛЬНИЙ КОМПОНЕНТ ЗАВАНТАЖЕННЯ (якщо ви його створите) ❗
const LoadingScreen = () => (
    <div className="loading-container">
        <div className="spinner">Завантаження...</div>
    </div>
);

export default function Login() {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    rememberMe: false
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // ❌ ВИДАЛЕНО: const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  
  const navigate = useNavigate();
  // ❌ ВИДАЛЕНО: const location = useLocation();
  // ❌ ВИДАЛЕНО: const from = location.state?.from?.pathname || '/';

  // ❗ ВИКЛИКАЄМО НОВИЙ ХУК ❗
  const isAutoLoginAttempted = useAuthRedirect(); 
  
  // ❌ ВИДАЛЕНО: useEffect для checkExistingSession

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

    const validationErrors = validateLoginForm(formData);
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

      if (error) {
        throw error;
      }
      
      // Зберігання даних (якщо функціонал "запам'ятати мене" потрібен)
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
      }

      navigate('/', { replace: true }); // Перенаправлення після успішного входу
      
    } catch (error) {
      const errorMessage = ERROR_MESSAGES[error.message] || 'Помилка входу. Спробуйте пізніше.';
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
      setErrors({ submit: `Помилка входу через ${provider}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Завантажуємо збережені дані при монтуванні (залежність від нового хука)
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

  // ❗ ВИКОРИСТАННЯ НОВОГО ХУКА ❗
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