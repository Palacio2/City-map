// @ts-nocheck
import { memo, useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';
import { CustomCheckbox } from '@ui/CustomCheckbox';
import { CustomSelect } from '@ui/CustomSelect';
import { CustomInput } from '@ui/CustomInput';
import { isFilterActive, FilterValue } from './filterLogic';
import { DistrictCategory } from '@config/districtFields';

export interface FilterFieldDef {
  name: string;
  type: string;
  disabled?: boolean;
  locked?: boolean;
}

interface FilterSectionProps {
  readonly categoryConfig: DistrictCategory;
  readonly filters?: FilterFieldDef[];
  readonly values?: Record<string, FilterValue>;
  readonly onChange?: (categoryKey: string, data: Record<string, FilterValue>) => void;
}

const FilterSection = memo(({ 
  categoryConfig, 
  filters = [], 
  values = {}, 
  onChange 
}: FilterSectionProps) => {
  const { t } = useTranslation('db');
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = filters.filter((f) => isFilterActive(values[f.name])).length;

  const getSelectOptions = (filterName: string, type: string) => {
    const isLowMedHigh = type === 'crimeLevel';
    const anyLabel = t('filter.options.any');

    // Оновлено: використовуємо універсальні common.enums
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
      case 'boolean':
        return (
          <CustomCheckbox
            name={filter.name}
            checked={!!value}
            disabled={filter.disabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              onChange?.(categoryConfig.key, { [filter.name]: e.target.checked ? true : undefined })
            }
          />
        );

      case 'crimeLevel':
      case 'text':
        return (
          <CustomSelect
            name={filter.name}
            value={String(value || (filter.type === 'crimeLevel' ? 'any' : ''))}
            disabled={filter.disabled}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange?.(categoryConfig.key, { [filter.name]: e.target.value })}
            options={getSelectOptions(filter.name, filter.type)}
            className="ui-input !py-2 !text-[0.8rem] w-full"
          />
        );
        
      case 'number':
      case 'price':
      case 'rating_10':
        return (
          <CustomInput
            name={filter.name}
            type="number"
            value={String(value || '')}
            disabled={filter.disabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(categoryConfig.key, { [filter.name]: e.target.value })}
            className="ui-input !py-2 !text-[0.8rem] w-full"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`
      rounded-xl border transition-all duration-300 group
      ${isOpen ? 'bg-[var(--bg-body)] border-[var(--border-color)] shadow-sm' : 'bg-[var(--bg-hover)] border-[var(--border-color)]/40 hover:brightness-95 dark:hover:brightness-110'}
    `}>
      <button 
        className="w-full py-3.5 px-4 flex items-center justify-between cursor-pointer outline-none focus:outline-none focus:ring-0 border-none bg-transparent" 
        onClick={() => setIsOpen(!isOpen)} 
        type="button"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
          <div className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-300 ${isOpen ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' : 'bg-[var(--bg-body)] text-[var(--text-secondary)] group-hover:text-[var(--accent-color)]'}`}>
            <span className="text-lg leading-none">{categoryConfig.icon || '📌'}</span>
          </div>
          <span className={`shrink min-w-0 truncate text-[0.85rem] font-bold uppercase tracking-wider font-heading transition-colors ${isOpen ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-main)]'}`}>
            {t(`groups.${categoryConfig.key}`, { defaultValue: categoryConfig.labelKey || categoryConfig.key })}
          </span>
          {activeCount > 0 && (
            <span className="shrink-0 bg-[var(--accent-color)] text-white text-[10px] w-5 h-5 aspect-square rounded-full flex items-center justify-center font-bold shadow-sm">
              {activeCount}
            </span>
          )}
        </div>
        <FaChevronDown className={`shrink-0 text-[var(--text-secondary)] text-sm transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180 text-[var(--accent-color)]' : 'group-hover:text-[var(--text-main)]'}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 p-4 pt-3 mt-1 border-t border-[var(--border-color)]/30 bg-transparent">
            {filters.map((filter) => {
              const isColumn = filter.type === 'price' || filter.type === 'crimeLevel' || filter.type === 'text';
              const isBoolean = filter.type === 'boolean';
              
              return (
                <div className={`flex gap-2 w-full ${isColumn ? 'flex-col items-start' : 'items-center justify-between'}`} key={filter.name}>
                  <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                    {filter.locked && (
                      <span title="Premium Feature" className="text-[var(--accent-color)] opacity-70 flex-shrink-0">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                      </span>
                    )}
                    <label className={`text-[10px] font-bold uppercase tracking-widest font-body truncate ${filter.disabled ? 'text-[var(--text-secondary)] opacity-50' : 'text-[var(--text-secondary)]'}`}>
                      {t(`common.fields.${filter.name}`, { defaultValue: t(filter.name) })}
                    </label>
                  </div>
                  <div className={isColumn ? 'w-full mt-1' : isBoolean ? 'flex-1 flex justify-end' : 'w-1/2'}>
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
