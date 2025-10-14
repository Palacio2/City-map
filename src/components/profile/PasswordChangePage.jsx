import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaLock, FaSave, FaTimes, FaShieldAlt, FaChevronDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import styles from './PasswordChangePage.module.css';

export default function PasswordChangePage() {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Нові паролі не збігаються.' });
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Новий пароль має містити не менше 6 символів.' });
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateUserError } = await supabase.auth.updateUser({ 
        password: formData.newPassword 
      });

      if (updateUserError) {
        setStatusMessage({ type: 'error', text: `Помилка: ${updateUserError.message}` });
      } else {
        setStatusMessage({ type: 'success', text: 'Пароль успішно змінено!' });
        setFormData({ newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Сталася невідома помилка.' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const securityTips = [
    "Використовуйте не менше 8 символів",
    "Додайте великі літери, цифри та спеціальні символи",
    "Уникайте особистої інформації",
    "Не використовуйте один пароль для різних сервісів",
    "Уникайте послідовностей (123456, qwerty)",
    "Рекомендується використовувати менеджер паролів",
    "Періодично оновлюйте ваші паролі",
    "Увімкніть двофакторну автентифікацію"
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> Назад до профілю
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Зміна пароля</h1>
          <p className={styles.subtitle}>Оновіть ваш пароль для підвищення безпеки акаунта</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Безпека акаунта</h2>
              <p className={styles.formSubtitle}>Введіть новий пароль для оновлення</p>
            </div>

            {statusMessage.text && (
              <div className={`${styles.messageContainer} ${
                statusMessage.type === 'success' ? styles.successMessage : styles.errorMessage
              }`}>
                {statusMessage.type === 'success' ? 
                  <FaCheckCircle className={styles.statusIcon} /> : 
                  <FaTimesCircle className={styles.statusIcon} />
                }
                <span>{statusMessage.text}</span>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FaLock className={styles.labelIcon} />
                Новий пароль *
              </label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPasswords.new ? "text" : "password"}
                  className={styles.formInput}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Введіть новий пароль (мінімум 6 символів)"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FaLock className={styles.labelIcon} />
                Підтвердьте новий пароль *
              </label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  className={styles.formInput}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Повторіть новий пароль"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className={styles.buttonsContainer}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isLoading}
              >
                <FaSave className={styles.buttonIcon} />
                {isLoading ? 'Збереження...' : 'Змінити пароль'}
              </button>

              <Link to="/profile" className={styles.secondaryButton}>
                <FaTimes className={styles.buttonIcon} />
                Скасувати
              </Link>
            </div>

            <div className={styles.securityTipsDropdown}>
              <div 
                className={styles.dropdownHeader}
                onClick={() => setIsTipsOpen(!isTipsOpen)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && setIsTipsOpen(!isTipsOpen)}
              >
                <h3 className={styles.dropdownTitle}>
                  <FaShieldAlt />
                  Поради щодо безпечного пароля
                </h3>
                <FaChevronDown 
                  className={`${styles.dropdownIcon} ${isTipsOpen ? styles.open : ''}`} 
                />
              </div>

              {isTipsOpen && (
                <div className={styles.dropdownContent}>
                  <ul className={styles.dropdownList}>
                    {securityTips.map((tip, index) => (
                      <li key={index} className={styles.tipItem}>
                        <span className={styles.tipBullet}>•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}