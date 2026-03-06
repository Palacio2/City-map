import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineLightBulb, HiX, HiCamera, HiTrash, HiOutlineGift } from 'react-icons/hi';
import { supabase } from '@supabaseClient';
import { useAuth } from '@ui/authForm/AuthContext';
import { contactsAPI } from '@api/contactsAPI';
import html2canvas from 'html2canvas';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';
import { useUserConsent } from '@hooks/useUserConsent';
import styles from './FeedbackWidget.module.css';

export default function FeedbackWidget() {
  const { t } = useTranslation('feedback');
  const { session } = useAuth();
  const { showRodoModal } = useUserConsent();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  
  const widgetRef = useRef(null);

  const [formData, setFormData] = useState({
    type: 'data_error',
    message: ''
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

  const toggleModal = () => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        setShowHint(false);
      }, 300);
    } else {
      setIsOpen(true);
      setShowHint(false);
    }
  };

  const captureScreen = async () => {
    setIsCapturing(true);
    
    if (widgetRef.current) widgetRef.current.style.display = 'none';

    try {
      const targetElement = document.querySelector('main') || document.getElementById('root') || document.body;
      const theme = document.documentElement.getAttribute('data-theme');
      const bgColor = theme === 'dark' ? '#111318' : '#f4f5f7';

      const canvas = await html2canvas(targetElement, { 
        useCORS: true, 
        allowTaint: true,
        logging: false,
        scale: 1,
        backgroundColor: bgColor,
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(blob, options);
        setScreenshotFile(compressedFile);
        setScreenshotPreview(URL.createObjectURL(compressedFile));
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error(error);
      alert(t('screenshot_error', 'Не вдалося зробити скріншот.'));
    } finally {
      if (widgetRef.current) widgetRef.current.style.display = 'flex';
      setIsCapturing(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim() && !screenshotFile) {
        alert(t('need_desc_or_screen', 'Додайте опис проблеми або прикріпіть скріншот'));
        return;
    }

    setLoading(true);
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

    try {
      await contactsAPI.submitFeedback(payload);
      setSent(true);
      setTimeout(() => {
        toggleModal();
        setTimeout(() => {
          setSent(false);
          setFormData({ type: 'data_error', message: '' });
          removeScreenshot();
        }, 300);
      }, 4000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!session || showRodoModal) return null;

  return (
    <div className={styles.widgetWrapper} ref={widgetRef}>
      {showHint && !isOpen && !isClosing && (
        <div className={styles.hint}>
          <div className={styles.hintIcon}><HiOutlineGift /></div>
          <div className={styles.hintText}>
            <strong>{t('hint_title')}</strong>
            <span>{t('hint_subtitle')}</span>
          </div>
          <button className={styles.closeHint} onClick={() => setShowHint(false)}><HiX /></button>
        </div>
      )}

      <button 
        className={`${styles.mainBtn} ${isOpen || isClosing ? styles.active : ''}`}
        onClick={toggleModal}
      >
        {isOpen || isClosing ? <HiX /> : <HiOutlineLightBulb />}
      </button>

      {(isOpen || isClosing) && (
        <div className={`${styles.modal} ${isClosing ? styles.modalClosing : ''}`}>
          <div className={styles.modalHeader}>
            <h3>{t('header_title')}</h3>
            <p>{t('header_subtitle')}</p>
          </div>

          {sent ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✨</div>
              <h4>{t('success_title')}</h4>
              <p>{t('success_desc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.inputGroup}>
                <label>{t('type_label')}</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className={styles.select}
                >
                  <option value="critical">{t('type_critical')}</option>
                  <option value="data_error">{t('type_data')}</option>
                  <option value="ui_bug">{t('type_ui')}</option>
                  <option value="suggestion">{t('type_suggestion')}</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>{t('desc_label')}</label>
                <textarea 
                  placeholder={t('desc_placeholder')}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <div className={styles.screenshotSection}>
                {!screenshotPreview ? (
                  <button type="button" onClick={captureScreen} disabled={isCapturing} className={styles.captureBtn}>
                    <HiCamera size={20} />
                    {isCapturing ? t('capturing_btn') : t('capture_btn')}
                  </button>
                ) : (
                  <div className={styles.previewContainer}>
                    <img src={screenshotPreview} alt="Screenshot" className={styles.previewImage} />
                    <button type="button" onClick={removeScreenshot} className={styles.removeBtn}>
                      <HiTrash size={16} /> {t('remove_btn')}
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? t('submitting_btn') : t('submit_btn')}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}