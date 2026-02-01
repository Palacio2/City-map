import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaFilePdf, FaUpload } from 'react-icons/fa';
import styles from './ExportSettingsModal.module.css';

const STORAGE_KEY = 'geo_analyzer_export_settings';

const ExportSettingsModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['comparison', 'common']);
  
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
          <h3>{t('comparison:export_modal.title')}</h3>
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
                  <FaUpload /> {t('comparison:export_modal.upload_logo')}
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
            <label>{t('comparison:export_modal.agency_name')}</label>
            <input 
              type="text" 
              name="agencyName" 
              placeholder={t('comparison:export_modal.agency_placeholder')} 
              value={formData.agencyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('comparison:export_modal.comments')}</label>
            <textarea 
              name="comments" 
              rows="4"
              placeholder={t('comparison:export_modal.comments_placeholder')} 
              value={formData.comments}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('comparison:export_modal.phone')}</label>
            <input 
              type="text" 
              name="phone" 
              placeholder={t('comparison:export_modal.phone_placeholder')} 
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('comparison:export_modal.website')}</label>
            <input 
              type="text" 
              name="website" 
              placeholder={t('comparison:export_modal.website_placeholder', 'www.example.com')} 
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t('common:actions.cancel', 'Скасувати')}
            </button>
            <button type="submit" className={styles.confirmBtn}>
              <FaFilePdf /> {t('comparison:export_modal.export_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportSettingsModal;