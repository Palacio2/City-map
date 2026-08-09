import { useState, useMemo, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaComment, FaPaperPlane, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { contactsAPI } from './api/contactsAPI';
import SeoMeta from '@seo/SeoMeta';

export default function Contacts() {
  const { t } = useTranslation('db');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [consent, setConsent] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fields = useMemo(() => [
    {
      name: 'name',
      label: t('contacts.form.name.label'),
      type: 'text',
      icon: FaUser,
      placeholder: t('contacts.form.name.placeholder'),
      autoComplete: 'name',
      id: 'contact-name'
    },
    {
      name: 'email',
      label: t('contacts.form.email.label'),
      type: 'email',
      icon: FaEnvelope,
      placeholder: t('contacts.form.email.placeholder'),
      autoComplete: 'email',
      id: 'contact-email'
    },
    {
      name: 'message',
      label: t('contacts.form.message.label'),
      type: 'textarea',
      icon: FaComment,
      placeholder: t('contacts.form.message.placeholder'),
      autoComplete: 'off',
      id: 'contact-message'
    }
  ], [t]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
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
      setErrorMsg(t('contacts.errors.generic'));
    }
  };

  const email = t('contacts.info.email');
  const phone = t('contacts.info.phone');
  const MessageIcon = fields[2].icon;

  if (status === 'success') {
    return (
      <div className="min-h-[80vh] pt-32 pb-24 px-4 flex items-center justify-center relative z-10">
        <SeoMeta
          title={t('contacts.seo.title')}
          description={t('contacts.seo.desc')}
        />
        <div className="ui-glass-panel max-w-xl w-full p-10 sm:p-16 text-center animate-popIn">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 text-success mb-8">
            <FaCheckCircle className="text-5xl" />
          </div>
          <h2 className="ui-heading-2 mb-4">
            {t('contacts.success.title')}
          </h2>
          <p className="ui-text-muted mb-10">
            {t('contacts.success.text')}
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="ui-button-primary w-full sm:w-auto"
            autoFocus
          >
            {t('contacts.buttons.send_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
      <SeoMeta
        title={t('contacts.seo.title')}
        description={t('contacts.seo.desc')}
      />
      <div className="text-center max-w-2xl mb-14 animate-slideUp">
        <h1 className="ui-heading-1 mb-4 text-transparent bg-clip-text bg-gradient-to-br from-textMain to-textSecondary">
          {t('contacts.title')}
        </h1>
        <p className="ui-text-muted">
          {t('contacts.subtitle')}
        </p>
      </div>

      <div className="ui-glass-panel w-full max-w-3xl p-6 sm:p-10 md:p-14 relative animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {fields.slice(0, 2).map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.name} className="flex flex-col gap-2">
                  <label htmlFor={field.id} className="flex items-center gap-2 text-sm font-bold text-textMain uppercase tracking-wide">
                    <Icon className="text-accent" /> {field.label}
                  </label>
                  <input
                    id={field.id}
                    type={field.type}
                    name={field.name}
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="ui-input"
                    required
                    minLength={field.name === 'name' ? 2 : undefined}
                    autoComplete={field.autoComplete}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={fields[2].id} className="flex items-center gap-2 text-sm font-bold text-textMain uppercase tracking-wide">
              <MessageIcon className="text-accent" /> {fields[2].label}
            </label>
            <textarea
              id={fields[2].id}
              name={fields[2].name}
              value={form.message}
              onChange={handleChange}
              placeholder={fields[2].placeholder}
              className="ui-input resize-y min-h-[150px]"
              required
              minLength={10}
              autoComplete={fields[2].autoComplete}
            />
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-borderClient">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-1 w-5 h-5 rounded border-borderClient text-accent focus:ring-accent cursor-pointer shrink-0"
            />
            <label htmlFor="consent" className="text-sm text-textSecondary cursor-pointer leading-relaxed">
              <Trans
                i18nKey="contacts.form.consent"
                t={t}
                components={[<Link to="/terms" className="ui-link font-bold text-textMain" key="terms-link" />]}
              />
            </label>
          </div>

          {status === 'error' && (
            <div className="p-4 rounded-xl bg-danger/10 text-danger border border-danger/20 font-medium text-center animate-popIn">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="ui-button-primary w-full group overflow-hidden relative"
            disabled={status === 'loading' || !consent}
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('contacts.buttons.sending')}
              </span>
            ) : (
              <span className="flex items-center gap-3 relative z-10 group-hover:-translate-y-0.5 transition-transform">
                {t('contacts.buttons.submit')} <FaPaperPlane />
              </span>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-borderClient flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <a href={`mailto:${email}`} className="flex items-center gap-3 text-lg font-medium text-textSecondary hover:text-accent transition-colors group">
            <div className="w-10 h-10 rounded-full bg-surface border border-borderClient flex items-center justify-center group-hover:border-accent transition-colors">
              <FaEnvelope />
            </div>
            {email}
          </a>
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-lg font-medium text-textSecondary hover:text-accent transition-colors group">
            <div className="w-10 h-10 rounded-full bg-surface border border-borderClient flex items-center justify-center group-hover:border-accent transition-colors">
              <FaPhone />
            </div>
            {phone}
          </a>
        </div>
      </div>
    </div>
  );
}