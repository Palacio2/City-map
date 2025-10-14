import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '@ui/authForm/AuthForm';
import { supabase } from '../../supabaseClient';
import { validateLoginForm } from './validation';

const ERROR_MESSAGES = {
  'Invalid login credentials': 'Невірний email або пароль',
  'Email not confirmed': 'Будь ласка, підтвердіть вашу email адресу'
};

export default function Login() {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    rememberMe: false
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Автоматична перевірка сесії при завантаженні
  useEffect(() => {
    const checkExistingSession = async () => {
      const rememberMe = localStorage.getItem('rememberMe');
      
      if (rememberMe === 'true') {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          navigate(from, { replace: true });
        }
      }
      
      setIsAutoLoginAttempted(true);
    };

    checkExistingSession();
  }, [navigate, from]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateLoginForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });
      
      if (error) throw error;

      // Обробка "Запам'ятати мене"
      if (formData.rememberMe) {
        // Зберігаємо в localStorage
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', formData.email);
        
        // Оновлюємо срок дії сесії (опційно)
        const { error: updateError } = await supabase.auth.updateUser({
          data: { remember_me: true }
        });
        
        if (updateError) {
          console.warn('Не вдалося оновити налаштування сесії:', updateError);
        }
      } else {
        // Видаляємо з localStorage
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
        
        // Встановлюємо коротший срок дії сесії
        const { error: updateError } = await supabase.auth.updateUser({
          data: { remember_me: false }
        });
        
        if (updateError) {
          console.warn('Не вдалося оновити налаштування сесії:', updateError);
        }
      }
      
      console.log('Успішний вхід, перенаправлення...');
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Помилка входу:', error);
      setErrors({ 
        submit: ERROR_MESSAGES[error.message] || 'Помилка входу. Спробуйте ще раз.' 
      });
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

  // Завантажуємо збережені дані при монтуванні
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

  // Показуємо loading поки перевіряємо сесію
  if (!isAutoLoginAttempted) {
    return (
      <div className="loading-container">
        <div className="spinner">Завантаження...</div>
      </div>
    );
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
      onTogglePassword={(field) => setPasswordVisibility(prev => ({
        ...prev,
        [field]: !prev[field]
      }))}
      onSwitchMode={() => navigate('/register')}
      onSocialLogin={socialLogin}
    />
  );
}