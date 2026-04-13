import { useState, useEffect } from 'react';

export const useImageToBase64 = (url?: string | null) => {
  const [base64, setBase64] = useState<string | ArrayBuffer | null>(null);

  useEffect(() => {
    if (!url) {
      setBase64(null);
      return;
    }

    let isMounted = true;
    
    const loadBase64Image = async () => {
      try {
        const response = await fetch(url, { mode: 'cors' }).catch(() => null);
        if (response?.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted) setBase64(reader.result);
          };
          reader.readAsDataURL(blob);
        } else if (isMounted) {
          setBase64('error');
        }
      } catch {
        if (isMounted) setBase64('error');
      }
    };

    loadBase64Image();

    return () => { isMounted = false; };
  }, [url]);

  return base64;
};