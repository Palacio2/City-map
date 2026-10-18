import { useState, useEffect } from 'react';

export const useImageToBase64 = (url?: string | null) => {
  const [base64, setBase64] = useState<string | ArrayBuffer | null>(null);

  useEffect(() => {
    setBase64(null);
    if (!url) {
      setBase64(null);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    
    const loadBase64Image = async () => {
      try {
        const response = await fetch(url, { mode: 'cors', signal }).catch(() => null);
        if (response?.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (!signal.aborted) setBase64(reader.result);
          };
          reader.readAsDataURL(blob);
        } else if (!signal.aborted) {
          setBase64('error');
        }
      } catch {
        if (!signal.aborted) setBase64('error');
      }
    };

    loadBase64Image();

    return () => { controller.abort(); };
  }, [url]);

  return base64;
};
