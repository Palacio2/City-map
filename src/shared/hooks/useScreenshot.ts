import { useState, useCallback, useEffect, RefObject } from 'react';
import html2canvas from 'html2canvas';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';

export interface UseScreenshotReturn {
  isCapturing: boolean;
  screenshotFile: File | Blob | null;
  screenshotPreview: string | null;
  captureScreen: (hideRef?: RefObject<HTMLElement>) => Promise<void>;
  removeScreenshot: () => void;
}

export const useScreenshot = (): UseScreenshotReturn => {
  const { t } = useTranslation('db');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [screenshotFile, setScreenshotFile] = useState<File | Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const removeScreenshot = useCallback(() => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshotFile(null);
    setScreenshotPreview(null);
  }, [screenshotPreview]);

  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [screenshotPreview]);

  const captureScreen = useCallback(async (hideRef?: RefObject<HTMLElement>) => {
    setIsCapturing(true);
    
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const originalDisplay = hideRef?.current ? hideRef.current.style.display : null;
    if (hideRef?.current) hideRef.current.style.display = 'none';

    try {
      const targetElement = document.body;
      const theme = document.documentElement.getAttribute('data-theme');
      const bgColor = theme === 'dark' ? '#111318' : '#f4f5f7';

      const canvas = await html2canvas(targetElement, { 
        useCORS: true, 
        allowTaint: true,
        logging: false,
        scale: 1,
        backgroundColor: bgColor,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error(t('feedback.errors.blob_error'));

      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(blob as File, options);
      
      setScreenshotFile(compressedFile);
      setScreenshotPreview(URL.createObjectURL(compressedFile));
      
    } catch (error) {
      console.error(t('feedback.errors.screenshot_log'), error);
      throw error;
    } finally {
      if (hideRef?.current && originalDisplay !== null) {
        hideRef.current.style.display = originalDisplay;
      }
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      setIsCapturing(false);
    }
  }, [t]);

  return {
    isCapturing,
    screenshotFile,
    screenshotPreview,
    captureScreen,
    removeScreenshot
  };
};