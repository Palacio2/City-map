import { useEffect, useRef } from 'react';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { updateUserTime } from '@stats/api/statsApi';

const SEND_INTERVAL = 5 * 60 * 1000; // 5 хвилин

export const useTimeTracker = (): void => {
  const { isFree } = useSubscription();
  const lastSentTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFree) return;

    // Оновлюємо час при старті
    lastSentTimeRef.current = Date.now();

    const sendTimeUpdate = (flush = false) => {
      if (!flush && document.visibilityState === 'hidden') return;
      const now = Date.now();
      const timeSpent = now - lastSentTimeRef.current;
      
      // Відправляємо тільки якщо пройшло хоча б 10 секунд
      if (timeSpent > 10000) {
        updateUserTime(timeSpent).catch((err) => { console.warn('[TimeTracker]', err); });
        lastSentTimeRef.current = now;
      }
    };

    // 1. Регулярна відправка кожні 5 хвилин
    intervalRef.current = setInterval(sendTimeUpdate, SEND_INTERVAL);

    // 2. Відправка при закритті вкладки або згортанні браузера
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendTimeUpdate(true);
      } else {
        // Коли юзер повертається у вкладку, скидаємо лічильник
        lastSentTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Auth changes unmount this tree; do not bill old elapsed time to a new session.
    };
  }, [isFree]);
};
