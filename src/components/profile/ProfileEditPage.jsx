import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaTimes, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import enLabels from 'react-phone-number-input/locale/en.json';
import { profileAPI } from '@api/edit-profileApi';
import { validateProfileForm } from '@utils/profileValidation';
import styles from './ProfileEditPages.module.css';

export default function ProfileEditPage() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();

  const [state, setState] = useState({
    name: '',
    email: '',
    phone: '',
    originalEmail: '',
    isSaving: false
  });

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const updateState = (key, value) => setState(prev => ({ ...prev, [key]: value }));

  const loadUserData = useCallback(async () => {
    try {
      const profile = await profileAPI.getProfile();
      
      setState(prev => ({
        ...prev,
        name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        originalEmail: profile.email || ''
      }));
    } catch {
      setStatusMessage({ 
        type: 'error', 
        text: t('edit_page.errors.load_failed') 
      });
    }
  }, [t]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const mapErrorToMessage = (error) => {
    const msg = (error?.message || '').toLowerCase();

    if (msg.includes('invalid refresh token') || msg.includes('jwt')) return t('errors.auth_error');
    if (msg.includes('networkerror') || msg.includes('failed to fetch')) return t('errors.network_error');
    if (msg.includes('user not found')) return t('errors.user_not_found');
    
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('unique constraint')) {
        return t('errors.email_taken');
    }
    
    if (msg.includes('rate limit') || msg.includes('security purposes') || msg.includes('try again after')) {
        return t('errors.too_many_requests');
    }
    
    if (msg.includes('is invalid') || (msg.includes('email') && msg.includes('invalid'))) {
        return t('errors.email_invalid_format');
    }

    return error.message || t('errors.unknown_error');
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    updateState(name, value);
  }, []);

  const handlePhoneChange = useCallback((value) => {
    updateState('phone', value || '');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    const validationError = validateProfileForm(state, t);
    if (validationError) {
        setStatusMessage(validationError);
        return; 
    }

    if (state.phone && !isValidPhoneNumber(state.phone)) {
        setStatusMessage({ type: 'error', text: t('edit_page.errors.phone_invalid') });
        return;
    }

    if (state.isSaving) return;

    updateState('isSaving', true);
    
    try {
      await profileAPI.updateProfile({
        full_name: state.name.trim(),
        phone: state.phone
      });

      if (state.email.trim() !== state.originalEmail) {
        await profileAPI.updateEmail(state.email.trim());
        
        setStatusMessage({ 
            type: 'success', 
            text: t('edit_page.email_update_sent') 
        });
        updateState('originalEmail', state.email.trim());
      } else {
        setStatusMessage({ type: 'success', text: t('edit_page.success') });
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      setStatusMessage({ 
        type: 'error', 
        text: mapErrorToMessage(error) 
      });
    } finally {
      updateState('isSaving', false);
    }
  };

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
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
                maxLength={60} 
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
              
              <PhoneInput
                international
                defaultCountry="PL"
                value={state.phone}
                onChange={handlePhoneChange}
                disabled={state.isSaving}
                className={styles.phoneInputWrapper}
                labels={enLabels}
                limitMaxLength={true}
              />

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