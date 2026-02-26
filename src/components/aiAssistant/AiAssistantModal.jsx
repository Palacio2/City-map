import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaSketch, FaCheckCircle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import styles from './AiAssistantModal.module.css';

const AI_PREFS_KEY = 'geo_analyzer_ai_prefs';

const AMENITIES_OPTIONS = [
  '🌳 Парки та природа', '🎓 Школи та садки', '🛒 Супермаркети', 
  '🏥 Медицина', '🚇 Метро/Трамвай', '☕ Кав\'ярні та ресторани', 
  '🎉 Нічне життя', '💪 Спортзали', '🚗 Зручний паркінг',
  '🏢 Коворкінги', '🐾 Майданчики для собак', '🚴 Велодоріжки'
];

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Квартира' },
  { id: 'house', label: 'Будинок / Таунхаус' },
  { id: 'room', label: 'Кімната' },
  { id: 'commercial', label: 'Комерція' }
];

const HOUSEHOLD_TYPES = [
  { id: 'single', label: 'Один / Одна' },
  { id: 'couple', label: 'Пара' },
  { id: 'family', label: 'Сім\'я з дітьми' },
  { id: 'roommates', label: 'З друзями' }
];

const DEFAULT_DATA = {
  city: '', purpose: 'living', budget: '',
  areaMin: '', areaMax: '', marketType: 'any',
  propertyType: 'apartment', rooms: '2', condition: 'any',
  household: 'single', pets: false, transport: 'public',
  amenities: [], dealbreakers: '', priorities: ''
};

export default function AiAssistantModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(AI_PREFS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          ...DEFAULT_DATA, 
          ...parsed, 
          amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [] 
        };
      }
      return DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });

  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleChipSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: current.includes(value) 
          ? current.filter(i => i !== value) 
          : [...current, value]
      };
    });
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
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

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 1: Базові параметри</h3>
            <div className={styles.inputGroup}>
              <label>Цільове місто / регіон</label>
              <input type="text" name="city" placeholder="Наприклад: Варшава, Вроцлав..." value={formData.city} onChange={handleChange} required />
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
              <label>Максимальний бюджет (або ціна оренди)</label>
              <input type="text" name="budget" placeholder="Наприклад: 500 000 PLN або 3000 PLN/міс" value={formData.budget} onChange={handleChange} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 2: Параметри нерухомості</h3>
            <div className={styles.inputGroup}>
              <label>Тип нерухомості</label>
              <div className={styles.chipsRow}>
                {PROPERTY_TYPES.map(pt => (
                  <button key={pt.id} type="button" className={`${styles.chip} ${formData.propertyType === pt.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('propertyType', pt.id)}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.rowInputs}>
              <div className={styles.inputGroup}>
                <label>Площа від (м²)</label>
                <input type="number" name="areaMin" placeholder="Мін." value={formData.areaMin} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Площа до (м²)</label>
                <input type="number" name="areaMax" placeholder="Макс." value={formData.areaMax} onChange={handleChange} />
              </div>
            </div>

            <div className={styles.rowInputs}>
              <div className={styles.inputGroup}>
                <label>Кількість кімнат</label>
                <select name="rooms" value={formData.rooms} onChange={handleChange}>
                  <option value="any">Не має значення</option>
                  <option value="1">1 (Кавалерка)</option>
                  <option value="2">2 кімнати</option>
                  <option value="3">3 кімнати</option>
                  <option value="4+">4 і більше</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Ринок</label>
                <select name="marketType" value={formData.marketType} onChange={handleChange}>
                  <option value="any">Будь-який</option>
                  <option value="primary">Первинний (Новобудови)</option>
                  <option value="secondary">Вторинний</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 3: Ваш стиль життя</h3>
            <div className={styles.inputGroup}>
              <label>Хто буде проживати?</label>
              <div className={styles.chipsRow}>
                {HOUSEHOLD_TYPES.map(ht => (
                  <button key={ht.id} type="button" className={`${styles.chip} ${formData.household === ht.id ? styles.activeChip : ''}`} onClick={() => handleChipSelect('household', ht.id)}>
                    {ht.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Основний спосіб пересування</label>
              <div className={styles.chipsRow}>
                <button type="button" className={`${styles.chip} ${formData.transport === 'public' ? styles.activeChip : ''}`} onClick={() => handleChipSelect('transport', 'public')}>Громадський транспорт</button>
                <button type="button" className={`${styles.chip} ${formData.transport === 'car' ? styles.activeChip : ''}`} onClick={() => handleChipSelect('transport', 'car')}>Власне авто</button>
              </div>
            </div>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="pets" checked={formData.pets} onChange={handleChange} />
              <span>Маю домашніх тварин (собака/кіт)</span>
            </label>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent}>
            <h3>Крок 4: Деталі та інфраструктура</h3>
            <div className={styles.inputGroup}>
              <label>Що обов'язково має бути поруч?</label>
              <div className={styles.chipsGrid}>
                {AMENITIES_OPTIONS.map(opt => (
                  <button key={opt} type="button" className={`${styles.chip} ${(formData.amenities || []).includes(opt) ? styles.activeChip : ''}`} onClick={() => toggleMultiSelect('amenities', opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Ваші "Табу" (Dealbreakers)</label>
              <input type="text" name="dealbreakers" placeholder="Наприклад: Тільки не перший поверх, без галасливих вулиць..." value={formData.dealbreakers} onChange={handleChange} />
            </div>
            <div className={styles.inputGroup}>
              <label>Додаткові побажання</label>
              <textarea name="priorities" rows="2" placeholder="Вільний опис того, що для вас ще важливо..." value={formData.priorities} onChange={handleChange} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  const modalContent = (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Закрити">
          <FaTimes />
        </button>

        {isSaved ? (
          <div className={styles.successState}>
            <FaCheckCircle className={styles.successIcon} />
            <h2>Налаштування збережено!</h2>
            <p>Тепер AI знає ваші вподобання. Запускаємо чат...</p>
          </div>
        ) : (
          <div className={styles.wizardContainer}>
            <div className={styles.header}>
              <div className={styles.iconWrapper}><FaSketch /></div>
              <h2>Персоналізація AI</h2>
              <div className={styles.progressContainer}>
                {[1, 2, 3, 4].map(num => (
                  <div key={num} className={`${styles.progressDot} ${step >= num ? styles.activeDot : ''}`} />
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.scrollableContent}>
                {renderStepContent()}
              </div>

              <div className={styles.wizardActions}>
                {step > 1 ? (
                  <button type="button" className={styles.backBtn} onClick={prevStep}>
                    <FaArrowLeft /> Назад
                  </button>
                ) : <div />}
                
                {step < 4 ? (
                  <button type="button" className={styles.nextBtn} onClick={nextStep}>
                    Далі <FaArrowRight />
                  </button>
                ) : (
                  <button type="submit" className={styles.submitBtn}>
                    Завершити
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