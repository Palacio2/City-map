import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaInfoCircle } from 'react-icons/fa';
import BackgroundMap from '@admin/features/login/components/BackgroundMap';
import AdminSidebarInfo from '@admin/features/login/components/AdminSidebarInfo';
import CredentialsForm from '@admin/features/login/components/CredentialsForm';
import MfaSetupForm from '@admin/features/login/components/MfaSetupForm';
import MfaVerifyForm from '@admin/features/login/components/MfaVerifyForm';
import { useAdminAuth } from '@admin/core/context/useAdminAuth';

export default function LoginTab() {
  const { t } = useTranslation('db');
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const {
    step,
    email,
    setEmail,
    password,
    setPassword,
    mfaCode,
    setMfaCode,
    qrCodeUrl,
    loading,
    error,
    handleLoginSubmit,
    handleMfaSubmit,
    handleRestart
  } = useAdminAuth();

  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 z-30 w-screen flex flex-col md:flex-row overflow-hidden font-sans select-none bg-[#faf7f2] dark:bg-[#1a1614]">
      
      {/* Десктопний сайдбар (прихований на мобільних пристроях) */}
      <div className="hidden md:block w-[360px] lg:w-[420px] xl:w-[460px] h-full border-r border-[#e8e0d5] dark:border-[#38312c] shrink-0">
        <AdminSidebarInfo />
      </div>

      {/* Мобільний Drawer для перегляду інформації сайдбару */}
      {mobileInfoOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start animate-fadeIn">
          <div className="w-[85%] max-w-[360px] h-full shadow-2xl">
            <AdminSidebarInfo onCloseMobile={() => setMobileInfoOpen(false)} />
          </div>
          <div className="flex-1 h-full" onClick={() => setMobileInfoOpen(false)} />
        </div>
      )}

      {/* Права зона: Фонова мапа + Форма авторизації */}
      <div className="flex-1 h-full relative flex items-center justify-center md:justify-end p-4 sm:p-6 md:pr-10 lg:pr-20 overflow-hidden bg-[#e5e0d8] dark:bg-[#14110f]">
        <BackgroundMap />

        {/* Мобільна кнопка виклику панелі інформації */}
        <button
          type="button"
          onClick={() => setMobileInfoOpen(true)}
          className="md:hidden absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf7f2]/90 dark:bg-[#1f1a17]/90 backdrop-blur-md border border-[#e8e0d5] dark:border-[#38312c] text-[#2a2421] dark:text-[#faf7f2] text-xs font-semibold shadow-md"
        >
          <FaInfoCircle className="text-[#c25e26]" /> {t('admin_panel.login.info_btn')}
        </button>

        {/* Картка авторизації */}
        <div className="relative z-10 w-full max-w-[360px] sm:max-w-[380px] bg-white/90 dark:bg-[#1f1a17]/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#ece4d9]/80 dark:border-[#38312c] transition-all duration-300">
          <div className="mx-auto w-11 h-11 bg-[#fbf2eb] dark:bg-[#2b2420] border border-[#f3ded0] dark:border-[#423932] rounded-2xl flex items-center justify-center mb-4 text-[#c25e26] shadow-inner">
            <FaShieldAlt className="text-lg" />
          </div>

          <div className="text-center mb-5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#2a2421] dark:text-[#faf7f2] mb-1 tracking-tight">
              {t('admin_panel.login.title')}
            </h1>
            <p className="text-xs text-[#7d736a] dark:text-[#a69c92] font-medium">
              {t('admin_panel.login.subtitle')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 text-xs p-2.5 rounded-xl mb-4 font-semibold text-center">
              {error}
            </div>
          )}

          <div className="transition-all duration-300">
            {step === 'credentials' && (
              <CredentialsForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                onSubmit={handleLoginSubmit}
              />
            )}
            {step === 'mfa_setup' && (
              <MfaSetupForm
                qrCodeUrl={qrCodeUrl}
                mfaCode={mfaCode}
                setMfaCode={setMfaCode}
                loading={loading}
                onSubmit={handleMfaSubmit}
                onCancel={handleRestart}
              />
            )}
            {step === 'mfa_verify' && (
              <MfaVerifyForm
                mfaCode={mfaCode}
                setMfaCode={setMfaCode}
                loading={loading}
                onSubmit={handleMfaSubmit}
                onBack={handleRestart}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}