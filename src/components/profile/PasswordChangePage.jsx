import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaLock, FaSave, FaTimes, FaShieldAlt, FaChevronDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import styles from './PasswordChangePage.module.css';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/;
const MIN_PASSWORD_LENGTH = 8;

const StatusMessage = ({ type, text, styles }) => {
    if (!text) return null;
    const Icon = type === 'success' ? FaCheckCircle : FaTimesCircle;
    const className = type === 'success' ? styles.successMessage : styles.errorMessage;
    
    return (
        <div className={`${styles.messageContainer} ${className}`}>
            <Icon className={styles.statusIcon} />
            <span>{text}</span>
        </div>
    );
};

export default function PasswordChangePage() {
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isTipsOpen, setIsTipsOpen] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });

    const validatePassword = () => {
        if (formData.newPassword.length < MIN_PASSWORD_LENGTH) {
            setStatusMessage({ type: 'error', text: `Новий пароль має містити не менше ${MIN_PASSWORD_LENGTH} символів.` });
            return false;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setStatusMessage({ type: 'error', text: 'Нові паролі не збігаються.' });
            return false;
        }
        if (!PASSWORD_REGEX.test(formData.newPassword)) {
            setStatusMessage({ 
                type: 'error', 
                text: 'Пароль має містити великі/малі літери, цифри та спеціальні символи.' 
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });
        setIsLoading(true);

        if (!validatePassword()) {
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
        `Використовуйте не менше ${MIN_PASSWORD_LENGTH} символів`,
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

                        <StatusMessage 
                            type={statusMessage.type} 
                            text={statusMessage.text} 
                            styles={styles} 
                        />
                        
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <FaLock className={styles.labelIcon} />
                                Новий пароль
                            </label>
                            <div className={styles.passwordInputContainer}>
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    className={styles.formInput}
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                    placeholder={`Введіть новий пароль (мінімум ${MIN_PASSWORD_LENGTH} символів)`}
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
                                Підтвердьте новий пароль
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
                                className={`${styles.baseButton} ${styles.primaryButton}`}
                                disabled={isLoading}
                            >
                                <FaSave className={styles.buttonIcon} />
                                {isLoading ? 'Збереження...' : 'Змінити пароль'}
                            </button>

                            <Link to="/profile" className={`${styles.baseButton} ${styles.secondaryButton}`}>
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