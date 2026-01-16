import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaStar } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import styles from './FiltersPanel.module.css';

import EducationFilters from './sections/EducationFilters';
import MedicineFilters from './sections/MedicineFilters';
import TransportFilters from './sections/TransportFilters';
import SocialFilters from './sections/SocialFilters';
import SafetyFilters from './sections/SafetyFilters';
import CommerceFilters from './sections/CommerceFilters';
import UtilitiesFilters from './sections/UtilitiesFilters';

const FiltersPanel = React.memo(({ onFiltersChange, selectedFilters = {} }) => {
  const { t } = useTranslation('filters');
  const navigate = useNavigate();
  const { isPremium, isFree } = useSubscription();
  
  const [filters, setFilters] = useState(selectedFilters);

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

  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{t('panel.title')}</h2>
        <div className={styles.subscriptionStatus}>
          {isFree && (
            <div className={styles.subscriptionInfo}>
              <span className={styles.freeBadge}>
                <FaStar style={{ marginRight: '6px', fontSize: '1em' , color: '#f59e0b' }} /> 
                {t('panel.free_version')}
              </span>
              <button className={styles.upgradeLink} onClick={handleUpgradeClick}>
                {t('panel.upgrade')}
              </button>
            </div>
          )}
          {isPremium && (
            <div className={styles.subscriptionInfoPremium}>
              <span className={styles.premiumBadge}>💎 {t('panel.premium')}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.panelContent}>
        <div className={styles.scrollContainer}>
          <div className={styles.section}>
            <EducationFilters 
              values={filters.education || {}} 
              onChange={(data) => updateFilters('education', data)}
            />
          </div>
          
          <div className={styles.section}>
            <MedicineFilters 
              values={filters.medicine || {}} 
              onChange={(data) => updateFilters('medicine', data)}
            />
          </div>

          {isPremium && (
            <>
              <div className={styles.section}>
                <TransportFilters 
                  values={filters.transport || {}}
                  onChange={(data) => updateFilters('transport', data)}
                />
              </div>
              <div className={styles.section}>
                <SocialFilters 
                  values={filters.social || {}}
                  onChange={(data) => updateFilters('social', data)}
                />
              </div>
              <div className={styles.section}>
                <SafetyFilters 
                  values={filters.safety || {}}
                  onChange={(data) => updateFilters('safety', data)}
                />
              </div>
              <div className={styles.section}>
                <CommerceFilters 
                  values={filters.commerce || {}}
                  onChange={(data) => updateFilters('commerce', data)}
                />
              </div>
              <div className={styles.section}>
                <UtilitiesFilters 
                  values={filters.utilities || {}}
                  onChange={(data) => updateFilters('utilities', data)}
                />
              </div>
            </>
          )}
        </div>
        
        {isFree && (
          <div className={styles.upgradeBanner}>
            <div className={styles.bannerContent}>
              <h4>{t('panel.banner_title')}</h4>
              <p>{t('panel.banner_text')}</p>
              <button className={styles.bannerButton} onClick={handleUpgradeClick}>
                {t('panel.view_tariffs')}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.actions}>
        <button className={styles.clearButton} onClick={handleClearFilters}>
          {t('panel.clear')}
        </button>
      </div>
    </div>
  );
});

export default FiltersPanel;