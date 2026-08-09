import { useState, useEffect, useRef } from 'react';
import type { FormEvent, RefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import { useAuth } from '@auth/context/AuthContext';
import { contactsAPI } from '@pages/contacts/api/contactsAPI';
import { useTranslation } from 'react-i18next';
import { useUserConsent } from '@hooks/useUserConsent';
import { useScreenshot } from '@hooks/useScreenshot';
import type { FeedbackFormState, FeedbackPayload, FeedbackType } from '../types';

export const useFeedbackWidget = () => {
  const { t } = useTranslation('db');
  const { session } = useAuth();
  const { showRodoModal } = useUserConsent();
  const { isCapturing, screenshotFile, screenshotPreview, captureScreen, removeScreenshot } = useScreenshot();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const widgetRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FeedbackFormState>({
    type: 'data_error',
    message: ''
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      let uploadedScreenshotUrl = null;
      if (screenshotFile) {
        const fileName = `feedback_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('feedback_images')
          .upload(fileName, screenshotFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('feedback_images')
            .getPublicUrl(fileName);
          uploadedScreenshotUrl = publicUrlData.publicUrl;
        }
      }

      const payload: FeedbackPayload = {
        email: session?.user?.email,
        message: formData.message,
        type: formData.type,
        user_id: session?.user?.id,
        page_url: globalThis.location.href,
        screenshot_url: uploadedScreenshotUrl,
        screen_size: `${globalThis.innerWidth}x${globalThis.innerHeight}`,
        browser_info: navigator.userAgent
      };

      return contactsAPI.submitFeedback(payload);
    },
    onSuccess: () => {
      setSent(true);
      setErrorMsg('');
      setTimeout(() => {
        closeWithAnimation();
        setTimeout(() => {
          setSent(false);
          setFormData({ type: 'data_error', message: '' });
          removeScreenshot();
        }, 300);
      }, 3000);
    },
    onError: () => {
      setErrorMsg(t('feedback.errors.submit_failed'));
    }
  });

  useEffect(() => {
    if (showRodoModal) return;
    const hintShown = sessionStorage.getItem('feedback_hint_shown');
    if (!hintShown) {
      const timer = setTimeout(() => {
        setShowHint(true);
        sessionStorage.setItem('feedback_hint_shown', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showRodoModal]);

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setShowHint(false);
      setErrorMsg('');
    }, 250);
  };

  const toggleModal = () => {
    if (isOpen) {
      closeWithAnimation();
    } else {
      setIsOpen(true);
      setShowHint(false);
    }
  };

  const handleCapture = async () => {
    try {
      setErrorMsg('');
      await captureScreen(widgetRef as unknown as RefObject<HTMLElement>);
    } catch {
      setErrorMsg(t('feedback.errors.screenshot_failed'));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.message.trim() && !screenshotFile) {
      setErrorMsg(t('feedback.errors.description_required'));
      return;
    }
    setErrorMsg('');
    submitMutation.mutate();
  };

  const updateType = (type: FeedbackType) => {
    setFormData(prev => ({ ...prev, type }));
    setErrorMsg('');
  };

  const updateMessage = (message: string) => {
    setFormData(prev => ({ ...prev, message }));
    setErrorMsg('');
  };

  return {
    session,
    showRodoModal,
    isOpen,
    isClosing,
    showHint,
    sent,
    errorMsg,
    widgetRef,
    formData,
    isCapturing,
    screenshotPreview,
    isPending: submitMutation.isPending,
    setShowHint,
    toggleModal,
    handleCapture,
    handleSubmit,
    removeScreenshot,
    updateType,
    updateMessage,
    t
  };
};