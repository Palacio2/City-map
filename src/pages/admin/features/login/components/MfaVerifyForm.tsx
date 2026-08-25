import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaMobileAlt } from 'react-icons/fa';

interface MfaVerifyFormProps {
  mfaCode: string;
  setMfaCode: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export default function MfaVerifyForm({
  mfaCode,
  setMfaCode,
  loading,
  onSubmit,
  onBack
}: MfaVerifyFormProps) {
  const { t } = useTranslation('db');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <div className="w-10 h-10 bg-[#fbf2eb] rounded-full flex items-center justify-center mx-auto mb-2 text-[#c25e26] border border-[#f3ded0]">
          <FaMobileAlt className="text-base" />
        </div>
        <p className="text-sm font-bold text-[#2a2421]">{t('admin_panel.login.two_factor')}</p>
        <p className="text-[11px] text-[#7d736a]">{t('admin_panel.login.enter_code')}</p>
      </div>

      <input
        type="text"
        value={mfaCode}
        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
        required
        placeholder="000 000"
        maxLength={6}
        autoFocus
        className="w-full p-2.5 bg-[#fbf9f5] border-2 border-[#e2d9cd] rounded-xl focus:border-[#c25e26] focus:bg-white text-center tracking-[8px] text-xl font-bold outline-none transition-all"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2 bg-white text-[#524942] border border-[#d8cec2] rounded-xl text-xs font-bold hover:bg-[#fbf9f5] cursor-pointer"
        >
          {t('admin_panel.login.back')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] py-2 bg-[#c25e26] hover:bg-[#aa4e1a] text-white rounded-xl text-xs font-bold shadow cursor-pointer"
        >
          {loading ? t('admin_panel.login.checking') : t('admin_panel.login.verify')}
        </button>
      </div>
    </form>
  );
}