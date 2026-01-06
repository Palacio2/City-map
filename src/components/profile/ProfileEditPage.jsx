import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaTimes, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { profileAPI, handleApiError } from '../api/edit-profileApi';
import { parsePhoneNumber, countryCodes, cleanPhoneNumberForSave, validatePhoneNumber } from '../../utils/phoneUtils';
import styles from './ProfileEditPages.module.css';

export default function ProfileEditPage() {
  const { t } = useTranslation('profile');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [countryCode, setCountryCode] = useState('+380');
  const [originalEmail, setOriginalEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const profile = await profileAPI.getProfile();
      
      const { code, number } = parsePhoneNumber(profile.phone);
      
      setFormData({
        name: profile.full_name,
        email: profile.email,
        phone: number
      });
      setCountryCode(code);
      setOriginalEmail(profile.email);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setStatusMessage({ type: 'error', text: `${t('edit_page.errors.load_failed')}: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  }, []);

  const handleCodeChange = useCallback((e) => {
    setCountryCode(e.target.value);
  }, []);

  const validateForm = useCallback(() => {
    if (formData.name.trim().length > 30) {
      setStatusMessage({ type: 'error', text: t('edit_page.errors.name_long') });
      return false;
    }
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setStatusMessage({ 
          type: 'error', 
          text: !formData.name.trim() ? t('edit_page.errors.name_required') : t('edit_page.errors.email_required') 
      });
      return false;
    }

    if (formData.phone.trim()) {
        const phoneError = validatePhoneNumber(countryCode, formData.phone);
        if (phoneError) {
            setStatusMessage({ type: 'error', text: phoneError }); // Тут помилка валідатора може бути локалізована окремо, якщо треба
            return false;
        }
    }

    return true;
  }, [formData, countryCode, t]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      const phoneToSave = cleanPhoneNumberForSave(countryCode, formData.phone);

      const updateProfileResult = await profileAPI.updateProfile({
        full_name: formData.name.trim(),
        phone: phoneToSave
      });

      if (formData.email !== originalEmail) {
        const updateEmailResult = await profileAPI.updateEmail(formData.email.trim());
        setStatusMessage({ type: 'success', text: updateEmailResult.message });
        setOriginalEmail(formData.email);
      } else {
        setStatusMessage({ type: 'success', text: t('edit_page.success') });
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setStatusMessage({ type: 'error', text: `${t('edit_page.errors.save_error')}: ${errorMessage}` });
    } finally {
      setIsSaving(false);
    }
  }, [formData, countryCode, originalEmail, navigate, validateForm, t]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('billing_page.loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> {t('actions.back_to_profile')}
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('edit_page.title')}</h1>
          <p className={styles.subtitle}>{t('edit_page.subtitle')}</p>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>{t('edit_page.main_info')}</h2>
              <p className={styles.formSubtitle}>{t('edit_page.enter_data')}</p>
            </div>
            
            {statusMessage.text && (
              <div className={`${styles.messageContainer} ${
                statusMessage.type === 'success' ? styles.successMessage : styles.errorMessage
              }`}>
                {statusMessage.type === 'success' ? 
                  <FaCheckCircle className={styles.statusIcon} /> : 
                  <FaExclamationTriangle className={styles.statusIcon} />
                }
                <span>{statusMessage.text}</span>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FaUser className={styles.labelIcon} />
                {t('labels.full_name')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder={t('edit_page.placeholders.name')}
                required
                disabled={isSaving}
                maxLength={30}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FaEnvelope className={styles.labelIcon} />
                {t('labels.email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder={t('edit_page.placeholders.email')}
                required
                disabled={isSaving}
                maxLength={54}
              />
              
              {formData.email !== originalEmail && (
                <div className={styles.emailWarning}>
                  <FaExclamationTriangle className={styles.warningIcon} />
                  <span className={styles.warningText}>
                    {t('edit_page.email_warning')}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FaPhone className={styles.labelIcon} />
                {t('labels.phone')}
              </label>
              <div className={styles.phoneInputContainer}>
                <select
                  name="countryCode"
                  value={countryCode}
                  onChange={handleCodeChange}
                  className={styles.countryCodeSelect}
                  disabled={isSaving}
                >
                  {countryCodes.map(item => (
                    <option key={item.code} value={item.code}>
                      {item.code} {item.name && `(${item.name})`}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder={t('edit_page.placeholders.phone')}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className={styles.buttonsContainer}>
              <button 
                type="submit" 
                className={styles.primaryButton}
                disabled={isSaving}
              >
                <FaSave className={styles.buttonIcon} />
                {isSaving ? t('actions.saving') : t('actions.save')}
              </button>
              
              <Link to="/profile" className={styles.secondaryButton}>
                <FaTimes className={styles.buttonIcon} />
                {t('actions.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}