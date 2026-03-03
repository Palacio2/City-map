import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaSketch, FaCheckCircle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import styles from './AiAssistantModal.module.css';

const AI_PREFS_KEY = 'geo_analyzer_ai_prefs';

const AMENITIES_OPTIONS = [
  '🛒 Супермаркети та ринки', '🛍 Торгові центри', 
  '💪 Спортзали та басейни', '☕ Кав\'ярні та ресторани', 
  '🍿 Кінотеатри та театри', '🏥 Медичні клініки/лікарні', 
  '🎓 Школи та садки', '🎓 Університети', 
  '🏢 Коворкінги', '🚴 Велодоріжки', 
  '⚡ Зарядки для електромобілів', '🐾 Майданчики для собак',
  '🏦 Банки та банкомати', '📦 Поштомати / Відділення'
];

const DEFAULT_DATA = {
  city: '', purpose: 'living', budget: '',
  vibe: 'any', populationDensity: 'medium',
  transport: 'public', transportFrequency: 'medium', microMobility: false,
  safetyImportance: 'high', ecologyImportance: 'medium',
  amenities: [], dealbreakers: ''
};

export default function AiAssistantModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
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
            <h3>Крок 1: Базові параметри</h3>
            <div className={styles.inputGroup}>
              <label>Цільове місто / регіон</label>
              <input type="text" name="city" placeholder="Наприклад: Варшава, Київ..." value={formData.city} onChange={handleChange} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Мета пошуку</label>
              <select name="purpose" value={formData.purpose} onChange={handleChange}>
                <option value="living">Для власного проживання</option>
                <option value="investment">Інвестиція / Оренда</option>
                <option value="commercial">Для бізнесу</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Орієнтовний бюджет району (ціна купівлі або оренди)</label>
              <input type="text" name="budget" placeholder="Напр.: 5000 PLN/міс або Середній сегмент" value={formData.budget} onChange={handleChange} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 2: Атмосфера та Соціум</h3>
            <div className={styles.inputGroup}>
              <label>Яка атмосфера району вам підходить?</label>
              <div className={styles.chipsRow}>
                {[{id: 'active', label: 'Активний центр'}, {id: 'quiet', label: 'Тихий спальний'}, {id: 'nature', label: 'Ближче до природи'}, {id: 'any', label: 'Не має значення'}].map(v => (
                  <button key={v.id} type="button" className={`${styles.chip} ${formData.vibe === v.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('vibe', v.id)}>{v.label}</button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Щільність населення (забудова)</label>
              <div className={styles.chipsRow}>
                {[{id: 'low', label: 'Низька (приватні будинки, таунхауси)'}, {id: 'medium', label: 'Середня'}, {id: 'high', label: 'Висока (багатоповерхівки)'}].map(d => (
                  <button key={d.id} type="button" className={`${styles.chip} ${formData.populationDensity === d.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('populationDensity', d.id)}>{d.label}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 3: Мобільність та Транспорт</h3>
            <div className={styles.rowInputs}>
              <div className={styles.inputGroup}>
                <label>Основний транспорт</label>
                <select name="transport" value={formData.transport} onChange={handleChange}>
                  <option value="public">Громадський</option>
                  <option value="car">Власне авто</option>
                  <option value="walking">Пішки</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Бажана частота курсування</label>
                <select name="transportFrequency" value={formData.transportFrequency} onChange={handleChange}>
                  <option value="high">Дуже часто (кожні 5-10 хв)</option>
                  <option value="medium">Середньо (15-20 хв)</option>
                  <option value="low">Не принципово</option>
                </select>
              </div>
            </div>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="microMobility" checked={formData.microMobility} onChange={handleChange} />
              <span>Користуюсь мікромобільністю (електросамокати, велосипеди)</span>
            </label>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 4: Середовище та Безпека</h3>
            <div className={styles.inputGroup}>
              <label>Наскільки важлива безпека (камери, патрулі, освітлення)?</label>
              <div className={styles.chipsRow}>
                {['Критично', 'Важливо', 'Не в пріоритеті'].map(s => (
                  <button key={s} type="button" className={`${styles.chip} ${formData.safetyImportance === s ? styles.activeChip : ''}`} onClick={() => handleChipSelect('safetyImportance', s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Екологія (якість повітря, парки, озеленення)</label>
              <div className={styles.chipsRow}>
                {['Дуже важливо', 'Бажано', 'Все одно'].map(e => (
                  <button key={e} type="button" className={`${styles.chip} ${formData.ecologyImportance === e ? styles.activeChip : ''}`} onClick={() => handleChipSelect('ecologyImportance', e)}>{e}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 5: Інфраструктура району</h3>
            <div className={styles.inputGroup}>
              <label>Що обов'язково має бути в районі?</label>
              <div className={styles.chipsGrid}>
                {AMENITIES_OPTIONS.map(opt => (
                  <button key={opt} type="button" className={`${styles.chip} ${(formData.amenities || []).includes(opt) ? styles.activeChip : ''}`} onClick={() => toggleMultiSelect('amenities', opt)}>{opt}</button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Ваші "Табу" щодо району</label>
              <input type="text" name="dealbreakers" placeholder="Напр.: високий рівень безробіття, індустріальні зони..." value={formData.dealbreakers} onChange={handleChange} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  const modalContent = (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Закрити"><FaTimes /></button>
        {isSaved ? (
          <div className={styles.successState}>
            <FaCheckCircle className={styles.successIcon} />
            <h2>Налаштування збережено!</h2>
            <p>Тепер AI знає, які райони вам підходять. Запускаємо чат...</p>
          </div>
        ) : (
          <div className={styles.wizardContainer}>
            <div className={styles.header}>
              <div className={styles.iconWrapper}><FaSketch /></div>
              <h2>Критерії пошуку районів</h2>
              <div className={styles.progressContainer}>
                {[1, 2, 3, 4, 5].map(num => <div key={num} className={`${styles.progressDot} ${step >= num ? styles.activeDot : ''}`} />)}
              </div>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.scrollableContent}>{renderStepContent()}</div>
              <div className={styles.wizardActions}>
                {step > 1 ? <button type="button" className={styles.backBtn} onClick={prevStep}><FaArrowLeft /> Назад</button> : <div />}
                {step < 5 ? <button type="button" className={styles.nextBtn} onClick={nextStep}>Далі <FaArrowRight /></button> : <button type="submit" className={styles.submitBtn}>Завершити</button>}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}