import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation('db');

  useEffect(() => {
    // Supabase автоматично зчитує токени з URL-рядка при завантаженні цієї сторінки.
    // Нам потрібно лише дочекатися події SIGNED_IN і перенаправити користувача.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // Якщо авторизація успішна, кидаємо на головну (або в профіль)
        navigate('/', { replace: true });
      }
    });

    // Запасний таймер на випадок, якщо щось піде не так, щоб користувач не завис на цій сторінці
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-5">
      <div className="flex flex-col items-center gap-5">
        <div className="w-12 h-12 border-[4px] border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-textMain font-heading font-semibold text-lg tracking-wider animate-pulse m-0">
          {t('auth.login.loading', { defaultValue: 'Авторизація...' })}
        </p>
      </div>
    </div>
  );
}