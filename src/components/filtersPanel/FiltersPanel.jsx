import React, { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/SubscriptionContext';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import GenericCategoryFilter from './GenericCategoryFilter'; 
import { FaFilter, FaChevronDown } from 'react-icons/fa';

const FREE_ALLOWED_CATEGORIES = ['medicine', 'transport', 'commerce'];

const FiltersPanel = memo(({ onFiltersChange, selectedFilters = {}, allowedCategories = null }) => {
  const { t } = useTranslation(['db', 'common']);
  const navigate = useNavigate();
  const { isFree, isRealtor } = useSubscription(); 
  const [filters, setFilters] = useState(selectedFilters);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setFilters(selectedFilters);
  }, [selectedFilters]);

  const updateFilters = useCallback((section, newSectionData) => {
    setFilters(prev => {
      const updated = { ...prev, [section]: { ...prev[section], ...newSectionData } };
      onFiltersChange?.(updated);
      return updated;
    });
  }, [onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    onFiltersChange?.({});
  }, [onFiltersChange]);

  return (
    <aside className={`w-full lg:w-[340px] lg:min-w-[340px] lg:h-[calc(100vh-var(--header-height)-40px)] lg:max-h-[calc(100vh-var(--header-height)-40px)] flex flex-col bg-surface border border-borderClient rounded-xl shadow-sm lg:shadow-glass text-textMain overflow-hidden lg:sticky lg:top-[calc(var(--header-height)+20px)] transition-all mb-8 lg:mb-0 ${isMobileOpen ? 'border-accent' : ''}`}>
      <div 
        className="p-4 md:py-5 md:px-6 border-b border-borderClient bg-surface lg:bg-hover shrink-0 flex justify-between items-center cursor-pointer lg:cursor-default" 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <div className="flex items-center gap-2.5">
          <FaFilter className="text-accent text-lg" />
          <h2 className="m-0 font-heading text-xl font-bold text-textMain tracking-wide">{t('filters.panel.title')}</h2>
        </div>
        <FaChevronDown className={`lg:hidden block text-textSecondary transition-transform duration-300 ${isMobileOpen ? 'rotate-180 text-accent' : ''}`} />
      </div>

      <div className={`flex-col flex-1 overflow-hidden ${isMobileOpen ? 'flex border-t border-borderClient animate-slideDown lg:border-t-0' : 'hidden lg:flex'}`}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
          <div className="p-4 md:p-5 flex flex-col gap-3 md:gap-4">
            {Object.entries(DISTRICT_CATEGORIES).map(([key]) => {
              if (isFree && !FREE_ALLOWED_CATEGORIES.includes(key)) return null;
              if (allowedCategories && !allowedCategories.includes(key)) return null;

              return (
                <div key={key} className="animate-fadeIn">
                  <GenericCategoryFilter
                    categoryKey={key}
                    values={filters[key] || {}}
                    onChange={updateFilters}
                    isFree={isFree}
                    isRealtor={isRealtor}
                  />
                </div>
              );
            })}
          </div>
          
          {isFree && (
            <div className="mx-4 mb-4 md:mx-5 md:mb-5 bg-gradient-to-br from-accent to-accent-hover rounded-xl p-6 text-white text-center shadow-card border border-white/10 relative overflow-hidden shrink-0">
              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(197,164,126,0.2)_0%,transparent_70%)] pointer-events-none"></div>
              <div className="relative z-10">
                <h4 className="font-heading m-0 mb-2 text-[1.1rem] text-white font-bold drop-shadow-sm">{t('filters.panel.banner_title')}</h4>
                <p className="m-0 mb-5 text-[0.85rem] text-white/90 leading-relaxed">{t('filters.panel.banner_text')}</p>
                <button 
                  className="bg-surface text-accent border-none py-3 px-6 rounded-lg font-heading font-bold text-[0.8rem] uppercase tracking-widest cursor-pointer w-full transition-all shadow-md hover:-translate-y-0.5 hover:bg-body hover:shadow-lg" 
                  onClick={() => navigate('/subscription')}
                >
                  {t('filters.panel.view_tariffs')}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 md:py-4 md:px-6 border-t border-borderClient bg-surface shrink-0">
          <button 
            className="w-full p-3 bg-transparent text-textSecondary border border-borderClient rounded-lg font-heading font-bold uppercase tracking-widest text-[0.85rem] cursor-pointer transition-all hover:border-danger hover:text-danger hover:bg-danger/5" 
            onClick={handleClearFilters}
          >
            {t('filters.panel.clear')}
          </button>
        </div>
      </div>
    </aside>
  );
});

export default FiltersPanel;