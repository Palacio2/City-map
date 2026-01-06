import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // ❗ Перевірте, чи правильний шлях до клієнта

/**
 * Хук для автоматичної перевірки сесії на сторінках входу/реєстрації.
 * * Логіка:
 * 1. Перевіряє, чи є активна сесія.
 * 2. Якщо Є -> перенаправляє користувача на головну (або на сторінку, з якої він прийшов).
 * 3. Якщо НЕМАЄ -> дозволяє відобразити форму входу/реєстрації.
 * * @returns {boolean} isAutoLoginAttempted - true, коли перевірка завершена і можна показувати форму.
 */
export default function useAuthRedirect() {
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && !error) {
          // Якщо користувач вже залогінений — перекидаємо його
          // "from" — це сторінка, куди юзер хотів потрапити до редіректу на логін
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else {
          // Якщо сесії немає — дозволяємо показати форму
          setIsAutoLoginAttempted(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
        // У разі помилки все одно показуємо форму, щоб користувач міг спробувати увійти
        setIsAutoLoginAttempted(true);
      }
    };

    checkSession();
  }, [navigate, location]);

  return isAutoLoginAttempted;
}