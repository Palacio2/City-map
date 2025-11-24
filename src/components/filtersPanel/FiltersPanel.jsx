import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import styles from './FiltersPanel.module.css';
import EducationFilters from './sections/EducationFilters';
import MedicineFilters from './sections/MedicineFilters';
import TransportFilters from './sections/TransportFilters';
import SocialFilters from './sections/SocialFilters';
import SafetyFilters from './sections/SafetyFilters';
import CommerceFilters from './sections/CommerceFilters';
import UtilitiesFilters from './sections/UtilitiesFilters';

export default function FiltersPanel({ onFiltersChange, selectedFilters = {} }) {
  const navigate = useNavigate();
  const { isPremium, isFree } = useSubscription();
  const [filters, setFilters] = useState(selectedFilters);

  const handleUpgradeClick = () => {
    navigate('/subscription');
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      onFiltersChange?.(updated);
      return updated;
    });
  }, [onFiltersChange]);

  const handleApplyFilters = () => {
    console.log('Застосовані фільтри:', filters);
    onFiltersChange?.(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Фільтри</h2>
        <div className={styles.subscriptionStatus}>
          {isFree && (
            <div className={styles.subscriptionInfo}>
              <span className={styles.freeBadge}>🆓 Безкоштовна версія</span>
              <button 
                className={styles.upgradeLink}
                onClick={handleUpgradeClick}
              >
                Оновити
              </button>
            </div>
          )}
          {isPremium && (
            <div className={styles.subscriptionInfoPremium}>
              <span className={styles.premiumBadge}>💎 Premium</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.scrollContainer}>
        {/* Базові фільтри - доступні всім */}
        <div className={styles.section}>
          <EducationFilters 
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>
        
        <div className={styles.section}>
          <MedicineFilters 
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>

        {/* Преміум фільтри - тільки для Premium */}
        {isPremium && (
          <>
            <div className={styles.section}>
              <TransportFilters 
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
            <div className={styles.section}>
              <SocialFilters 
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
            <div className={styles.section}>
              <SafetyFilters 
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
            <div className={styles.section}>
              <CommerceFilters 
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
            <div className={styles.section}>
              <UtilitiesFilters 
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
          </>
        )}
      </div>
      
      {isFree && (
        <div className={styles.upgradeBanner}>
          <div className={styles.bannerContent}>
            <h4>Отримайте більше можливостей!</h4>
            <p>Розблокуйте всі фільтри з підпискою Premium</p>
            <button 
              className={styles.bannerButton}
              onClick={handleUpgradeClick}
            >
              Переглянути тарифи
            </button>
          </div>
        </div>
      )}
      
      <div className={styles.actions}>
        <button 
          className={styles.clearButton}
          onClick={handleClearFilters}
        >
          Очистити
        </button>
        <button 
          className={styles.applyButton}
          onClick={handleApplyFilters}
        >
          Застосувати фільтри
        </button>
      </div>
    </div>
  );
}