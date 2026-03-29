import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBus, FaHospital, FaShoppingCart, FaSchool, FaTree, FaBolt, FaShieldAlt, FaChevronDown } from 'react-icons/fa';

const ICONS = {
  transport: <FaBus />, medicine: <FaHospital />, commerce: <FaShoppingCart />,
  education: <FaSchool />, social: <FaTree />, safety: <FaShieldAlt />, utilities: <FaBolt />
};

const FilterSection = memo(({ categoryKey, filters = [], values = {}, onChange }) => {
  const { t } = useTranslation(['db', 'common']);
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = filters.filter(f => {
    const val = values[f.name];
    return val !== undefined && val !== null && val !== false && val !== '' && val !== 'any' && val !== '0' && val !== 0;
  }).length;

  const renderInput = (filter) => {
    const isSelect = ['airQuality', 'crimeLevel', 'transportFrequency'].includes(filter.name);
    const isNumericInput = ['propertyPricePerSqm', 'costPerSqm', 'transportAvgDistance', 'avgParkSize'].includes(filter.name);
    const isLowMedHigh = ['crimeLevel', 'transportFrequency'].includes(filter.name);

    if (isSelect) {
      return (
        <select
          name={filter.name}
          value={values[filter.name] || (isLowMedHigh ? 'any' : '')}
          onChange={(e) => onChange?.({ [filter.name]: e.target.value })}
          className="w-full py-3 px-4 rounded-lg border border-borderClient bg-surface font-body text-[0.95rem] text-textMain cursor-pointer transition-all outline-none hover:border-accent focus:border-accent focus:ring-[3px] focus:ring-accent/10 appearance-none bg-no-repeat bg-[position:right_1rem_center] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20fill=%22none%22%20viewBox=%220%200%2024%2024%22%20stroke=%22%23c5a47e%22%3E%3Cpath%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20stroke-width=%222%22%20d=%22M19%209l-7%207-7-7%22%3E%3C/path%3E%3C/svg%3E')]"
        >
          <option value={isLowMedHigh ? 'any' : ''}>{t('filters.options.any')}</option>
          {isLowMedHigh ? (
            <>
              <option value="low">{t('common:enums.low')}</option>
              <option value="medium">{t('common:enums.medium')}</option>
              <option value="high">{t('common:enums.high')}</option>
            </>
          ) : (
            <>
              <option value="good">{t('common:enums.good')}</option>
              <option value="medium">{t('common:enums.medium')}</option>
              <option value="bad">{t('common:enums.bad')}</option>
            </>
          )}
        </select>
      );
    }

    if (isNumericInput) {
      return (
        <input
          type="number"
          name={filter.name}
          value={values[filter.name] || ''}
          onChange={(e) => onChange?.({ [filter.name]: e.target.value })}
          className="w-full py-3 px-4 rounded-lg border border-borderClient bg-surface text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent focus:border-accent focus:ring-[3px] focus:ring-accent/10"
          placeholder="0"
          min="0"
        />
      );
    }

    // НАДІЙНИЙ ЧЕКБОКС: Використовуємо кастомну SVG галочку та явні кольори бордера
    return (
      <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
        <input
          type="checkbox"
          name={filter.name}
          checked={!!values[filter.name]}
          onChange={(e) => onChange?.({ [filter.name]: e.target.checked })}
          className="peer appearance-none m-0 w-5 h-5 rounded-[4px] border-2 border-solid border-[color:var(--text-secondary)] bg-transparent transition-all cursor-pointer checked:bg-accent checked:border-accent group-hover:border-accent"
        />
        <svg 
          className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" 
          viewBox="0 0 14 10" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  };

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'bg-surface border-accent shadow-[0_8px_24px_rgba(0,0,0,0.06)]' : 'bg-hover border-transparent hover:border-borderClient'}`}>
      <button 
        className="w-full m-0 py-[1.1rem] px-5 bg-transparent border-none flex items-center justify-between cursor-pointer outline-none transition-all" 
        onClick={() => setIsOpen(!isOpen)} 
        type="button"
      >
        <div className="flex items-center gap-3 font-heading text-[0.95rem] font-bold text-textMain uppercase tracking-widest">
          <span className={`text-[1.15rem] flex items-center transition-colors duration-300 ${isOpen ? 'text-accent' : 'text-textSecondary'}`}>
            {ICONS[categoryKey]}
          </span>
          {t(`common:categories.${categoryKey}`)}
          {activeCount > 0 && (
            <span className="bg-accent text-white text-[0.75rem] font-semibold w-5 h-5 rounded-full flex items-center justify-center font-body shadow-[0_2px_5px_rgba(197,164,126,0.3)]">
              {activeCount}
            </span>
          )}
        </div>
        <FaChevronDown className={`text-textSecondary transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] text-[0.9rem] ${isOpen ? 'rotate-180 text-accent' : ''}`} />
      </button>

      <div className={`grid transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`} aria-expanded={isOpen}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 flex flex-col gap-1.5">
            {filters.map((filter) => {
              const isColumn = ['propertyPricePerSqm', 'costPerSqm', 'transportAvgDistance', 'avgParkSize', 'airQuality', 'crimeLevel', 'transportFrequency'].includes(filter.name);
              
              // ДОДАНО group КЛАС: тепер при наведенні на текст або весь рядок, чекбокс теж реагує
              return (
                <label 
                  className={`group flex items-center gap-3 cursor-pointer text-[0.95rem] text-textMain transition-all select-none font-body min-h-[40px] px-2 py-1.5 -mx-2 rounded-lg hover:bg-hover ${isColumn ? 'flex-col items-start gap-2 pt-4 px-2 pb-2 w-[calc(100%+16px)] border-t border-dashed border-borderClient mt-2 first:border-t-0 first:mt-0 first:pt-2 hover:bg-transparent' : ''}`} 
                  key={filter.name}
                >
                  {isColumn ? (
                    <>
                      <span className="font-semibold text-[0.85rem]">{t(`common:fields.${filter.name}`)}</span>
                      {renderInput(filter)}
                    </>
                  ) : (
                    <>
                      {renderInput(filter)}
                      <span className="font-medium">{t(`common:fields.${filter.name}`)}</span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default FilterSection;