import React, { useState, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaComment, FaPaperPlane, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { contactsAPI } from '@api/contactsAPI';
import styles from './Contacts.module.css';
import SeoMeta from '@components/seo/SeoMeta';

export default function Contacts() {
  const { t } = useTranslation('contacts');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [consent, setConsent] = useState(false);
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

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      await contactsAPI.submitMessage({
        ...form,
        consent_accepted: true
      });
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setConsent(false);
    } catch {
      setStatus('error');
      setErrorMsg(t('errors.generic'));
    }
  };

  if (status === 'success') {
    return (
      <div className={styles.container}>
        <SeoMeta title={t('seo.title')} />
        <div className={styles.card}>
          <div className={styles.successState} role="alert">
            <FaCheckCircle className={styles.successIcon} />
            <h2 className={styles.title} style={{color: 'var(--text-main)'}}>
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

  const email = t('info.email');
  const phone = t('info.phone');

  return (
    <div className={styles.container}>
      <SeoMeta 
        title={t('seo.title')} 
        description={t('seo.desc')} 
      />

      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.name} className={styles.fieldGroup}>
                <label htmlFor={field.id} className={styles.label}>
                  <Icon className={styles.icon} aria-hidden="true" /> {field.label}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className={styles.input}
                    required
                    minLength={10}
                    rows={4}
                    autoComplete={field.autoComplete}
                  />
                ) : (
                  <input
                    id={field.id}
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className={styles.input}
                    required
                    minLength={field.name === 'name' ? 2 : undefined}
                    autoComplete={field.autoComplete}
                  />
                )}
              </div>
            );
          })}

          <div className={styles.consentGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={consent} 
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span className={styles.consentText}>
                <Trans
                  i18nKey="contacts:form.consent"
                  components={[<Link to="/terms" className={styles.inlineLink} key="terms-link" />]}
                />
              </span>
            </label>
          </div>

          {status === 'error' && (
            <div className={styles.errorMessage} role="alert">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.button} 
            disabled={status === 'loading' || !consent}
          >
            {status === 'loading' ? t('buttons.sending') : (
              <>{t('buttons.submit')} <FaPaperPlane aria-hidden="true" /></>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <a href={`mailto:${email}`} className={styles.contactLink}>
            <FaEnvelope /> {email}
          </a>
          <a href={`tel:${phone.replace(/\s/g, '')}`} className={styles.contactLink}>
            <FaPhone /> {phone}
          </a>
        </div>
      </div>
    </div>
  );
}