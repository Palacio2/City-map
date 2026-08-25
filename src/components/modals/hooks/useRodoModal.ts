import { useState, useCallback } from 'react';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';

export const useRodoModal = (onAccept: () => Promise<void> | void) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useBodyScrollLock(true);

  const handleAccept = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onAccept();
    } catch (err) { console.error('Error caught in empty catch block:', err); } finally {
      setIsProcessing(false);
    }
  }, [onAccept]);

  return { isProcessing, handleAccept };
};