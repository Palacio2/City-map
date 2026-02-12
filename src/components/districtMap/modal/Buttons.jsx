import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiX } from 'react-icons/fi';
import { AiFillHeart, AiOutlineLoading3Quarters } from 'react-icons/ai';
import styles from './styles/buttons.module.css';

export function CloseButton({ onClose }) {
  const { t } = useTranslation('common');

  return (
    <button
      className={styles.closeButton}
      onClick={onClose}
      aria-label={t('actions.close')}
      title={t('actions.close')}
    >
      <FiX />
    </button>
  );
}

export function FavoriteButton({ isFavorite, onToggle, isLoading = false, className = '' }) {
  const { t } = useTranslation('common');
  const label = isFavorite ? t('actions.remove_favorite') : t('actions.add_favorite');

  return (
    <button
      className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''} ${isLoading ? styles.loading : ''} ${className}`}
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