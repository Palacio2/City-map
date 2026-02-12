import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaTimes, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { profileAPI } from '@api/edit-profileApi';
import { parsePhoneNumber, countryCodes, cleanPhoneNumberForSave } from '@utils/phoneUtils';
import { validateProfileForm } from '@utils/profileValidation';
import styles from './ProfileEditPages.module.css';

export default function ProfileEditPage() {
  const { t } = useTranslation(['profile', 'common']);
  const navigate = useNavigate();

  const [state, setState] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+380',
    originalEmail: '',
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
        originalEmail: profile.email || ''
      }));
    } catch (error) {
      setStatusMessage({ 
        type: 'error', 
        text: t('profile:edit_page.errors.load_failed') 
      });
    }
  };

  const mapErrorToMessage = (error) => {
    const msg = (error?.message || '').toLowerCase();

    if (msg.includes('invalid refresh token') || msg.includes('jwt')) return t('profile:errors.auth_error');
    if (msg.includes('networkerror') || msg.includes('failed to fetch')) return t('profile:errors.network_error');
    if (msg.includes('user not found')) return t('profile:errors.user_not_found');
    
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('unique constraint')) {
        return t('profile:errors.email_taken');
    }
    
    if (msg.includes('rate limit') || msg.includes('security purposes') || msg.includes('try again after')) {
        return t('profile:errors.too_many_requests');
    }
    
    if (msg.includes('is invalid') || (msg.includes('email') && msg.includes('invalid'))) {
        return t('profile:errors.email_invalid_format');
    }

    return error.message || t('profile:errors.unknown_error');
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '');
    }
    updateState(name, newValue);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    const validationError = validateProfileForm(state, t);
    
    if (validationError) {
        setStatusMessage(validationError);
        return; 
    }

    if (state.isSaving) return;

    updateState('isSaving', true);
    
    try {
      const phoneToSave = cleanPhoneNumberForSave(state.countryCode, state.phone);

      await profileAPI.updateProfile({
        full_name: state.name.trim(),
        phone: phoneToSave
      });

      if (state.email.trim() !== state.originalEmail) {
        await profileAPI.updateEmail(state.email.trim());
        
        setStatusMessage({ 
            type: 'success', 
            text: t('profile:edit_page.email_update_sent') 
        });
        updateState('originalEmail', state.email.trim());
      } else {
        setStatusMessage({ type: 'success', text: t('profile:edit_page.success') });
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
          <FaArrowLeft /> {t('profile:actions.back_to_profile')}
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('profile:edit_page.title')}</h1>
          <p className={styles.subtitle}>{t('profile:edit_page.subtitle')}</p>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>{t('profile:edit_page.main_info')}</h2>
              <p className={styles.formSubtitle}>{t('profile:edit_page.enter_data')}</p>
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
                {t('profile:labels.full_name')} *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={state.name}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder={t('profile:edit_page.placeholders.name')}
                required
                disabled={state.isSaving}
                maxLength={30}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                <FaEnvelope className={styles.labelIcon} />
                {t('profile:labels.email')} *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={state.email}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder={t('profile:edit_page.placeholders.email')}
                required
                disabled={state.isSaving}
                maxLength={60} 
              />
              
              {state.email !== state.originalEmail && (
                <div className={styles.emailWarning} role="note">
                  <FaExclamationTriangle className={styles.warningIcon} />
                  <span className={styles.warningText}>
                    {t('profile:edit_page.email_warning')}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.formLabel}>
                <FaPhone className={styles.labelIcon} />
                {t('profile:labels.phone')}
              </label>
              <div className={styles.phoneInputContainer}>
                <select
                  name="countryCode"
                  value={state.countryCode}
                  onChange={(e) => updateState('countryCode', e.target.value)}
                  className={styles.countryCodeSelect}
                  disabled={state.isSaving}
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
                  placeholder={t('profile:edit_page.placeholders.phone')}
                  disabled={state.isSaving}
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
                {state.isSaving ? t('common:actions.saving') : t('common:actions.save')}
              </button>
              
              <Link to="/profile" className={styles.secondaryButton}>
                <FaTimes className={styles.buttonIcon} />
                {t('common:actions.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}