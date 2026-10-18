import { useState, useCallback, useEffect, useRef, RefObject } from 'react';
import html2canvas from 'html2canvas-pro';
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
  const mounted = useRef(false);
  const capturing = useRef(false);
  const generation = useRef(0);
  const previewUrl = useRef<string | null>(null);
  const invalidateCapture = useCallback(() => { generation.current++; }, []);

  const removeScreenshot = useCallback(() => {
    invalidateCapture();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setScreenshotFile(null);
    setScreenshotPreview(null);
  }, [invalidateCapture]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateCapture();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    };
  }, [invalidateCapture]);

  const captureScreen = useCallback(async (hideRef?: RefObject<HTMLElement>) => {
    if (!mounted.current || capturing.current) return;
    capturing.current = true;
    const requestGeneration = generation.current;
    const isCurrent = () => mounted.current && generation.current === requestGeneration;
    const hiddenElement = hideRef?.current;
    setIsCapturing(true);

    try {
      const targetElement = document.body;
      const theme = document.documentElement.getAttribute('data-theme');
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-body') || (theme === 'dark' ? '#111318' : '#f4f5f7');

      const canvas = await html2canvas(targetElement, { 
        useCORS: true, 
        allowTaint: false,
        ignoreElements: element => element === hiddenElement,
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
      if (!isCurrent()) return;
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error(t('feedback.errors.blob_error'));

      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(blob as File, options);
      if (!isCurrent()) return;
      
      const nextPreview = URL.createObjectURL(compressedFile);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = nextPreview;
      setScreenshotFile(compressedFile);
      setScreenshotPreview(nextPreview);
      
    } catch (error) {
      if (!isCurrent()) return;
      console.error(t('feedback.errors.screenshot_log'), error);
      throw error;
    } finally {
      capturing.current = false;
      if (mounted.current) setIsCapturing(false);
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
