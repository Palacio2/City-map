import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '@ui/authForm/AuthForm';
import { supabase } from '../../supabaseClient';
import { validateRegisterForm } from './validation';

const ERROR_MESSAGES = {
  'User already registered': 'Користувач з таким email вже існує',
  'invalid_credentials': 'Невірні облікові дані',
  'email_not_confirmed': 'Email не підтверджено',
  'weak_password': 'Пароль занадто слабкий'
};

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false); // Додаємо той самий стан
  const navigate = useNavigate();

  // Автоматична перевірка сесії при завантаженні - ТАКА Ж ЯК В LOGIN.JSX
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        navigate('/', { replace: true }); // Перенаправляємо на головну, якщо вже залогінений
      }
      
      setIsAutoLoginAttempted(true);
    };

    checkExistingSession();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateRegisterForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Невірний формат email' });
      return;
    }
    
    if (formData.password.length < 6) {
      setErrors({ password: 'Пароль має містити принаймні 6 символів' });
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
            email: formData.email.trim()
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setErrors({ submit: 'Користувач з таким email вже існує' });
        } else {
          navigate('/register-success', { 
            state: { email: formData.email } 
          });
        }
      } else {
        throw new Error('Не вдалося створити користувача');
      }

    } catch (error) {
      let errorMessage = 'Помилка реєстрації. Спробуйте ще раз.';
      
      if (error.message.includes('already registered') || error.message.includes('user_exists')) {
        errorMessage = 'Користувач з таким email вже існує';
      } else if (error.message.includes('password')) {
        errorMessage = 'Пароль не відповідає вимогам безпеки';
      } else if (error.message.includes('email')) {
        errorMessage = 'Невірний формат email адреси';
      } else if (error.status === 400) {
        errorMessage = 'Невірні дані для реєстрації. Перевірте введені поля.';
      }
      
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
      setErrors({ submit: `Помилка реєстрації через ${provider}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Показуємо loading поки перевіряємо сесію - ТАК Ж ЯК В LOGIN.JSX
  if (!isAutoLoginAttempted) {
    return (
      <div className="loading-container">
        <div className="spinner">Завантаження...</div>
      </div>
    );
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
      onTogglePassword={(field) => setPasswordVisibility(prev => ({
        ...prev,
        [field]: !prev[field]
      }))}
      onSwitchMode={() => navigate('/login')}
      onSocialLogin={socialLogin}
    />
  );
}