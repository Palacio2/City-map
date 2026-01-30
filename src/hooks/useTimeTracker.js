import { useEffect, useRef } from 'react';
import { useSubscription } from '../pages/subscription/SubscriptionContext';
import { updateUserTime } from '../components/api/statsApi';

const SEND_INTERVAL = 60000;
const ACCUMULATE_INTERVAL = 1000;

export const useTimeTracker = () => {
  const { isPremium, isPro } = useSubscription(); 
  const timeAccumulator = useRef(0);

  useEffect(() => {
    const isActiveUser = isPremium || isPro; 
    if (!isActiveUser) return;

    const countTimer = setInterval(() => {
       if (document.visibilityState === 'visible') {
          timeAccumulator.current += 1;
       }
    }, ACCUMULATE_INTERVAL);

    const sendTimer = setInterval(() => {
       if (timeAccumulator.current > 0) {
          updateUserTime(timeAccumulator.current); 
          timeAccumulator.current = 0;
       }
    }, SEND_INTERVAL);

    return () => {
      clearInterval(countTimer);
      clearInterval(sendTimer);
      if (timeAccumulator.current > 0) {
         updateUserTime(timeAccumulator.current);
      }
    };
  }, [isPremium, isPro]);
};