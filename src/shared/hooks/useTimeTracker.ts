import { useEffect, useRef } from 'react';
import { useSubscription } from '@subscription/contex/SubscriptionContext';
import { updateUserTime } from '@stats/api/statsApi';

const SEND_INTERVAL = 60000;

export const useTimeTracker = (): void => {
  const { isFree } = useSubscription();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFree) return;

    intervalRef.current = setInterval(() => {
      updateUserTime(SEND_INTERVAL).catch(() => {});
    }, SEND_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isFree]);
};