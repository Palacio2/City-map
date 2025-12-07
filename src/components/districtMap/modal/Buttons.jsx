import React from 'react';
import { FiHeart, FiX } from 'react-icons/fi';
import { AiFillHeart, AiOutlineLoading3Quarters } from 'react-icons/ai';
import styles from './styles/buttons.module.css';

export function CloseButton({ onClose }) {
  return (
    <button 
      className={styles.closeButton} 
      onClick={onClose} 
      aria-label="Закрити"
      title="Закрити"
      disabled={false}
    >
      {/* Розмір контролюється виключно через CSS */}
      <FiX /> 
    </button>
  );
}

export function FavoriteButton({ isFavorite, onToggle, isLoading = false }) {
  return (
    <button 
      className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''} ${isLoading ? styles.loading : ''}`}
      onClick={onToggle}
      disabled={isLoading}
      aria-label={isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
      title={isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
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