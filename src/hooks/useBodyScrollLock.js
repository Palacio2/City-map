import { useEffect } from 'react';

export const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    // Запам'ятовуємо оригінальний стиль (щоб не зламати інші скрипти)
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Cleanup функція, яка повертає все на місце при розмонтуванні або зміні isLocked
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
};