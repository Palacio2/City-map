import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaFilePdf, FaCloudUploadAlt } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import styles from './ExportSettingsModal.module.css';

const STORAGE_KEY = 'geo_analyzer_export_settings';

const ExportSettingsModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['comparison', 'common']);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
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
      
      const fetchUserData = async () => {
        setIsLoadingProfile(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const meta = user.user_metadata || {};
            
            const updateStateWithData = (logoData) => {
              setFormData(prev => ({
                ...prev,
                agencyName: prev.agencyName || meta.full_name || '',
                phone: prev.phone || meta.phone || '',
                logo: prev.logo || logoData || null
              }));
              setIsLoadingProfile(false);
            };

            if (meta.avatar_url) {
              if (meta.avatar_url.startsWith('http')) {
                updateStateWithData(meta.avatar_url);
              } else {
                const { data: blob } = await supabase.storage
                  .from('avatars')
                  .download(meta.avatar_url);
                  
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateStateWithData(reader.result);
                  };
                  reader.readAsDataURL(blob);
                } else {
                  updateStateWithData(null);
                }
              }
            } else {
              updateStateWithData(null);
            }
          } else {
            setIsLoadingProfile(false);
          }
        } catch (error) {
          setIsLoadingProfile(false);
        }
      };

      fetchUserData();
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
          <div>
            <h3>{t('export_modal.title')}</h3>
            <p className={styles.subtitle}>{t('export_modal.subtitle', 'Заповніть дані для вашого PDF-звіту')}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.logoUploadSection}>
            <label htmlFor="logo-upload" className={`${styles.logoUploadLabel} ${formData.logo ? styles.hasImage : ''}`}>
              {formData.logo ? (
                <div className={styles.imagePreviewWrapper}>
                  <img src={formData.logo} alt="Logo Preview" className={styles.logoPreview} />
                  <div className={styles.changeImageOverlay}>
                    <span>{t('export_modal.change_logo', 'Змінити')}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <FaCloudUploadAlt className={styles.uploadIcon} />
                  <span className={styles.uploadTitle}>{t('export_modal.upload_logo')}</span>
                  <span className={styles.uploadHint}>PNG, JPG до 2MB</span>
                </div>
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
            <label>{t('export_modal.agency_name')}</label>
            <input 
              type="text" 
              name="agencyName" 
              placeholder={t('export_modal.agency_placeholder')} 
              value={formData.agencyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('export_modal.comments')}</label>
            <textarea 
              name="comments" 
              rows="3"
              placeholder={t('export_modal.comments_placeholder')} 
              value={formData.comments}
              onChange={handleChange}
            />
          </div>

          <div className={styles.rowInputs}>
            <div className={styles.inputGroup}>
              <label>{t('export_modal.phone')}</label>
              <input 
                type="text" 
                name="phone" 
                placeholder={t('export_modal.phone_placeholder')} 
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>{t('export_modal.website')}</label>
              <input 
                type="text" 
                name="website" 
                placeholder={t('export_modal.website_placeholder')} 
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t('common:actions.cancel')}
            </button>
            <button type="submit" className={styles.confirmBtn} disabled={isLoadingProfile}>
              <FaFilePdf /> {t('export_modal.export_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportSettingsModal;