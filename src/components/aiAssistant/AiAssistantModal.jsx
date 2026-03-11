import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaSketch, FaCheckCircle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './AiAssistantModal.module.css';

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
  const { t, i18n } = useTranslation('assistant');  const [step, setStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);

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
    if (isOpen) { setIsSaved(false); setStep(1); }
  }, [isOpen]);

  if (!isOpen) return null;

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
    setTimeout(() => { onClose(); if(onSuccess) onSuccess(); }, 1500);
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h3>{t('modal.step1_title')}</h3>
            <div className={styles.inputGroup}>
              <label>{t('modal.city_label')}</label>
              <input type="text" name="city" placeholder={t('modal.city_placeholder')} value={formData.city} onChange={handleChange} required />
            </div>
            <div className={styles.inputGroup}>
              <label>{t('modal.purpose_label')}</label>
              <select name="purpose" value={formData.purpose} onChange={handleChange}>
                <option value="living">{t('modal.purpose_living')}</option>
                <option value="investment">{t('modal.purpose_investment')}</option>
                <option value="commercial">{t('modal.purpose_commercial')}</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>{t('modal.budget_label')}</label>
              <input type="text" name="budget" placeholder={t('modal.budget_placeholder')} value={formData.budget} onChange={handleChange} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h3>{t('modal.step2_title')}</h3>
            <div className={styles.inputGroup}>
              <label>{t('modal.vibe_label')}</label>
              <div className={styles.chipsRow}>
                {[
                  {id: 'active', label: t('modal.vibe_active')}, 
                  {id: 'quiet', label: t('modal.vibe_quiet')}, 
                  {id: 'nature', label: t('modal.vibe_nature')}, 
                  {id: 'any', label: t('modal.vibe_any')}
                ].map(v => (
                  <button key={v.id} type="button" className={`${styles.chip} ${formData.vibe === v.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('vibe', v.id)}>{v.label}</button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>{t('modal.density_label')}</label>
              <div className={styles.chipsRow}>
                {[
                  {id: 'low', label: t('modal.density_low')}, 
                  {id: 'medium', label: t('modal.density_medium')}, 
                  {id: 'high', label: t('modal.density_high')}
                ].map(d => (
                  <button key={d.id} type="button" className={`${styles.chip} ${formData.populationDensity === d.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('populationDensity', d.id)}>{d.label}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <h3>{t('modal.step3_title')}</h3>
            <div className={styles.rowInputs}>
              <div className={styles.inputGroup}>
                <label>{t('modal.transport_label')}</label>
                <select name="transport" value={formData.transport} onChange={handleChange}>
                  <option value="public">{t('modal.transport_public')}</option>
                  <option value="car">{t('modal.transport_car')}</option>
                  <option value="walking">{t('modal.transport_walking')}</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>{t('modal.frequency_label')}</label>
                <select name="transportFrequency" value={formData.transportFrequency} onChange={handleChange}>
                  <option value="high">{t('modal.freq_high')}</option>
                  <option value="medium">{t('modal.freq_medium')}</option>
                  <option value="low">{t('modal.freq_low')}</option>
                </select>
              </div>
            </div>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="microMobility" checked={formData.microMobility} onChange={handleChange} />
              <span>{t('modal.micro_mobility')}</span>
            </label>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent}>
            <h3>{t('modal.step4_title')}</h3>
            <div className={styles.inputGroup}>
              <label>{t('modal.safety_label')}</label>
              <div className={styles.chipsRow}>
                {[
                  {id: 'critical', label: t('modal.safety_critical')}, 
                  {id: 'important', label: t('modal.safety_important')}, 
                  {id: 'low', label: t('modal.safety_low')}
                ].map(s => (
                  <button key={s.id} type="button" className={`${styles.chip} ${formData.safetyImportance === s.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('safetyImportance', s.id)}>{s.label}</button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>{t('modal.ecology_label')}</label>
              <div className={styles.chipsRow}>
                {[
                  {id: 'high', label: t('modal.eco_high')}, 
                  {id: 'medium', label: t('modal.eco_medium')}, 
                  {id: 'low', label: t('modal.eco_low')}
                ].map(e => (
                  <button key={e.id} type="button" className={`${styles.chip} ${formData.ecologyImportance === e.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('ecologyImportance', e.id)}>{e.label}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className={styles.stepContent}>
            <h3>{t('modal.step5_title')}</h3>
            <div className={styles.inputGroup}>
              <label>{t('modal.amenities_label')}</label>
              <div className={styles.chipsGrid}>
                {AMENITIES_KEYS.map(optKey => (
                  <button key={optKey} type="button" className={`${styles.chip} ${(formData.amenities || []).includes(optKey) ? styles.activeChip : ''}`} onClick={() => toggleMultiSelect('amenities', optKey)}>{t(`modal.amenities.${optKey}`)}</button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>{t('modal.dealbreakers_label')}</label>
              <input type="text" name="dealbreakers" placeholder={t('modal.dealbreakers_placeholder')} value={formData.dealbreakers} onChange={handleChange} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  const modalContent = (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label={t('sidebar.tooltip_close')}><FaTimes /></button>
        {isSaved ? (
          <div className={styles.successState}>
            <FaCheckCircle className={styles.successIcon} />
            <h2>{t('modal.success_title')}</h2>
            <p>{t('modal.success_desc')}</p>
          </div>
        ) : (
          <div className={styles.wizardContainer}>
            <div className={styles.header}>
              <div className={styles.iconWrapper}><FaSketch /></div>
              <h2>{t('modal.title')}</h2>
              <div className={styles.progressContainer}>
                {[1, 2, 3, 4, 5].map(num => <div key={num} className={`${styles.progressDot} ${step >= num ? styles.activeDot : ''}`} />)}
              </div>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.scrollableContent}>{renderStepContent()}</div>
              <div className={styles.wizardActions}>
                {step > 1 ? <button type="button" className={styles.backBtn} onClick={prevStep}><FaArrowLeft /> {t('modal.back')}</button> : <div />}
                {step < 5 ? <button type="button" className={styles.nextBtn} onClick={nextStep}>{t('modal.next')} <FaArrowRight /></button> : <button type="submit" className={styles.submitBtn}>{t('modal.finish')}</button>}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}