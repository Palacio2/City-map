import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DistrictDetailsModal.module.css';
import { HeaderSection, ModalFooter } from './modal/HeaderFooter';
import StatsGrid from './modal/StatsGrid';
import { checkIsFavorite, toggleFavorite } from '../../utils/favorites';
import { formatNumber, formatPrice } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';

export default function DistrictDetailsModal({ 
  district, 
  isOpen, 
  onClose, 
  onToggleFavorite 
}) {
  const { t } = useTranslation('districts');

  // 1. ВАЖЛИВО: Всі хуки (useState, useEffect) мають бути НА ПОЧАТКУ
  // Вони повинні викликатися завжди, незалежно від того, відкрита модалка чи ні
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
        // Якщо модалка закрита або немає району - нічого не робимо, але хук все одно існує
        if (!isOpen || !district || !userId) {
            if (isMounted) setIsFavorite(false);
            return;
        }

        setIsLoading(true);
        try {
          const favoriteStatus = await checkIsFavorite(district.id);
          if (isMounted) setIsFavorite(favoriteStatus);
        } catch (error) {
          if (isMounted) setIsFavorite(false);
        } finally {
          if (isMounted) setIsLoading(false);
        }
    };

    checkStatus();

    return () => { isMounted = false; };
    // Використовуємо безпечний доступ ?.id, щоб не було помилки, якщо district null
  }, [district?.id, userId, isOpen]);

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
      
      if (resultState !== newState) {
          setIsFavorite(resultState);
      }
      
      onToggleFavorite?.(district.id, resultState);
    } catch (error) {
      console.error('Toggle error:', error);
      setIsFavorite(previousState);
    }
  };

  // 2. І тільки ТУТ, після всіх хуків, робимо перевірку на відображення
  if (!isOpen || !district) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <HeaderSection 
          district={district}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
          onClose={onClose}
          formatPrice={formatPrice}
          formatNumber={formatNumber}
        />

        <div className={styles.mainContent}>
          {district.filterData ? (
            <StatsGrid filterData={district.filterData} />
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