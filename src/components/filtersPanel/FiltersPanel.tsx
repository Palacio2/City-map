import { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/pages/subscription/contex/SubscriptionContext';
import GenericCategoryFilter from './GenericCategoryFilter'; 
import { FaFilter, FaChevronDown, FaSpinner } from 'react-icons/fa';
import { Filters, FilterValue } from './filterLogic';
import { useFiltersConfig } from '@hooks/useFiltersConfig';

import { FEATURES_CONFIG } from '@config/features';

const FREE_ALLOWED_CATEGORIES = new Set<string>(FEATURES_CONFIG.FREE_ALLOWED_CATEGORIES);

interface FiltersPanelProps {
  readonly onFiltersChange: (filters: Filters) => void;
  readonly selectedFilters?: Filters;
  readonly allowedCategories?: string[] | null;
}

const FiltersPanel = memo(({ 
  onFiltersChange, 
  selectedFilters = {}, 
  allowedCategories = null 
}: FiltersPanelProps) => {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const { isFree, isRealtor } = useSubscription(); 
  const [localFilters, setLocalFilters] = useState<Filters>(selectedFilters);
  const [isMobileOpen, setIsMobileOpen] = useState(false); 

  const { config, isLoading } = useFiltersConfig();

  useEffect(() => {
    setLocalFilters(selectedFilters);
  }, [selectedFilters]);

  const countActiveFilters = (filtersObj: Filters) => {
    let count = 0;
    Object.values(filtersObj).forEach(section => {
      Object.values(section).forEach(val => {
        if (val !== undefined && val !== null && val !== '' && val !== false) {
          count++;
        }
      });
    });
    return count;
  };

  const updateFilters = useCallback((section: string, newSectionData: Record<string, FilterValue>) => {
    const updated = { 
      ...localFilters, 
      [section]: { ...localFilters[section], ...newSectionData } 
    };
    
    if (isFree) {
      const newCount = countActiveFilters(updated);
      if (newCount > FEATURES_CONFIG.FREE_FILTERS_LIMIT) {
        // Just block it, no alert, no redirect
        return; 
      }
    }

    setLocalFilters(updated);
    
    setTimeout(() => {
      onFiltersChange(updated);
    }, 0);
  }, [localFilters, onFiltersChange, isFree]);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <aside className={`
      ui-glass-panel w-full lg:w-[340px] flex flex-col overflow-hidden 
      transition-all duration-500 ease-in-out
      lg:sticky lg:top-[calc(var(--header-height)+20px)] lg:h-[calc(100vh-var(--header-height)-40px)]
      ${isMobileOpen ? 'max-h-[85vh]' : 'max-h-[70px] lg:max-h-none'}
    `}>
      <div className="w-full p-5 flex justify-between items-center bg-transparent border-b border-[var(--border-color)]/30 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <FaFilter className="text-[var(--accent-color)]" />
          <h2 className="m-0 text-lg uppercase tracking-widest font-bold font-heading">{t('filter.panel.title')}</h2>
        </div>
        <button 
          type="button"
          className="lg:hidden bg-transparent border-none p-2 cursor-pointer flex items-center justify-center outline-none"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <FaChevronDown className={`text-[var(--text-secondary)] transition-transform duration-500 ease-in-out ${isMobileOpen ? 'rotate-180 text-[var(--accent-color)]' : ''}`} />
        </button>
      </div>

      <div className={`
        flex-1 overflow-y-auto [scrollbar-gutter:stable] custom-scrollbar px-4 py-3 flex flex-col gap-3 min-h-0
        transition-all duration-500 ease-in-out
        ${isMobileOpen 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4 pointer-events-none lg:pointer-events-auto lg:opacity-100 lg:translate-y-0'
        }
      `}>
        {isLoading && (
          <div className="flex justify-center items-center py-10 text-[var(--accent-color)]">
            <FaSpinner className="animate-spin text-2xl" />
          </div>
        )}

        {config && Object.values(config).map(category => {
          const isVisible = (!isFree || FREE_ALLOWED_CATEGORIES.has(category.key)) && (!allowedCategories || allowedCategories.includes(category.key));
          if (!isVisible) return null;

          return (
            <GenericCategoryFilter
              key={category.key}
              categoryConfig={category}
              values={localFilters[category.key] || {}}
              onChange={updateFilters}
              isFree={isFree}
              isRealtor={isRealtor}
            />
          );
        })}

        {(isFree && FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE) && (
          <div className="mt-4 p-5 rounded-2xl bg-[var(--bg-body)] border border-dashed border-[var(--border-accent)] text-center shrink-0">
            <h4 className="text-sm font-bold mb-2 uppercase tracking-tighter font-heading">{t('filter.panel.banner_title')}</h4>
            <p className="text-xs text-[var(--text-secondary)] mb-4 font-body">{t('filter.panel.banner_text')}</p>
            <button 
              className="ui-button-primary !py-2.5 !px-4 !text-[0.7rem] w-full"
              onClick={() => navigate('/subscription')}
            >
              {t('filter.panel.view_tariffs')}
            </button>
          </div>
        )}
      </div>

      <div className={`
        shrink-0 px-4 pb-4 pt-4 border-t border-[var(--border-color)] bg-transparent
        transition-all duration-500 ease-in-out
        ${isMobileOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}
      `}>
        <button 
          className="w-full py-3 text-[0.75rem] font-bold uppercase tracking-widest text-[var(--danger-color)] hover:bg-[var(--danger-color)]/5 rounded-xl transition-colors font-body cursor-pointer"
          onClick={handleClearFilters}
        >
          {t('filter.panel.clear')}
        </button>
      </div>
    </aside>
  );
});

export default FiltersPanel;