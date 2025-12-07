// DistrictDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './DistrictDetailsModal.module.css';
import { HeaderSection, ModalFooter } from './modal/HeaderFooter';
import StatsGrid from './modal/StatsGrid';
import { checkIsFavorite, toggleFavorite } from '../../utils/favorites';
import { formatNumber, formatPrice } from '../../utils/formatters';
import { supabase } from '../../supabaseClient'; // ✅ Додайте імпорт supabase

export default function DistrictDetailsModal({ 
  district, 
  isOpen, 
  onClose, 
  onToggleFavorite 
}) {
  if (!isOpen || !district) return null;

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  const checkFavoriteStatus = async () => {
    if (district) {
      setIsLoading(true);
      try {
        // Спочатку перевіряємо чи авторизований користувач
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Користувач не авторизований - не показуємо улюблених
          setIsFavorite(false);
          return;
        }
        
        const favoriteStatus = await checkIsFavorite(district.id);
        setIsFavorite(favoriteStatus);
      } catch (error) {
        console.error('Помилка перевірки статусу улюбленого:', error);
        setIsFavorite(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  checkFavoriteStatus();
}, [district]);

  const handleToggleFavorite = async () => {
    // ⚠️ Додаткова перевірка перед початком операції
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Будь ласка, увійдіть в систему, щоб додавати улюблені');
      return;
    }

    setIsLoading(true);
    try {
      // Функція toggleFavorite сама обробляє API запит
      const newFavoriteState = await toggleFavorite(district, isFavorite); 
      
      setIsFavorite(newFavoriteState);
      onToggleFavorite?.(district.id, newFavoriteState);
    } catch (error) {
      console.error('Помилка при toggle улюбленого:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <HeaderSection 
          district={district}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading} // ✅ Передача isLoading
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
              <h3>Дані відсутні</h3>
              <p>Інформація про цей район ще не додана до системи</p>
            </div>
          )}
        </div>

        <ModalFooter 
          onClose={onClose} 
          // ❌ Видалено: isFavorite, onToggleFavorite, isLoading
        />
      </div>
    </div>
  );
}