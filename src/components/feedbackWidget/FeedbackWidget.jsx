import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineLightBulb, HiX, HiCamera, HiTrash, HiOutlineGift } from 'react-icons/hi';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import { useAuth } from '@/components/auth/AuthContext';
import { contactsAPI } from '@api/contactsAPI';
import { useTranslation } from 'react-i18next';
import { useUserConsent } from '@hooks/useUserConsent';
import { useScreenshot } from '@hooks/useScreenshot';

export default function FeedbackWidget() {
  const { t } = useTranslation('db');
  const { session } = useAuth();
  const { showRodoModal } = useUserConsent();
  const { isCapturing, screenshotFile, screenshotPreview, captureScreen, removeScreenshot } = useScreenshot();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const widgetRef = useRef(null);

  const [formData, setFormData] = useState({
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

      const payload = {
        email: session?.user?.email,
        message: formData.message,
        type: formData.type,
        user_id: session?.user?.id,
        page_url: window.location.href,
        screenshot_url: uploadedScreenshotUrl,
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
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
      setErrorMsg(t('common.error', { defaultValue: 'Помилка відправки' }));
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
      await captureScreen(widgetRef);
    } catch (error) {
      setErrorMsg(t('feedback.screenshot_error', { defaultValue: 'Помилка скріншоту' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.message.trim() && !screenshotFile) {
      setErrorMsg(t('feedback.need_desc_or_screen', { defaultValue: 'Додайте опис або скріншот' }));
      return;
    }
    setErrorMsg('');
    submitMutation.mutate();
  };

  if (!session || showRodoModal) return null;

  return (
    <div 
      ref={widgetRef}
      className="fixed z-[1000] flex flex-col items-end gap-4 pointer-events-none"
      style={{
        bottom: 'max(30px, env(safe-area-inset-bottom))',
        right: 'max(30px, env(safe-area-inset-right))'
      }}
    >
      {showHint && !isOpen && !isClosing && (
        <div className="ui-glass-panel pointer-events-auto p-4 flex items-start gap-3 max-w-[300px] animate-slideUp relative pr-10 shadow-xl border-accent/30">
          <HiOutlineGift className="text-3xl text-accent shrink-0 animate-pulse" />
          <div className="flex flex-col gap-1 text-sm text-textSecondary">
            <strong className="text-textMain font-heading">{t('feedback.hint_title')}</strong>
            <span className="leading-tight">{t('feedback.hint_subtitle')}</span>
          </div>
          <button 
            className="absolute top-3 right-3 text-textSecondary hover:text-textMain transition-colors"
            onClick={() => setShowHint(false)}
          >
            <HiX />
          </button>
        </div>
      )}

      {(isOpen || isClosing) && (
        <div className={`
          ui-glass-panel pointer-events-auto w-[min(calc(100vw-40px),380px)] overflow-hidden shadow-2xl origin-bottom-right transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isClosing ? 'opacity-0 scale-90 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}
        `}>
          <button 
            onClick={toggleModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface border border-borderClient flex items-center justify-center text-textSecondary hover:text-danger hover:border-danger transition-colors z-10 shadow-sm"
          >
            <HiX className="text-lg" />
          </button>

          <div className="bg-surface p-6 pb-2 border-b border-borderClient pr-14">
            <h3 className="font-heading font-bold text-lg text-textMain mb-1">{t('feedback.header_title')}</h3>
            <p className="text-sm text-textSecondary leading-snug">{t('feedback.header_subtitle')}</p>
          </div>

          {sent ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="text-5xl animate-bounce">✨</div>
              <h4 className="font-bold text-success text-lg">{t('feedback.success_title')}</h4>
              <p className="text-sm text-textSecondary">{t('feedback.success_desc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5" noValidate>
              
              {errorMsg && (
                <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-textMain">{t('feedback.type_label')}</label>
                <select 
                  value={formData.type} 
                  onChange={e => {
                    setFormData({...formData, type: e.target.value});
                    setErrorMsg('');
                  }}
                  className="ui-input py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                  disabled={submitMutation.isPending}
                >
                  <option value="critical">{t('feedback.type_critical')}</option>
                  <option value="data_error">{t('feedback.type_data')}</option>
                  <option value="ui_bug">{t('feedback.type_ui')}</option>
                  <option value="suggestion">{t('feedback.type_suggestion')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-textMain">{t('feedback.desc_label')}</label>
                <textarea 
                  placeholder={t('feedback.desc_placeholder')}
                  value={formData.message}
                  onChange={e => {
                    setFormData({...formData, message: e.target.value});
                    setErrorMsg('');
                  }}
                  className="ui-input py-3 text-sm h-[120px] resize-none focus:ring-2 focus:ring-accent/20 outline-none"
                  disabled={submitMutation.isPending}
                />
              </div>

              <div className="w-full">
                {!screenshotPreview ? (
                  <button 
                    type="button" 
                    onClick={handleCapture} 
                    disabled={isCapturing || submitMutation.isPending} 
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-borderClient text-textSecondary font-medium hover:border-accent hover:text-accent hover:bg-accent/5 transition-all disabled:opacity-50"
                  >
                    <HiCamera className="text-xl" />
                    {isCapturing ? t('feedback.capturing_btn') : t('feedback.capture_btn')}
                  </button>
                ) : (
                  <div className="relative w-full h-[140px] rounded-xl overflow-hidden border border-borderClient shadow-sm group">
                    <img src={screenshotPreview} alt="Screenshot" className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                    <button 
                      type="button" 
                      onClick={removeScreenshot} 
                      disabled={submitMutation.isPending}
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      <HiTrash size={16} /> {t('feedback.remove_btn')}
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={submitMutation.isPending} 
                className="w-full bg-[#0f1014] text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-accent hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md disabled:opacity-70 disabled:hover:transform-none flex items-center justify-center"
              >
                {submitMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></div>
                ) : (
                  t('feedback.submit_btn')
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {!isOpen && !isClosing && (
        <button 
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all duration-300 shadow-xl border border-white/10 shrink-0 bg-textMain text-surface hover:-translate-y-1 hover:scale-105 hover:bg-accent hover:shadow-accent/30 pointer-events-auto active:scale-90"
          onClick={toggleModal}
        >
          <HiOutlineLightBulb />
        </button>
      )}
    </div>
  );
}