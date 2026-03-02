import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaFilePdf, FaCloudUploadAlt } from 'react-icons/fa';
import { storageApi } from '@api/storageApi';
import Loader from '@components/loader/Loader';
import styles from './ExportSettingsModal.module.css';

const STORAGE_KEY = 'geo_analyzer_export_settings';

const ExportSettingsModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['comparison', 'common']);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { agencyName: '', phone: '', website: '', comments: '', logo: null };
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
          const meta = await storageApi.getUserMetadata();
          
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
              try {
                const blob = await storageApi.downloadFile('avatars', meta.avatar_url);
                const reader = new FileReader();
                reader.onloadend = () => updateStateWithData(reader.result);
                reader.readAsDataURL(blob);
              } catch {
                updateStateWithData(null);
              }
            }
          } else {
            updateStateWithData(null);
          }
        } catch {
          setIsLoadingProfile(false);
        }
      };
      fetchUserData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData, comments: '' }));
    onConfirm(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{t('export_modal.title')}</h3>
          <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.logoUploadSection}>
            <label htmlFor="logo-upload" className={`${styles.logoUploadLabel} ${formData.logo ? styles.hasImage : ''}`}>
              {formData.logo ? (
                <div className={styles.imagePreviewWrapper}>
                  <img src={formData.logo} alt="Logo" className={styles.logoPreview} />
                  <div className={styles.changeImageOverlay}><span>{t('export_modal.change_logo')}</span></div>
                </div>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <FaCloudUploadAlt className={styles.uploadIcon} />
                  <span className={styles.uploadTitle}>{t('export_modal.upload_logo')}</span>
                </div>
              )}
            </label>
            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className={styles.hiddenInput} />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('export_modal.agency_name')}</label>
            <input type="text" name="agencyName" placeholder={t('export_modal.agency_placeholder')} value={formData.agencyName} onChange={(e) => setFormData({...formData, agencyName: e.target.value})} required />
          </div>

          <div className={styles.inputGroup}>
            <label>{t('export_modal.comments')}</label>
            <textarea name="comments" rows="3" placeholder={t('export_modal.comments_placeholder')} value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})} />
          </div>

          <div className={styles.rowInputs}>
            <div className={styles.inputGroup}>
              <label>{t('export_modal.phone')}</label>
              <input type="text" name="phone" placeholder={t('export_modal.phone_placeholder')} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className={styles.inputGroup}>
              <label>{t('export_modal.website')}</label>
              <input type="text" name="website" placeholder={t('export_modal.website_placeholder')} value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{t('common:actions.cancel')}</button>
            <button type="submit" className={styles.confirmBtn} disabled={isLoadingProfile}>
              {isLoadingProfile ? <Loader size="small" /> : <><FaFilePdf /> {t('export_modal.export_btn')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportSettingsModal;