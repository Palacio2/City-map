import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaSketch, FaCheckCircle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const AI_PREFS_KEY = 'geo_analyzer_ai_prefs';

const AMENITIES_KEYS = [
  'supermarkets', 'malls', 'gyms', 'cafes', 
  'cinemas', 'clinics', 'schools', 'universities', 
  'coworking', 'bike_paths', 'ev_charging', 'dog_parks',
  'banks', 'post_offices'
];

const DEFAULT_DATA = {
  city: '', purpose: 'living', budget: '',
  vibe: 'any', populationDensity: 'medium',
  transport: 'public', transportFrequency: 'medium', microMobility: false,
  safetyImportance: 'high', ecologyImportance: 'medium',
  amenities: [], dealbreakers: ''
};

export default function AiAssistantModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation('db');  
  const [step, setStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);

  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(AI_PREFS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_DATA, ...parsed, amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [] };
      }
      return DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });

  useEffect(() => {
    let timeoutId;
    let raf1, raf2;

    if (isOpen) {
      setShouldRender(true);
      setIsSaved(false);
      setStep(1);
      
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      
    } else if (shouldRender) {
      setIsAnimating(false);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleChipSelect = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      return { ...prev, [field]: current.includes(value) ? current.filter(i => i !== value) : [...current, value] };
    });
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem(AI_PREFS_KEY, JSON.stringify(formData));
    setIsSaved(true);
    setTimeout(() => { 
      onClose(); 
      if(onSuccess) onSuccess(); 
    }, 1500);
  };

  const ChipBtn = ({ active, onClick, label }) => (
    <button 
      type="button" 
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
        active 
          ? 'bg-accent border-accent text-white shadow-md' 
          : 'bg-surface border-borderClient text-textSecondary hover:bg-hover hover:text-textMain'
      }`}
    >
      {label}
    </button>
  );

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <h3 className="font-heading font-bold text-xl text-textMain">{t('ia.assistant.modal.step1_title')}</h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.city_label')}</label>
              <input className="ui-input" type="text" name="city" placeholder={t('ia.assistant.modal.city_placeholder')} value={formData.city} onChange={handleChange} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.purpose_label')}</label>
              <select className="ui-input" name="purpose" value={formData.purpose} onChange={handleChange}>
                <option value="living">{t('ia.assistant.modal.purpose_living')}</option>
                <option value="investment">{t('ia.assistant.modal.purpose_investment')}</option>
                <option value="commercial">{t('ia.assistant.modal.purpose_commercial')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.budget_label')}</label>
              <input className="ui-input" type="text" name="budget" placeholder={t('ia.assistant.modal.budget_placeholder')} value={formData.budget} onChange={handleChange} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <h3 className="font-heading font-bold text-xl text-textMain">{t('ia.assistant.modal.step2_title')}</h3>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.vibe_label')}</label>
              <div className="flex flex-wrap gap-2">
                {['active', 'quiet', 'nature', 'any'].map(id => (
                  <ChipBtn key={id} active={formData.vibe === id} onClick={() => handleChipSelect('vibe', id)} label={t(`ia.assistant.modal.vibe_${id}`)} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.density_label')}</label>
              <div className="flex flex-wrap gap-2">
                {['low', 'medium', 'high'].map(id => (
                  <ChipBtn key={id} active={formData.populationDensity === id} onClick={() => handleChipSelect('populationDensity', id)} label={t(`ia.assistant.modal.density_${id}`)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <h3 className="font-heading font-bold text-xl text-textMain">{t('ia.assistant.modal.step3_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.transport_label')}</label>
                <select className="ui-input" name="transport" value={formData.transport} onChange={handleChange}>
                  <option value="public">{t('ia.assistant.modal.transport_public')}</option>
                  <option value="car">{t('ia.assistant.modal.transport_car')}</option>
                  <option value="walking">{t('ia.assistant.modal.transport_walking')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.frequency_label')}</label>
                <select className="ui-input" name="transportFrequency" value={formData.transportFrequency} onChange={handleChange}>
                  <option value="high">{t('ia.assistant.modal.freq_high')}</option>
                  <option value="medium">{t('ia.assistant.modal.freq_medium')}</option>
                  <option value="low">{t('ia.assistant.modal.freq_low')}</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-3 p-4 bg-surface border border-borderClient rounded-xl cursor-pointer hover:border-accent transition-colors">
              <input type="checkbox" name="microMobility" checked={formData.microMobility} onChange={handleChange} className="w-5 h-5 rounded border-borderClient text-accent focus:ring-accent cursor-pointer" />
              <span className="text-sm font-medium text-textMain">{t('ia.assistant.modal.micro_mobility')}</span>
            </label>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <h3 className="font-heading font-bold text-xl text-textMain">{t('ia.assistant.modal.step4_title')}</h3>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.safety_label')}</label>
              <div className="flex flex-wrap gap-2">
                {['critical', 'important', 'low'].map(id => (
                  <ChipBtn key={id} active={formData.safetyImportance === id} onClick={() => handleChipSelect('safetyImportance', id)} label={t(`ia.assistant.modal.safety_${id}`)} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.ecology_label')}</label>
              <div className="flex flex-wrap gap-2">
                {['high', 'medium', 'low'].map(id => (
                  <ChipBtn key={id} active={formData.ecologyImportance === id} onClick={() => handleChipSelect('ecologyImportance', id)} label={t(`ia.assistant.modal.eco_${id}`)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <h3 className="font-heading font-bold text-xl text-textMain">{t('ia.assistant.modal.step5_title')}</h3>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.amenities_label')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES_KEYS.map(optKey => (
                  <button 
                    key={optKey} 
                    type="button" 
                    className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${(formData.amenities || []).includes(optKey) ? 'bg-accent border-accent text-white shadow-sm' : 'bg-surface border-borderClient text-textSecondary hover:bg-hover hover:text-textMain'}`} 
                    onClick={() => toggleMultiSelect('amenities', optKey)}
                  >
                    {t(`ia.assistant.modal.amenities.${optKey}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textSecondary">{t('ia.assistant.modal.dealbreakers_label')}</label>
              <input className="ui-input" type="text" name="dealbreakers" placeholder={t('ia.assistant.modal.dealbreakers_placeholder')} value={formData.dealbreakers} onChange={handleChange} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  const modalContent = (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300 ease-out ${isAnimating ? 'opacity-100 bg-black/60 backdrop-blur-sm' : 'opacity-0 bg-transparent backdrop-blur-none'}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`ui-glass-panel w-full max-w-[650px] flex flex-col max-h-[95dvh] shadow-2xl relative overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`} onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface border border-borderClient flex items-center justify-center text-textSecondary hover:text-danger hover:border-danger hover:bg-danger/10 transition-all z-20 shadow-sm" onClick={onClose} aria-label={t('ia.assistant.sidebar.tooltip_close')}>
          <FaTimes />
        </button>
        {isSaved ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <FaCheckCircle className="text-6xl text-success mb-4 animate-[bounce_1s_ease-in-out_infinite]" />
            <h2 className="ui-heading-2 !mb-2">{t('ia.assistant.modal.success_title')}</h2>
            <p className="text-textSecondary">{t('ia.assistant.modal.success_desc')}</p>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 md:p-8 border-b border-borderClient bg-surface text-center shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-hover text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                <FaSketch />
              </div>
              <h2 className="ui-heading-2 !mb-5">{t('ia.assistant.modal.title')}</h2>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} className={`flex-1 h-1.5 rounded-full transition-all duration-300 max-w-[40px] ${step >= num ? 'bg-accent shadow-[0_0_8px_var(--accent-color)]' : 'bg-borderClient'}`} />
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-body custom-scrollbar">
                {renderStepContent()}
              </div>
              <div className="p-4 md:p-6 border-t border-borderClient bg-surface flex justify-between items-center shrink-0">
                {step > 1 ? (
                  <button type="button" className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-textSecondary bg-hover hover:bg-borderClient hover:text-textMain transition-colors" onClick={prevStep}>
                    <FaArrowLeft /> {t('ia.assistant.modal.back')}
                  </button>
                ) : <div />}
                {step < 5 ? (
                  <button type="button" className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-gradient-to-br from-accent to-accent-hover hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all" onClick={nextStep}>
                    {t('ia.assistant.modal.next')} <FaArrowRight />
                  </button>
                ) : (
                  <button type="submit" className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white bg-gradient-to-br from-accent to-accent-hover hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all">
                    {t('ia.assistant.modal.finish')}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}