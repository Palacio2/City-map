import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

interface CredentialsFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CredentialsForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit
}: CredentialsFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation('db');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5 animate-fadeIn">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-[#61574f] dark:text-[#b8ada2] uppercase tracking-wider">
          {t('admin_panel.login.email')}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a69c92]">
            <FaEnvelope className="text-xs" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@citymaps.com"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2d9cd] dark:border-[#423932] text-sm text-[#2a2421] dark:text-[#faf7f2] placeholder-[#b8ada2] bg-white dark:bg-[#1a1614] focus:outline-none focus:border-[#c25e26] focus:ring-4 focus:ring-[#c25e26]/10 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-[#61574f] dark:text-[#b8ada2] uppercase tracking-wider">
            {t('admin_panel.login.password')}
          </label>
          <a href="#forgot" className="text-[11px] font-semibold text-[#c25e26] hover:underline">
            {t('admin_panel.login.forgot')}
          </a>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a69c92]">
            <FaLock className="text-xs" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#e2d9cd] dark:border-[#423932] text-sm text-[#2a2421] dark:text-[#faf7f2] placeholder-[#b8ada2] bg-white dark:bg-[#1a1614] focus:outline-none focus:border-[#c25e26] focus:ring-4 focus:ring-[#c25e26]/10 transition-all font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#a69c92] hover:text-[#c25e26] transition-colors cursor-pointer"
          >
            {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 px-4 bg-[#c25e26] hover:bg-[#aa4e1a] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          t('admin_panel.login.sign_in')
        )}
      </button>
    </form>
  );
}