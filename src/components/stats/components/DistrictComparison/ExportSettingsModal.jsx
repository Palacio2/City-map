import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaFilePdf, FaCloudUploadAlt } from 'react-icons/fa';
import { storageApi } from '@api/storageApi';
import Loader from '@components/loader/Loader';

const STORAGE_KEY = 'geo_analyzer_export_settings';

const ExportSettingsModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['db', 'common']);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [formData, setFormData] = useState(() => {
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
          
          const updateStateWithData = (logoData) => {
            setFormData(prev => ({
              ...prev,
              agencyName: prev.agencyName || meta.full_name || '',
              phone: prev.phone || meta.phone || '',
              logo: prev.logo || logoData || null
            }));
            setIsLoadingProfile(false);
          };

          if (meta.avatar_url) {
            if (meta.avatar_url.startsWith('http')) {
              updateStateWithData(meta.avatar_url);
            } else {
              try {
                const blob = await storageApi.downloadFile('avatars', meta.avatar_url);
                const reader = new FileReader();
                reader.onloadend = () => updateStateWithData(reader.result);
                reader.readAsDataURL(blob);
              } catch {
                updateStateWithData(null);
              }
            }
          } else {
            updateStateWithData(null);
          }
        } catch {
          setIsLoadingProfile(false);
        }
      };
      fetchUserData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData, comments: '' }));
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900/65 backdrop-blur-md z-[1000] flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-surface p-6 sm:p-8 rounded-2xl w-full max-w-[540px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_1px_rgba(0,0,0,0.1)] border border-borderClient animate-slideUp flex flex-col gap-6">
        <div className="flex justify-between items-start border-b border-borderClient pb-5">
          <h3 className="m-0 font-heading text-[1.5rem] font-bold text-textMain tracking-tight">{t('comparison.export_modal.title')}</h3>
          <button className="bg-black/5 border-none text-textSecondary text-base cursor-pointer transition-all w-8 h-8 rounded-full flex items-center justify-center hover:bg-danger/10 hover:text-danger" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="w-full">
            <label htmlFor="logo-upload" className={`flex flex-col items-center justify-center w-full h-[140px] border-2 border-dashed border-borderClient rounded-xl cursor-pointer bg-black/5 transition-all overflow-hidden relative hover:border-accent hover:bg-accent/5 ${formData.logo ? 'border-solid border-borderClient bg-white' : ''}`}>
              {formData.logo ? (
                <div className="w-full h-full relative flex items-center justify-center p-4 group">
                  <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-200 text-white font-semibold text-[0.9rem] tracking-widest group-hover:opacity-100">
                    <span>{t('comparison.export_modal.change_logo')}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-textSecondary">
                  <FaCloudUploadAlt className="text-[2rem] text-accent opacity-80" />
                  <span className="font-semibold text-[0.95rem] text-textMain">{t('comparison.export_modal.upload_logo')}</span>
                </div>
              )}
            </label>
            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[0.8rem] font-bold text-textSecondary uppercase tracking-widest">{t('comparison.export_modal.agency_name')}</label>
            <input type="text" name="agencyName" placeholder={t('comparison.export_modal.agency_placeholder')} value={formData.agencyName} onChange={(e) => setFormData({...formData, agencyName: e.target.value})} required className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[0.8rem] font-bold text-textSecondary uppercase tracking-widest">{t('comparison.export_modal.comments')}</label>
            <textarea name="comments" rows="3" placeholder={t('comparison.export_modal.comments_placeholder')} value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})} className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all resize-y outline-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[0.8rem] font-bold text-textSecondary uppercase tracking-widest">{t('comparison.export_modal.phone')}</label>
              <input type="text" name="phone" placeholder={t('comparison.export_modal.phone_placeholder')} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.8rem] font-bold text-textSecondary uppercase tracking-widest">{t('comparison.export_modal.website')}</label>
              <input type="text" name="website" placeholder={t('comparison.export_modal.website_placeholder')} value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="w-full py-3 px-4 bg-black/5 border border-borderClient rounded-lg text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent/50 focus:bg-surface focus:border-accent focus:ring-[4px] focus:ring-accent/15" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-6 border-t border-borderClient">
            <button type="button" className="order-2 sm:order-none p-3.5 rounded-lg bg-transparent text-textMain border border-borderClient font-semibold font-heading cursor-pointer transition-all text-[0.9rem] hover:bg-black/5 hover:border-textSecondary" onClick={onClose}>
              {t('common:actions.cancel')}
            </button>
            <button type="submit" className="order-1 sm:order-none p-3.5 rounded-lg bg-gradient-to-br from-accent to-accent-hover text-white border-none font-semibold font-heading cursor-pointer transition-all flex items-center justify-center gap-2 text-[0.9rem] shadow-[0_4px_12px_rgba(197,164,126,0.25)] hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_6px_16px_rgba(197,164,126,0.35)] disabled:opacity-70 disabled:cursor-not-allowed" disabled={isLoadingProfile}>
              {isLoadingProfile ? <Loader size="small" /> : <><FaFilePdf /> {t('comparison.export_modal.export_btn')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportSettingsModal;