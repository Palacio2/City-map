import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import { contactsAPI } from './api/contactsAPI';
import SeoMeta from '@seo/SeoMeta';
import { ContactCaptcha } from './ContactCaptcha';

export default function Contacts() {
  const { t } = useTranslation('db');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [consent, setConsent] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [captchaToken,setCaptchaToken]=useState('');
  const [captchaAttempt,setCaptchaAttempt]=useState(0);
  const captchaError=useCallback(()=>setErrorMsg(t('contacts.errors.generic')),[t]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fields = useMemo(() => [
    {
      name: 'name',
      label: t('contacts.form.name.label'),
      type: 'text',
      placeholder: t('contacts.form.name.placeholder'),
      autoComplete: 'name',
      id: 'contact-name'
    },
    {
      name: 'email',
      label: t('contacts.form.email.label'),
      type: 'email',
      placeholder: t('contacts.form.email.placeholder'),
      autoComplete: 'email',
      id: 'contact-email'
    }
  ], [t]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent || !captchaToken || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await contactsAPI.submitMessage({
        ...form,
        consent_accepted: true,
        captcha_token: captchaToken,
      });
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setConsent(false);
    } catch {
      setStatus('error');
      setErrorMsg(t('contacts.errors.generic'));
    } finally {
      setCaptchaToken('');
      setCaptchaAttempt(value=>value+1);
    }
  };

  const email = t('contacts.info.email');
  const phone = t('contacts.info.phone');

  return (
    <div className="relative min-h-[calc(100vh-var(--header-height))] w-full bg-body flex flex-col justify-center py-12 lg:py-24 px-5 sm:px-8 overflow-hidden">

      {/* Subtle Ambient Background */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.1] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at center, var(--text-main) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <SeoMeta
        title={t('contacts.seo.title')}
        description={t('contacts.seo.desc')}
      />

      <div className="max-w-[1300px] w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

        {/* Left Column: Typography & Info */}
        <div className="lg:col-span-5 flex flex-col gap-8 lg:gap-12 animate-slide-up-fade">

          <div className="flex flex-col gap-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight text-textMain leading-[1.1]">
              {t('contacts.title')}<span className="text-accent">.</span>
            </h1>
            <p className="text-lg sm:text-xl text-textSecondary font-medium max-w-md leading-relaxed">
              {t('contacts.subtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <a href={`mailto:${email}`} className="flex items-start gap-5 group w-fit">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-borderClient shadow-xs text-textMain flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white group-hover:border-transparent group-hover:-translate-y-1 transition-all duration-300">
                <FaEnvelope className="text-xl" />
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-xs font-bold uppercase tracking-widest text-textSecondary mb-1">Email</span>
                <span className="text-lg sm:text-xl font-bold text-textMain group-hover:text-accent transition-colors">{email}</span>
              </div>
            </a>

            <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-start gap-5 group w-fit">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-borderClient shadow-xs text-textMain flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white group-hover:border-transparent group-hover:-translate-y-1 transition-all duration-300">
                <FaPhone className="text-xl" />
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-xs font-bold uppercase tracking-widest text-textSecondary mb-1">Телефон</span>
                <span className="text-lg sm:text-xl font-bold text-textMain group-hover:text-accent transition-colors">{phone}</span>
              </div>
            </a>
          </div>

        </div>

        {/* Right Column: The Form Card */}
        <div className="lg:col-span-7 w-full animate-slide-up-fade" style={{ animationDelay: '0.15s' }}>
          <div className="w-full bg-surface rounded-[2rem] sm:rounded-[2.5rem] border border-borderClient p-6 sm:p-10 lg:p-14 shadow-2xl shadow-black/5 relative overflow-hidden">

            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-6 h-full animate-slideUp">
                <div className="w-24 h-24 rounded-full bg-success/10 text-success flex items-center justify-center text-5xl mb-2">
                  <FaCheckCircle />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-heading text-textMain">
                  {t('contacts.success.title') || 'Повідомлення надіслано!'}
                </h2>
                <p className="text-textSecondary text-lg max-w-md">
                  {t('contacts.success.desc') || 'Дякуємо за звернення. Ми зв\'яжемося з вами найближчим часом.'}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 px-8 py-4 bg-body border border-borderClient text-textMain rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-borderClient transition-colors active:scale-95"
                >
                  {t('contacts.buttons.send_another') || 'Надіслати ще'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8 relative z-10">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {fields.map((field) => (
                    <div key={field.name} className="flex flex-col gap-3 group">
                      <label htmlFor={field.id} className="text-[13px] font-bold text-textMain uppercase tracking-widest ml-1 opacity-90">
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        type={field.type}
                        name={field.name}
                        value={form[field.name as keyof typeof form]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="w-full px-5 py-4 bg-body border-none rounded-2xl text-textMain font-sans text-base transition-all ring-1 ring-borderClient focus:outline-hidden focus:ring-2 focus:ring-accent placeholder-textSecondary/50 hover:ring-textSecondary/40"
                        required
                        minLength={field.name === 'name' ? 2 : undefined}
                        autoComplete={field.autoComplete}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 group">
                  <label htmlFor="contact-message" className="text-[13px] font-bold text-textMain uppercase tracking-widest ml-1 opacity-90">
                    {t('contacts.form.message.label')}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t('contacts.form.message.placeholder')}
                    className="w-full px-5 py-4 bg-body border-none rounded-2xl text-textMain font-sans text-base transition-all ring-1 ring-borderClient focus:outline-hidden focus:ring-2 focus:ring-accent placeholder-textSecondary/50 hover:ring-textSecondary/40 resize-y min-h-[160px]"
                    required
                    minLength={10}
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-start gap-4 mt-2">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-1 w-5 h-5 rounded-md border-borderClient bg-body text-accent focus:ring-accent cursor-pointer shrink-0 transition-colors"
                  />
                  <label htmlFor="consent" className="text-[14px] text-textSecondary cursor-pointer leading-relaxed">
                    <Trans
                      i18nKey="contacts.form.consent"
                      t={t}
                      components={[<Link to="/terms" className="font-bold text-textMain hover:text-accent underline decoration-borderClient hover:decoration-accent transition-all ml-1" key="terms-link" />]}
                      defaults="Я погоджуюсь з <0>умовами використання</0> та політикою конфіденційності."
                    />
                  </label>
                </div>

                {status === 'error' && (
                  <div className="p-4 rounded-2xl bg-danger/10 text-danger border border-danger/20 font-medium text-center animate-popIn text-sm">
                    {errorMsg}
                  </div>
                )}

                <ContactCaptcha key={captchaAttempt} onToken={setCaptchaToken} onError={captchaError} />
                <button
                  type="submit"
                  className={`
                    w-full py-4 mt-2 text-white font-bold font-heading text-[15px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 group
                    ${status === 'loading' || !consent || !captchaToken
                      ? 'bg-textSecondary cursor-not-allowed opacity-70'
                      : 'bg-accent shadow-[0_10px_20px_-10px_var(--accent-color)] hover:shadow-[0_15px_30px_-10px_var(--accent-color)] hover:-translate-y-1 active:translate-y-0 cursor-pointer'}
                  `}
                  disabled={status === 'loading' || !consent || !captchaToken}
                >
                  {status === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('contacts.buttons.submit')}</span>
                      <FaArrowRight className="text-[14px] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
