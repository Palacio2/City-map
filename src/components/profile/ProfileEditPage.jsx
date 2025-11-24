import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaEnvelope, FaSave, FaTimes, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { profileAPI, handleApiError } from '../api/edit-profileApi';
import styles from './ProfileEditPages.module.css';

// Список кодів країн для випадаючого меню
const countryCodes = [
  { name: 'Україна', code: '+380' },
  { name: 'Польща', code: '+48' },
  { name: 'Німеччина', code: '+49' },
  { name: 'США', code: '+1' },
  { name: 'Інше', code: '' }, 
];

// Функція для визначення початкового коду та частини номера
const parsePhoneNumber = (fullPhone) => {
  if (!fullPhone) return { code: '+380', number: '' };
  
  const foundCode = countryCodes.find(item => fullPhone.startsWith(item.code) && item.code !== '');
  
  if (foundCode) {
    const number = fullPhone.substring(foundCode.code.length).trim();
    return { code: foundCode.code, number: number };
  }
  
  return { code: '+380', number: fullPhone };
};

export default function ProfileEditPage() {
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
      setStatusMessage({ type: 'error', text: 'Не вдалося завантажити дані профілю: ' + errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/[^0-9\s()\-]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  }, []);

  const handleCodeChange = useCallback((e) => {
    setCountryCode(e.target.value);
  }, []);

  const validateForm = useCallback(() => {
    if (formData.name.trim().length > 30) {
      setStatusMessage({ type: 'error', text: 'Ім\'я занадто довге (макс. 30 символів).' });
      return false;
    }
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setStatusMessage({ type: 'error', text: !formData.name.trim() ? 'Будь ласка, введіть ім\'я.' : 'Будь ласка, введіть email.' });
      return false;
    }

    const phoneToSave = formData.phone.trim() ? countryCode + ' ' + formData.phone.trim() : null;

    if (phoneToSave && !/\d/.test(phoneToSave)) {
      setStatusMessage({ type: 'error', text: 'Номер телефону має містити цифри.' });
      return false;
    }

    if (phoneToSave && phoneToSave.length > 20) {
      setStatusMessage({ type: 'error', text: 'Номер телефону занадто довгий (макс. 20 символів).' });
      return false;
    }

    return true;
  }, [formData, countryCode]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      const phoneToSave = formData.phone.trim() ? countryCode + ' ' + formData.phone.trim() : null;

      const updateProfileResult = await profileAPI.updateProfile({
        full_name: formData.name.trim(),
        phone: phoneToSave
      });

      if (formData.email !== originalEmail) {
        const updateEmailResult = await profileAPI.updateEmail(formData.email.trim());
        setStatusMessage({ type: 'success', text: updateEmailResult.message });
        setOriginalEmail(formData.email);
      } else {
        setStatusMessage({ type: 'success', text: updateProfileResult.message });
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setStatusMessage({ type: 'error', text: 'Помилка при збереженні: ' + errorMessage });
    } finally {
      setIsSaving(false);
    }
  }, [formData, countryCode, originalEmail, navigate, validateForm]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Завантаження даних...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> Назад до профілю
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Редагування профілю</h1>
          <p className={styles.subtitle}>Оновіть вашу особисту інформацію</p>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Основна інформація</h2>
              <p className={styles.formSubtitle}>Введіть ваші особисті дані</p>
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
                Ім'я та прізвище *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Введіть ваше ім'я"
                required
                disabled={isSaving}
                maxLength={30}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FaEnvelope className={styles.labelIcon} />
                Email адреса *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Введіть ваш email"
                required
                disabled={isSaving}
                maxLength={54}
              />
              
              {formData.email !== originalEmail && (
                <div className={styles.emailWarning}>
                  <FaExclamationTriangle className={styles.warningIcon} />
                  <span className={styles.warningText}>
                    Після збереження на цю адресу буде відправлено лист для підтвердження
                  </span>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FaPhone className={styles.labelIcon} />
                Телефон
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
                  placeholder="991234567"
                  disabled={isSaving}
                  maxLength={20}
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
                {isSaving ? 'Збереження...' : 'Зберегти зміни'}
              </button>
              
              <Link to="/profile" className={styles.secondaryButton}>
                <FaTimes className={styles.buttonIcon} />
                Скасувати
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}