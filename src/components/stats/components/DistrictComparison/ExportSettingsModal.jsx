import React, { useState } from 'react';
import { FaTimes, FaFilePdf, FaUpload } from 'react-icons/fa';
import styles from './ExportSettingsModal.module.css';

const ExportSettingsModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    agencyName: '',
    phone: '',
    website: '',
    logo: null 
  });

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
    onConfirm(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Налаштування звіту</h3>
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
                  <FaUpload /> Завантажити логотип
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
            <label>Назва агентства</label>
            <input 
              type="text" 
              name="agencyName" 
              placeholder="Наприклад: Best Estate" 
              value={formData.agencyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Номер телефону</label>
            <input 
              type="text" 
              name="phone" 
              placeholder="+380 ..." 
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Веб-сайт</label>
            <input 
              type="text" 
              name="website" 
              placeholder="www.example.com" 
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className={styles.confirmBtn}>
              <FaFilePdf /> Експорт PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportSettingsModal;