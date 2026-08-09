import { useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaRobot } from 'react-icons/fa';
import { useAiPreferences } from './hooks/useAiPreferences';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import type { AiAssistantModalProps, AiPreferences } from './types';

export default function AiAssistantModal({ isOpen, onClose, onSuccess }: AiAssistantModalProps) {
  const { t } = useTranslation('db');
  const { savePreferences } = useAiPreferences();

  const [prefs, setPrefs] = useState<Partial<AiPreferences>>({
    city: '',
    budget: '',
    purpose: 'living'
  });

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    savePreferences(prefs as AiPreferences);
    onClose();
    onSuccess();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface w-full max-w-[500px] rounded-3xl shadow-modal flex flex-col overflow-hidden border border-borderClient animate-slideUpModal">
        <header className="p-6 border-b border-borderClient flex justify-between items-center bg-body/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl">
              <FaRobot />
            </div>
            <h2 className="font-heading font-bold text-xl m-0 text-textMain">
              {t('ia.assistant.modal.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-textSecondary hover:bg-hover hover:text-danger transition-colors cursor-pointer"
          >
            <FaTimes />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-textMain">{t('ia.assistant.modal.city_label')}</label>
            <input
              type="text"
              value={prefs.city}
              onChange={e => setPrefs(prev => ({ ...prev, city: e.target.value }))}
              placeholder={t('ia.assistant.modal.city_placeholder')}
              className="w-full px-4 py-3 rounded-xl border border-borderClient bg-body text-textMain focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-textMain">{t('ia.assistant.modal.purpose_label')}</label>
            <select
              value={prefs.purpose}
              onChange={e => setPrefs(prev => ({ ...prev, purpose: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-borderClient bg-body text-textMain focus:outline-none focus:border-accent cursor-pointer"
              required
            >
              <option value="living">{t('ia.assistant.modal.purpose_living')}</option>
              <option value="investment">{t('ia.assistant.modal.purpose_investment')}</option>
              <option value="commercial">{t('ia.assistant.modal.purpose_commercial')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-textMain">{t('ia.assistant.modal.budget_label')}</label>
            <input
              type="text"
              value={prefs.budget}
              onChange={e => setPrefs(prev => ({ ...prev, budget: e.target.value }))}
              placeholder={t('ia.assistant.modal.budget_placeholder')}
              className="w-full px-4 py-3 rounded-xl border border-borderClient bg-body text-textMain focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-4 rounded-xl bg-accent text-white font-bold uppercase tracking-widest text-sm hover:bg-accent-hover transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            {t('ia.assistant.modal.finish')}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}