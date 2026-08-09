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
    const anyLabel = t('filter.options.any', { defaultValue: 'Будь-який' });

    // Оновлено: використовуємо універсальні common.enums
    if (isLowMedHigh) {
      return [
        { value: 'any', label: anyLabel },
        { value: 'low', label: t('common.enums.low', { defaultValue: 'Низький' }) },
        { value: 'medium', label: t('common.enums.medium', { defaultValue: 'Середній' }) },
        { value: 'high', label: t('common.enums.high', { defaultValue: 'Високий' }) }
      ];
    }
    
    return [
      { value: '', label: anyLabel },
      { value: 'good', label: t('common.enums.good', { defaultValue: 'Добре' }) },
      { value: 'medium', label: t('common.enums.medium', { defaultValue: 'Середньо' }) },
      { value: 'bad', label: t('common.enums.bad', { defaultValue: 'Погано' }) }
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
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-300 ${isOpen ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' : 'bg-[var(--bg-body)] text-[var(--text-secondary)] group-hover:text-[var(--accent-color)]'}`}>
            <span className="text-lg leading-none">{categoryConfig.icon || '📌'}</span>
          </div>
          {/* ОНОВЛЕНО: Використовуємо groups. замість filter.categories. */}
          <span className={`text-[0.85rem] font-bold uppercase tracking-wider font-heading transition-colors ${isOpen ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-main)]'}`}>
            {t(`groups.${categoryConfig.key}`, { defaultValue: categoryConfig.labelKey || categoryConfig.key })}
          </span>
          {activeCount > 0 && (
            <span className="bg-[var(--accent-color)] text-white text-[10px] w-5 h-5 aspect-square rounded-full flex items-center justify-center font-bold shadow-sm">
              {activeCount}
            </span>
          )}
        </div>
        <FaChevronDown className={`text-[var(--text-secondary)] text-sm transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180 text-[var(--accent-color)]' : 'group-hover:text-[var(--text-main)]'}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 p-4 pt-3 mt-1 border-t border-[var(--border-color)]/30 bg-transparent">
            {filters.map((filter) => {
              const isColumn = filter.type === 'price' || filter.type === 'crimeLevel' || filter.type === 'text';
              const isBoolean = filter.type === 'boolean';
              
              return (
                <div className={`flex gap-2 w-full ${isColumn ? 'flex-col items-start' : 'items-center justify-between'}`} key={filter.name}>
                  {/* ОНОВЛЕНО: Використовуємо common.fields. замість filter.fields. */}
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] font-body whitespace-nowrap">
                    {t(`common.fields.${filter.name}`, { defaultValue: t(filter.name) })}
                  </label>
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
