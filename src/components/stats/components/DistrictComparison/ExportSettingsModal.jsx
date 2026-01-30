import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaFilePdf, FaUpload } from 'react-icons/fa';
import styles from './ExportSettingsModal.module.css';

const STORAGE_KEY = 'geo_analyzer_export_settings';

const ExportSettingsModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation('comparison');
  
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        agencyName: '',
        phone: '',
        website: '',
        comments: '',
        logo: null 
      };
    } catch {
      return { agencyName: '', phone: '', website: '', comments: '', logo: null };
    }
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, comments: '' }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const settingsToSave = { ...formData, comments: '' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
    
    onConfirm(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{t('export_modal.title', 'Налаштування звіту')}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.logoUploadSection}>
            <label htmlFor="logo-upload" className={styles.logoUploadLabel}>
              {formData.logo ? (
                <img src={formData.logo} alt="Logo Preview" className={styles.logoPreview} />
              ) : (
                <>
                  <FaUpload /> {t('export_modal.upload_logo', 'Завантажити логотип')}
                </>
              )}
            </label>
            <input 
              id="logo-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload} 
              className={styles.hiddenInput}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('export_modal.agency_name', 'Назва агентства')}</label>
            <input 
              type="text" 
              name="agencyName" 
              placeholder={t('export_modal.agency_placeholder', 'Наприклад: Best Estate')} 
              value={formData.agencyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('export_modal.comments', 'Коментар клієнту')}</label>
            <textarea 
              name="comments" 
              rows="4"
              placeholder={t('export_modal.comments_placeholder', 'Ваші висновки та рекомендації...')} 
              value={formData.comments}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('export_modal.phone', 'Номер телефону')}</label>
            <input 
              type="text" 
              name="phone" 
              placeholder={t('export_modal.phone_placeholder', '+380 ...')} 
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('export_modal.website', 'Веб-сайт')}</label>
            <input 
              type="text" 
              name="website" 
              placeholder={t('export_modal.website_placeholder', 'www.example.com')} 
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t('actions.cancel', 'Скасувати')}
            </button>
            <button type="submit" className={styles.confirmBtn}>
              <FaFilePdf /> {t('export_modal.export_btn', 'Експорт PDF')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportSettingsModal;