// useAuthRedirect.js (Створіть цей файл у відповідній директорії)
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// ❗ Вкажіть правильний шлях до вашого клієнта Supabase ❗
import { supabase } from '../supabaseClient'; 

/**
 * Хук для перевірки поточної сесії та перенаправлення авторизованого користувача.
 * @returns {boolean} - true, якщо спроба автоматичного входу завершена (можна показувати форму).
 */
export default function useAuthRedirect() {
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Отримуємо початковий шлях для перенаправлення
  const from = location.state?.from?.pathname || '/'; 

  useEffect(() => {
    const checkExistingSession = async () => {
      // Одноразова перевірка сесії
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        // Якщо сесія є, перенаправляємо
        navigate(from, { replace: true });
      } else {
        // Якщо сесії немає, дозволяємо відображення форми
        setIsAutoLoginAttempted(true);
      }
    };
    
    checkExistingSession();
  }, [navigate, from]);

  return isAutoLoginAttempted; 
}