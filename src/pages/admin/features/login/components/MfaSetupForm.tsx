import React from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { FaQrcode } from 'react-icons/fa';

interface MfaSetupFormProps {
  qrCodeUrl: string | null;
  mfaCode: string;
  setMfaCode: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function MfaSetupForm({
  qrCodeUrl,
  mfaCode,
  setMfaCode,
  loading,
  onSubmit,
  onCancel
}: MfaSetupFormProps) {
  const { t } = useTranslation('db');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="text-center p-3.5 bg-[#fbf9f5] rounded-2xl border border-dashed border-[#d8cec2]">
        <div className="flex items-center justify-center gap-1.5 mb-2 text-[#c25e26] font-bold text-xs uppercase tracking-wider">
          <FaQrcode /> {t('admin_panel.login.scan_qr')}
        </div>
        <div className="bg-white p-2 inline-block rounded-xl shadow-sm border border-[#e8e0d5]">
          {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={130} />}
        </div>
        <p className="text-[11px] text-[#7d736a] mt-2 leading-tight">
          {t('admin_panel.login.scan_desc')}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-center uppercase tracking-wider text-[#61574f]">
          {t('admin_panel.login.six_digit')}
        </label>
        <input
          type="text"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
          required
          placeholder="000 000"
          maxLength={6}
          className="w-full p-2.5 bg-[#fbf9f5] border-2 border-[#e2d9cd] rounded-xl focus:border-[#c25e26] focus:bg-white text-center tracking-[6px] text-lg font-bold outline-none transition-all"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2 bg-white text-[#524942] border border-[#d8cec2] rounded-xl text-xs font-bold hover:bg-[#fbf9f5] cursor-pointer"
        >
          {t('admin_panel.login.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] py-2 bg-[#c25e26] hover:bg-[#aa4e1a] text-white rounded-xl text-xs font-bold shadow cursor-pointer"
        >
          {loading ? t('admin_panel.login.verifying') : t('admin_panel.login.confirm')}
        </button>
      </div>
    </form>
  );
}