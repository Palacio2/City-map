import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaLock, FaSave, FaTimes, FaShieldAlt, FaChevronDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import { validateChangePasswordForm } from '@auth/validation';
import styles from './PasswordChangePage.module.css';

const StatusMessage = ({ type, text }) => {
    if (!text) return null;
    const Icon = type === 'success' ? FaCheckCircle : FaTimesCircle;
    const className = type === 'success' ? styles.successMessage : styles.errorMessage;
    
    return (
        <div className={`${styles.messageContainer} ${className}`} role="alert">
            <Icon className={styles.statusIcon} />
            <span>{text}</span>
        </div>
    );
};

export default function PasswordChangePage() {
    const { t } = useTranslation(['profile', 'auth', 'common']);
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isTipsOpen, setIsTipsOpen] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });

        const validationError = validateChangePasswordForm(formData, t);
        if (validationError) {
            setStatusMessage({ type: 'error', text: validationError });
            return;
        }

        if (isSaving) return;

        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ 
                password: formData.newPassword 
            });

            if (error) throw error;

            setStatusMessage({ type: 'success', text: t('profile:password_page.success') });
            setFormData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            let errorMessage = error.message;
            
            if (errorMessage.includes("different from the old password") || errorMessage.includes("same as the old password")) {
                errorMessage = t('auth:errors.password_same_as_old');
            } else {
                errorMessage = error.message || t('profile:password_page.errors.unknown');
            }
            
            setStatusMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const securityTips = t('profile:password_page.tips', { returnObjects: true });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link to="/profile" className={styles.backButton}>
                    <FaArrowLeft /> <span>{t('profile:actions.back_to_profile')}</span>
                </Link>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>{t('profile:password_page.title')}</h1>
                    <p className={styles.subtitle}>{t('profile:password_page.subtitle')}</p>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.card}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <input 
                            type="text" 
                            name="username" 
                            autoComplete="username" 
                            style={{ display: 'none' }} 
                        />

                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>{t('profile:password_page.form_title')}</h2>
                            <p className={styles.formSubtitle}>{t('profile:password_page.form_subtitle')}</p>
                        </div>

                        <StatusMessage 
                            type={statusMessage.type} 
                            text={statusMessage.text} 
                        />
                        
                        <div className={styles.inputsWrapper}>
                            <div className={styles.formGroup}>
                                <label htmlFor="newPassword" className={styles.formLabel}>
                                    <FaLock className={styles.labelIcon} />
                                    {t('profile:password_page.new_pass')}
                                </label>
                                <div className={styles.passwordInputContainer}>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPasswords.new ? "text" : "password"}
                                        className={styles.formInput}
                                        value={formData.newPassword}
                                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                        placeholder={t('profile:password_page.placeholders.new')}
                                        required
                                        disabled={isSaving}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => togglePasswordVisibility('new')}
                                        aria-label={showPasswords.new ? t('profile:actions.hide_password') : t('profile:actions.show_password')}
                                    >
                                        {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword" className={styles.formLabel}>
                                    <FaLock className={styles.labelIcon} />
                                    {t('profile:password_page.confirm_pass')}
                                </label>
                                <div className={styles.passwordInputContainer}>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPasswords.confirm ? "text" : "password"}
                                        className={styles.formInput}
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        placeholder={t('profile:password_page.placeholders.confirm')}
                                        required
                                        disabled={isSaving}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        aria-label={showPasswords.confirm ? t('profile:actions.hide_password') : t('profile:actions.show_password')}
                                    >
                                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.buttonsContainer}>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`${styles.baseButton} ${styles.primaryButton}`}
                            >
                                <FaSave className={styles.buttonIcon} />
                                {isSaving ? t('common:actions.saving') : t('profile:actions.change_password')}
                            </button>

                            <Link to="/profile" className={`${styles.baseButton} ${styles.secondaryButton}`}>
                                <FaTimes className={styles.buttonIcon} />
                                {t('common:actions.cancel')}
                            </Link>
                        </div>

                        <div className={styles.securityTipsDropdown}>
                            <button 
                                type="button"
                                className={styles.dropdownHeader}
                                onClick={() => setIsTipsOpen(!isTipsOpen)}
                                aria-expanded={isTipsOpen}
                            >
                                <span className={styles.dropdownTitle}>
                                    <FaShieldAlt className={styles.shieldIcon}/>
                                    {t('profile:password_page.tips_title')}
                                </span>
                                <FaChevronDown 
                                    className={`${styles.dropdownIcon} ${isTipsOpen ? styles.open : ''}`} 
                                />
                            </button>

                            {isTipsOpen && (
                                <div className={styles.dropdownContent}>
                                    <ul className={styles.dropdownList}>
                                        {Array.isArray(securityTips) && securityTips.map((tip, index) => (
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