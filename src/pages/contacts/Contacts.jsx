import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaComment, FaPaperPlane, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { contactsAPI } from '@api/contactsAPI';
import styles from './Contacts.module.css';

export default function Contacts() {
  const { t } = useTranslation('contacts');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');

  const fields = useMemo(() => [
    { 
      name: 'name', 
      label: t('form.name.label'), 
      type: 'text', 
      icon: FaUser, 
      placeholder: t('form.name.placeholder'),
      autoComplete: 'name',
      id: 'contact-name'
    },
    { 
      name: 'email', 
      label: t('form.email.label'), 
      type: 'email', 
      icon: FaEnvelope, 
      placeholder: t('form.email.placeholder'),
      autoComplete: 'email',
      id: 'contact-email'
    },
    { 
      name: 'message', 
      label: t('form.message.label'), 
      type: 'textarea', 
      icon: FaComment, 
      placeholder: t('form.message.placeholder'),
      autoComplete: 'off',
      id: 'contact-message'
    }
  ], [t]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      await contactsAPI.submitMessage(form);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || t('errors.generic'));
    }
  };

  if (status === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successState} role="alert">
            <FaCheckCircle className={styles.successIcon} />
            <h2 className={styles.title} style={{color: 'var(--text-dark)'}}>
              {t('success.title')}
            </h2>
            <p className={styles.subtitle}>{t('success.text')}</p>
            <button 
              onClick={() => setStatus('idle')} 
              className={styles.button}
              autoFocus 
            >
              {t('buttons.send_again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contactInfo = {
    email: 'youworkday@gmail.com',
    phone: '+48 698 991 398'
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate={false}>
          {fields.map(({ name, label, type, icon: Icon, placeholder, autoComplete, id }) => (
            <div key={name} className={styles.fieldGroup}>
              <label htmlFor={id} className={styles.label}>
                <Icon className={styles.icon} aria-hidden="true" /> {label}
              </label>
              {type === 'textarea' ? (
                <textarea
                  id={id}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={styles.input}
                  required
                  minLength={10}
                  rows={4}
                  autoComplete={autoComplete}
                />
              ) : (
                <input
                  id={id}
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={styles.input}
                  required
                  minLength={name === 'name' ? 2 : undefined}
                  autoComplete={autoComplete}
                />
              )}
            </div>
          ))}

          {status === 'error' && (
            <div className={styles.errorMessage} role="alert">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.button} 
            disabled={status === 'loading'}
          >
            {status === 'loading' ? t('buttons.sending') : (
              <>{t('buttons.submit')} <FaPaperPlane aria-hidden="true" /></>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <a href={`mailto:${contactInfo.email}`} className={styles.contactLink}>
            <FaEnvelope /> {contactInfo.email}
          </a>
          <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className={styles.contactLink}>
            <FaPhone /> {contactInfo.phone}
          </a>
        </div>
      </div>
    </div>
  );
}