import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaFilePdf, FaCloudUploadAlt } from 'react-icons/fa';
import { storageApi } from '@api/storageApi';
import Loader from '@components/loader/Loader';

const STORAGE_KEY = 'geo_analyzer_export_settings';

export interface ExportCustomData {
  agencyName: string;
  phone: string;
  website: string;
  comments: string;
  logo: string | ArrayBuffer | null;
}

interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ExportCustomData) => void;
}

export default function ExportSettingsModal({ isOpen, onClose, onConfirm }: ExportSettingsModalProps) {
  const { t } = useTranslation(['db', 'common']);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [formData, setFormData] = useState<ExportCustomData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { agencyName: '', phone: '', website: '', comments: '', logo: null };
    } catch {
      return { agencyName: '', phone: '', website: '', comments: '', logo: null };
    }
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, comments: '' }));
      const fetchUserData = async () => {
        setIsLoadingProfile(true);
        try {
          const meta = await storageApi.getUserMetadata();
          
          const updateStateWithData = (logoData: string | null) => {
            setFormData(prev => ({
              ...prev,
              agencyName: prev.agencyName || meta.full_name || '',
              phone: prev.phone || meta.phone || '',
              logo: prev.logo || logoData || null
            }));
          };

          if (meta.avatar_url && !formData.logo) {
            const signedUrl = await storageApi.getSignedUrl('avatars', meta.avatar_url);
            updateStateWithData(signedUrl);
          } else {
            updateStateWithData(null);
          }
        } catch {
           // silently ignore
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchUserData();
    }
  }, [isOpen]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData, comments: '' }; 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    onConfirm(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-body rounded-2xl w-full max-w-[600px] flex flex-col relative shadow-modal border border-borderClient animate-popIn max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-6 border-b border-borderClient bg-surface shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3 text-textMain font-heading font-bold text-xl">
            <FaFilePdf className="text-accent text-2xl" />
            {t('comparison.export_settings_title')}
          </div>
          <button type="button" className="bg-transparent border-none w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-textSecondary transition-colors hover:bg-danger/10 hover:text-danger" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {isLoadingProfile ? (
           <div className="p-12 flex justify-center"><Loader size="medium" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
            <div className="bg-surface border border-borderClient rounded-xl p-5 flex flex-col gap-4">
              <h4 className="text-[0.8rem] font-bold uppercase tracking-widest text-textSecondary m-0 border-b border-borderClient pb-2">{t('comparison.branding')}</h4>
              
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="flex flex-col gap-2 w-full sm:w-[120px] shrink-0">
                  <span className="text-[0.85rem] font-semibold text-textMain">{t('comparison.logo')}</span>
                  <div className="w-full sm:w-[120px] h-[120px] border-2 border-dashed border-borderClient rounded-xl flex items-center justify-center relative overflow-hidden bg-body group transition-colors hover:border-accent">
                    {formData.logo ? (
                      <img src={formData.logo as string} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-textSecondary flex flex-col items-center gap-2">
                        <FaCloudUploadAlt className="text-2xl opacity-50 group-hover:text-accent group-hover:opacity-100 transition-colors" />
                        <span className="text-xs uppercase tracking-wider font-semibold">{t('common:actions.upload')}</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  {formData.logo && (
                    <button type="button" onClick={() => setFormData(prev => ({...prev, logo: null}))} className="text-xs text-danger font-semibold bg-transparent border-none cursor-pointer hover:underline mt-1">
                      {t('common:actions.remove')}
                    </button>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.85rem] font-semibold text-textMain">{t('comparison.agency_name')}</label>
                    <input type="text" value={formData.agencyName} onChange={e => setFormData({...formData, agencyName: e.target.value})} className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" placeholder="NextHome Real Estate" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.85rem] font-semibold text-textMain">{t('profile.labels.phone')}</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" placeholder="+380 50 123 4567" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-textMain">{t('comparison.website')}</label>
                <input type="text" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" placeholder="www.agency.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-textMain">{t('comparison.comments')} <span className="text-textSecondary font-normal">({t('comparison.optional')})</span></label>
                <textarea rows={3} placeholder={t('comparison.comments_placeholder')} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all outline-none resize-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-6 border-t border-borderClient">
              <button type="button" className="order-2 sm:order-none p-3.5 rounded-lg bg-transparent text-textMain border border-borderClient font-semibold font-heading cursor-pointer transition-all text-[0.9rem] hover:bg-black/5 hover:border-textSecondary" onClick={onClose}>
                {t('common:actions.cancel')}
              </button>
              <button type="submit" className="order-1 sm:order-none p-3.5 rounded-lg bg-gradient-to-br from-accent to-accent-hover text-white border-none font-semibold font-heading cursor-pointer transition-all flex items-center justify-center gap-2 text-[0.9rem] shadow-[0_4px_12px_rgba(197,164,126,0.25)] hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_6px_16px_rgba(197,164,126,0.4)] active:translate-y-0">
                <FaFilePdf /> {t('comparison.generate_pdf')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}