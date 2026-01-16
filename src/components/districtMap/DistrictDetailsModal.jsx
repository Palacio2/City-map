import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styles from './DistrictDetailsModal.module.css';
import { HeaderSection, ModalFooter } from './modal/HeaderFooter';
import StatsGrid from './modal/StatsGrid';
import { checkIsFavorite, toggleFavorite } from '../../utils/favorites';
import { formatNumber, formatPrice, getCurrencyInfo } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';

export default function DistrictDetailsModal({ 
  district, 
  isOpen, 
  onClose, 
  onToggleFavorite 
}) {
  const { t } = useTranslation('districts');
  const { country: paramCountry } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const countryName = district?.country || decodeURIComponent(paramCountry || '');
  const currencyInfo = getCurrencyInfo(countryName);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !district) return;

    let mounted = true;
    setIsLoading(true);

    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;

        if (mounted) setUserId(uid || null);

        if (uid) {
          const favoriteStatus = await checkIsFavorite(district.id);
          if (mounted) setIsFavorite(favoriteStatus);
        } else {
          if (mounted) setIsFavorite(false);
        }
      } catch (error) {
        console.warn('Favorite check failed:', error);
        if (mounted) setIsFavorite(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkStatus();
    return () => { mounted = false; };
  }, [district?.id, isOpen]);

  const handleToggleFavorite = async () => {
    if (!userId) {
      alert(t('modal.login_alert'));
      return;
    }
    const previousState = isFavorite;
    const newState = !previousState;
    setIsFavorite(newState); 

    try {
      const resultState = await toggleFavorite(district, newState); 
      if (resultState !== newState) setIsFavorite(resultState);
      onToggleFavorite?.(district.id, resultState);
    } catch (error) {
      console.error('Toggle error:', error);
      setIsFavorite(previousState);
    }
  };

  if (!isOpen || !district) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.mobileHandle} /> 

        <HeaderSection 
          district={district}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
          onClose={onClose}
          formatPrice={formatPrice}
          formatNumber={formatNumber}
          currencyInfo={currencyInfo}
        />

        <div className={styles.mainContent}>
          {district.filterData ? (
            <StatsGrid 
              filterData={district.filterData} 
              currencyInfo={currencyInfo}
            />
          ) : (
            <div className={styles.noData}>
              <div className={styles.noDataIcon}>📊</div>
              <h3>{t('modal.no_data_title')}</h3>
              <p>{t('modal.no_data_text')}</p>
            </div>
          )}
        </div>

        <ModalFooter onClose={onClose} />
      </div>
    </div>
  );
}