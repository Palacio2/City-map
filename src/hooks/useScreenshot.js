import { useState, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import imageCompression from 'browser-image-compression';

export const useScreenshot = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

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

  const captureScreen = useCallback(async (hideRef) => {
    setIsCapturing(true);
    
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

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
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error("Не вдалося створити Blob");

      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(blob, options);
      
      setScreenshotFile(compressedFile);
      setScreenshotPreview(URL.createObjectURL(compressedFile));
      
    } catch (error) {
      console.error('Помилка генерації скріншота:', error);
      throw error;
    } finally {
      if (hideRef?.current) hideRef.current.style.display = 'flex';
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      setIsCapturing(false);
    }
  }, []);

  return {
    isCapturing,
    screenshotFile,
    screenshotPreview,
    captureScreen,
    removeScreenshot
  };
};