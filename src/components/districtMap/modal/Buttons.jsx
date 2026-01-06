import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiX } from 'react-icons/fi';
import { AiFillHeart, AiOutlineLoading3Quarters } from 'react-icons/ai';
import styles from './styles/buttons.module.css';

export function CloseButton({ onClose }) {
  const { t } = useTranslation('districts');
  
  return (
    <button 
      className={styles.closeButton} 
      onClick={onClose} 
      aria-label={t('buttons.close')}
      title={t('buttons.close')}
    >
      <FiX /> 
    </button>
  );
}

export function FavoriteButton({ isFavorite, onToggle, isLoading = false }) {
  const { t } = useTranslation('districts');
  const label = isFavorite ? t('buttons.remove_favorite') : t('buttons.add_favorite');

  return (
    <button 
      className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''} ${isLoading ? styles.loading : ''}`}
      onClick={onToggle}
      disabled={isLoading}
      aria-label={label}
      title={label}
    >
      {isLoading ? (
        <AiOutlineLoading3Quarters /> 
      ) : isFavorite ? (
        <AiFillHeart /> 
      ) : (
        <FiHeart /> 
      )}
    </button>
  );
}