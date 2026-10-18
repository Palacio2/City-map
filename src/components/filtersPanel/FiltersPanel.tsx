import { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/pages/subscription/context/SubscriptionContext';
import GenericCategoryFilter from './GenericCategoryFilter'; 
import { FaFilter, FaChevronDown, FaSpinner, FaTrash } from 'react-icons/fa';
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
    
    onFiltersChange(updated);
  }, [localFilters, onFiltersChange, isFree]);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1040]">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="ui-button-primary shadow-2xl flex items-center gap-2 !rounded-full !px-6"
        >
          <FaFilter />
          <span>{t('filter.panel.title')}</span>
          {countActiveFilters(localFilters) > 0 && (
            <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {countActiveFilters(localFilters)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1050] lg:hidden animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Panel */}
      <aside className={`
        ui-glass-panel flex flex-col overflow-hidden 
        transition-transform duration-300 ease-in-out
        
        /* Mobile: Bottom Sheet */
        fixed bottom-0 left-0 right-0 z-[1060] rounded-t-3xl rounded-b-none border-b-0 h-[85vh]
        ${isMobileOpen ? 'translate-y-0' : 'translate-y-full'}
        
        /* Desktop: Sticky Sidebar */
        lg:sticky lg:top-[calc(var(--header-height)+20px)] lg:w-[340px] lg:h-[calc(100vh-var(--header-height)-40px)]
        lg:translate-y-0 lg:rounded-2xl lg:border-b
      `}>
        <div className="w-full p-5 flex justify-between items-center bg-surface border-b border-borderClient/30 shrink-0 z-10 sticky top-0 shadow-xs">
          <div className="flex items-center gap-3">
            <FaFilter className="text-accent" />
            <h2 className="m-0 text-lg uppercase tracking-widest font-bold font-heading">{t('filter.panel.title')}</h2>
          </div>
          <button 
            type="button"
            className="lg:hidden bg-body rounded-full w-8 h-8 flex items-center justify-center border border-borderClient text-textSecondary"
            onClick={() => setIsMobileOpen(false)}
          >
            <FaChevronDown />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] custom-scrollbar py-2 flex flex-col min-h-0 bg-body">
          {isLoading && (
            <div className="flex justify-center items-center py-10 text-accent">
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
            <div className="mt-2 mx-4 p-5 rounded-2xl bg-surface border border-dashed border-borderAccent text-center shrink-0 shadow-xs">
              <h4 className="text-sm font-bold mb-2 uppercase tracking-tighter font-heading">{t('filter.panel.banner_title')}</h4>
              <p className="text-xs text-textSecondary mb-4 font-body">{t('filter.panel.banner_text')}</p>
              <button 
                className="ui-button-primary !py-2.5 !px-4 !text-[0.7rem] w-full"
                onClick={() => navigate('/subscription')}
              >
                {t('filter.panel.view_tariffs')}
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 border-t border-borderClient bg-surface flex gap-3 z-10 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
          <button 
            className="flex items-center justify-center w-full h-[52px] shrink-0 gap-2 text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md cursor-pointer"
            onClick={handleClearFilters}
            title={t('filter.panel.clear')}
            aria-label={t('filter.panel.clear')}
          >
            <FaTrash className="text-lg" />
            <span className="inline-block whitespace-nowrap text-[0.85rem] font-bold uppercase tracking-widest font-body">
              {t('filter.panel.clear')}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
});

export default FiltersPanel;