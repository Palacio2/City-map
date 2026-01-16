import { useEffect, useRef } from 'react';
import { useSubscription } from '../pages/subscription/SubscriptionContext';
import { updateUserTime } from '../components/api/statsApi';

const INTERVAL_MS = 30000; // 30 секунд
const SECONDS_TO_ADD = 30;

export const useTimeTracker = () => {
  // Трекаємо час тільки для авторизованих (преміум або ні - залежить від вашої логіки, тут беремо всіх хто має підписку/акаунт)
  const { isPremium, isPro } = useSubscription(); 
  const intervalRef = useRef(null);

  useEffect(() => {
    // Якщо треба трекати всіх авторизованих, можна перевіряти session з AuthContext замість isPremium
    const isActiveUser = isPremium || isPro; 
    
    if (!isActiveUser) return;

    const track = () => {
      if (document.visibilityState === 'visible') {
        updateUserTime(SECONDS_TO_ADD);
      }
    };

    intervalRef.current = setInterval(track, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPremium, isPro]);
};