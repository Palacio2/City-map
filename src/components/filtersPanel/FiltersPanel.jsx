import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/SubscriptionContext';
import styles from './FiltersPanel.module.css';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import SafetyFilters from './SafetyFilters'; 
import GenericCategoryFilter from './GenericCategoryFilter'; 
import { FaFilter, FaChevronDown } from 'react-icons/fa';

const FiltersPanel = React.memo(({ 
  onFiltersChange, 
  selectedFilters = {},
  allowedCategories = null 
}) => {
  const { t } = useTranslation(['filters', 'common']);
  const navigate = useNavigate();
  
  const { isFree, isRealtor } = useSubscription(); 
  
  const [filters, setFilters] = useState(selectedFilters);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const FREE_ALLOWED_CATEGORIES = ['medicine', 'transport', 'commerce'];

  useEffect(() => {
    setFilters(selectedFilters);
  }, [selectedFilters]);

  const handleUpgradeClick = () => {
    navigate('/subscription');
  };

  const updateFilters = useCallback((section, newSectionData) => {
    setFilters(prev => {
      const updated = { 
        ...prev, 
        [section]: { ...prev[section], ...newSectionData } 
      };
      onFiltersChange?.(updated);
      return updated;
    });
  }, [onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    onFiltersChange?.({});
  }, [onFiltersChange]);

  const isSectionVisible = (key) => {
    if (!allowedCategories) return true;
    return allowedCategories.includes(key);
  };

  const toggleMobilePanel = () => {
    setIsMobileOpen(prev => !prev);
  };

  return (
    <aside className={`${styles.panel} ${isMobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.panelHeader} onClick={toggleMobilePanel}>
        <div className={styles.headerTitle}>
          <FaFilter className={styles.filterIcon} />
          <h2 className={styles.panelTitle}>{t('filters:filter.panel.title')}</h2>
        </div>
        <FaChevronDown className={styles.chevron} />
      </div>

      <div className={styles.mobileContentWrapper}>
        <div className={styles.content}>
          <div className={styles.scrollableContent}>
            {Object.entries(DISTRICT_CATEGORIES).map(([key, config]) => {
              if (key === 'safety') return null;
              
              if (isFree && !FREE_ALLOWED_CATEGORIES.includes(key)) return null;
              
              if (!isSectionVisible(key)) return null;

              return (
                <div key={key} className={styles.sectionContainer}>
                  <GenericCategoryFilter
                    categoryKey={key}
                    values={filters[key] || {}}
                    onChange={(data) => updateFilters(key, data)}
                    isFree={isFree}
                    isRealtor={isRealtor}
                  />
                </div>
              );
            })}

            {!isFree && isSectionVisible('safety') && (
              <div className={styles.sectionContainer}>
                <SafetyFilters 
                  values={filters.safety || {}}
                  onChange={(data) => updateFilters('safety', data)}
                />
              </div>
            )}
          </div>
          
          {isFree && (
            <div className={styles.upgradeBanner}>
              <div className={styles.bannerContent}>
                <h4>{t('filters:filter.panel.banner_title')}</h4>
                <p>{t('filters:filter.panel.banner_text')}</p>
                <button className={styles.bannerButton} onClick={handleUpgradeClick}>
                  {t('filters:filter.panel.view_tariffs')}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.actions}>
          <button className={styles.clearButton} onClick={handleClearFilters}>
            {t('filters:filter.panel.clear')}
          </button>
        </div>
      </div>
    </aside>
  );
});

export default FiltersPanel;