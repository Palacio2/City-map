import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaTimes, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { profileAPI } from '../api/edit-profileApi';
import { parsePhoneNumber, countryCodes, cleanPhoneNumberForSave, validatePhoneNumber } from '../../utils/phoneUtils';
import styles from './ProfileEditPages.module.css';

export default function ProfileEditPage() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();

  const [state, setState] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+380',
    originalEmail: '',
    isLoading: true,
    isSaving: false
  });

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const updateState = (key, value) => setState(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await profileAPI.getProfile();
      const { code, number } = parsePhoneNumber(profile.phone);
      
      setState(prev => ({
        ...prev,
        name: profile.full_name || '',
        email: profile.email || '',
        phone: number || '',
        countryCode: code || '+380',
        originalEmail: profile.email || '',
        isLoading: false
      }));
    } catch (error) {
      setStatusMessage({ 
        type: 'error', 
        text: t('edit_page.errors.load_failed') 
      });
      updateState('isLoading', false);
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '');
    }

    updateState(name, newValue);
  }, []);

  const validateForm = useCallback(() => {
    const { name, email, phone, countryCode } = state;

    if (name.trim().length > 30) {
      setStatusMessage({ type: 'error', text: t('edit_page.errors.name_long') });
      return false;
    }
    
    if (!name.trim() || !email.trim()) {
      setStatusMessage({ 
          type: 'error', 
          text: !name.trim() ? t('edit_page.errors.name_required') : t('edit_page.errors.email_required') 
      });
      return false;
    }

    if (phone.trim()) {
        const phoneError = validatePhoneNumber(countryCode, phone, t);
        if (phoneError) {
            setStatusMessage({ type: 'error', text: phoneError });
            return false;
        }
    }

    return true;
  }, [state, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    if (!validateForm()) return;

    updateState('isSaving', true);
    
    try {
      const phoneToSave = cleanPhoneNumberForSave(state.countryCode, state.phone);

      await profileAPI.updateProfile({
        full_name: state.name.trim(),
        phone: phoneToSave
      });

      if (state.email !== state.originalEmail) {
        const updateEmailResult = await profileAPI.updateEmail(state.email.trim());
        setStatusMessage({ type: 'success', text: updateEmailResult.message });
        updateState('originalEmail', state.email);
      } else {
        setStatusMessage({ type: 'success', text: t('edit_page.success') });
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      setStatusMessage({ 
        type: 'error', 
        text: error.message || t('edit_page.errors.save_error') 
      });
    } finally {
      updateState('isSaving', false);
    }
  };

  if (state.isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
            <div className={styles.spinner}></div>
            {t('billing_page.loading')}
        </div>
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
              <div 
                className={`${styles.messageContainer} ${
                  statusMessage.type === 'success' ? styles.successMessage : styles.errorMessage
                }`}
                role="alert"
              >
                {statusMessage.type === 'success' ? 
                  <FaCheckCircle className={styles.statusIcon} /> : 
                  <FaExclamationTriangle className={styles.statusIcon} />
                }
                <span>{statusMessage.text}</span>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>
                <FaUser className={styles.labelIcon} />
                {t('labels.full_name')} *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={state.name}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder={t('edit_page.placeholders.name')}
                required
                disabled={state.isSaving}
                maxLength={30}
                autoComplete="name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                <FaEnvelope className={styles.labelIcon} />
                {t('labels.email')} *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={state.email}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder={t('edit_page.placeholders.email')}
                required
                disabled={state.isSaving}
                maxLength={54}
                autoComplete="email"
              />
              
              {state.email !== state.originalEmail && (
                <div className={styles.emailWarning} role="note">
                  <FaExclamationTriangle className={styles.warningIcon} />
                  <span className={styles.warningText}>
                    {t('edit_page.email_warning')}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.formLabel}>
                <FaPhone className={styles.labelIcon} />
                {t('labels.phone')}
              </label>
              <div className={styles.phoneInputContainer}>
                <select
                  name="countryCode"
                  value={state.countryCode}
                  onChange={(e) => updateState('countryCode', e.target.value)}
                  className={styles.countryCodeSelect}
                  disabled={state.isSaving}
                  aria-label={t('labels.country_code')}
                >
                  {countryCodes.map(item => (
                    <option key={item.code} value={item.code}>
                      {item.code} {item.name && `(${item.name})`}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={state.phone}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder={t('edit_page.placeholders.phone')}
                  disabled={state.isSaving}
                  autoComplete="tel-national"
                />
              </div>
            </div>

            <div className={styles.buttonsContainer}>
              <button 
                type="submit" 
                className={styles.primaryButton}
                disabled={state.isSaving}
              >
                <FaSave className={styles.buttonIcon} />
                {state.isSaving ? t('actions.saving') : t('actions.save')}
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