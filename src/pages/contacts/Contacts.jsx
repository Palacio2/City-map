import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaComment, FaPaperPlane, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { contactsAPI } from '../../components/api/contactsAPI';
import styles from './Contacts.module.css';

export default function Contacts() {
  const { t } = useTranslation('contacts');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  // Мемоізація полів для оновлення при зміні мови
  const fields = useMemo(() => [
    { 
      name: 'name', 
      label: t('form.name.label'), 
      type: 'text', 
      icon: FaUser, 
      placeholder: t('form.name.placeholder') 
    },
    { 
      name: 'email', 
      label: t('form.email.label'), 
      type: 'email', 
      icon: FaEnvelope, 
      placeholder: t('form.email.placeholder') 
    },
    { 
      name: 'message', 
      label: t('form.message.label'), 
      type: 'textarea', 
      icon: FaComment, 
      placeholder: t('form.message.placeholder') 
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
          <div className={styles.successState}>
            <FaCheckCircle className={styles.successIcon} />
            <h2 className={styles.title} style={{color: 'var(--text-dark)'}}>
              {t('success.title')}
            </h2>
            <p className={styles.subtitle}>{t('success.text')}</p>
            <button onClick={() => setStatus('idle')} className={styles.button}>
              {t('buttons.send_again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {fields.map(({ name, label, type, icon: Icon, placeholder }) => (
            <div key={name} className={styles.fieldGroup}>
              <label className={styles.label}>
                <Icon className={styles.icon} /> {label}
              </label>
              {type === 'textarea' ? (
                <textarea
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={styles.input}
                  required
                  minLength={10}
                  rows={4}
                />
              ) : (
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={styles.input}
                  required
                  minLength={name === 'name' ? 2 : undefined}
                />
              )}
            </div>
          ))}

          {status === 'error' && <div className={styles.errorMessage}>{errorMsg}</div>}

          <button type="submit" className={styles.button} disabled={status === 'loading'}>
            {status === 'loading' ? t('buttons.sending') : (
              <>{t('buttons.submit')} <FaPaperPlane /></>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <div className={styles.contactItem}><FaEnvelope /> email@example.com</div>
          <div className={styles.contactItem}><FaPhone /> +380 (XX) XXX-XX-XX</div>
        </div>
      </div>
    </div>
  );
}