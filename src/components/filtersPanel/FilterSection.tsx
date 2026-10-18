import { memo, useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';
import { isFilterActive } from './filterLogic';
import { FilterSectionProps, FilterFieldDef } from './types';

const FilterSection = memo(({ 
  categoryConfig, 
  filters = [], 
  values = {}, 
  onChange 
}: FilterSectionProps) => {
  const { t } = useTranslation('db');
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = filters.filter((f) => isFilterActive(values[f.name])).length;

  const getSelectOptions = (type: string) => {
    const isLowMedHigh = type === 'crimeLevel';
    const anyLabel = t('filter.options.any');

    if (isLowMedHigh) {
      return [
        { value: 'any', label: anyLabel },
        { value: 'low', label: t('common.enums.low') },
        { value: 'medium', label: t('common.enums.medium_level') },
        { value: 'high', label: t('common.enums.high') }
      ];
    }
    
    return [
      { value: '', label: anyLabel },
      { value: 'good', label: t('common.enums.good') },
      { value: 'medium', label: t('common.enums.medium') },
      { value: 'bad', label: t('common.enums.bad') }
    ];
  };

  const renderInput = (filter: FilterFieldDef) => {
    const value = values[filter.name];
    
    switch (filter.type) {
      case 'boolean': {
        const isChecked = !!value;
        return (
          <button
            type="button"
            role="switch"
            aria-checked={isChecked}
            disabled={filter.disabled}
            onClick={() => onChange?.(categoryConfig.key, { [filter.name]: isChecked ? undefined : true })}
            className={`
              relative inline-flex items-center h-[20px] w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
              transition-colors duration-200 ease-in-out focus:outline-hidden
              ${filter.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
              ${isChecked ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              aria-hidden="true"
              className={`
                pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 
                transition duration-200 ease-in-out
                ${isChecked ? 'translate-x-4' : 'translate-x-0'}
              `}
            />
          </button>
        );
      }

      case 'crimeLevel':
      case 'text':
        return (
          <div className="relative w-full flex justify-end">
            <select
              name={filter.name}
              value={String(value || (filter.type === 'crimeLevel' ? 'any' : ''))}
              disabled={filter.disabled}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange?.(categoryConfig.key, { [filter.name]: e.target.value })}
              className="w-full bg-transparent text-right text-[0.9rem] font-bold text-accent focus:outline-hidden appearance-none cursor-pointer pr-4"
              dir="rtl"
            >
              {getSelectOptions(filter.type).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-accent pointer-events-none" />
          </div>
        );
        
      case 'number':
      case 'price':
      case 'rating_10':
        return (
          <input
            name={filter.name}
            type="number"
            value={String(value || '')}
            disabled={filter.disabled}
            placeholder="0"
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(categoryConfig.key, { [filter.name]: e.target.value })}
            className="w-full bg-transparent text-right text-[0.95rem] font-bold text-accent placeholder:text-textSecondary placeholder:opacity-50 focus:outline-hidden p-0 border-none ring-0"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`transition-all duration-300 border-b-2 border-borderClient last:border-0 ${isOpen ? 'py-1.5' : 'py-0.5'}`}>
      <button 
        className="w-full py-2.5 px-4 flex items-center justify-between cursor-pointer outline-hidden focus:outline-hidden border-none bg-transparent group" 
        onClick={() => setIsOpen(!isOpen)} 
        type="button"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
          <div className="shrink-0 flex items-center justify-center w-9 h-9 bg-surface rounded-full shadow-xs border border-borderClient transition-transform duration-300 group-hover:scale-105">
            <span className="text-[1.25rem] leading-none">{categoryConfig.icon || '📌'}</span>
          </div>
          
          <span className={`shrink min-w-0 text-left truncate text-[1rem] font-bold tracking-wide font-heading transition-colors ${isOpen ? 'text-textMain' : 'text-textMain/70 group-hover:text-textMain'}`}>
            {t(`groups.${categoryConfig.key}`, { defaultValue: categoryConfig.labelKey || categoryConfig.key })}
          </span>
          
          {activeCount > 0 && (
            <span className="shrink-0 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs">
              {activeCount}
            </span>
          )}
        </div>
        <div className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors ${isOpen ? 'bg-borderClient' : 'bg-transparent'}`}>
          <FaChevronDown className={`text-textSecondary text-[11px] transition-transform duration-300 ${isOpen ? 'rotate-180 text-textMain' : ''}`} />
        </div>
      </button>

      {/* Content wrapper with grid animation */}
      <div 
        className="grid transition-all duration-300 ease-in-out" 
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col px-4 pb-3 pt-1">
            {filters.map((filter) => {
              return (
                <div 
                  className="flex w-full py-2.5 items-center justify-between gap-3" 
                  key={filter.name}
                >
                  <div className="flex items-center gap-2 shrink-0 min-w-0">
                    {filter.locked && (
                      <span title="Premium Feature" className="text-accent opacity-90 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                      </span>
                    )}
                    <label className={`text-[0.85rem] font-medium truncate ${filter.disabled ? 'text-textSecondary opacity-50' : 'text-textMain'}`}>
                      {t(`common.fields.${filter.name}`, { defaultValue: t(filter.name) })}
                    </label>
                  </div>
                  <div className="flex-1 flex justify-end min-w-[80px]">
                    {renderInput(filter)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

FilterSection.displayName = 'FilterSection';
export default FilterSection;
