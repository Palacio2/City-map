import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiX } from 'react-icons/fi';
import { AiFillHeart, AiOutlineLoading3Quarters } from 'react-icons/ai';

const baseButtonClasses = "bg-black/30 backdrop-blur-[var(--glass-blur)] border border-white/20 w-9 h-9 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center p-0 cursor-pointer transition-all shrink-0 z-20 shadow-sm outline-none text-white relative after:content-[''] after:absolute after:-inset-2 hover:bg-black/50 hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:bg-black/60 [&>svg]:w-[18px] [&>svg]:h-[18px] md:[&>svg]:w-5 md:[&>svg]:h-5 [&>svg]:block [&>svg]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] [&>svg]:stroke-[2.5px] [&>svg]:transition-colors";

export function CloseButton({ onClose }) {
  const { t } = useTranslation('common');

  return (
    <button
      className={baseButtonClasses}
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
      className={`${baseButtonClasses} ${isFavorite ? '!bg-white !border-white !text-danger [&>svg]:fill-danger [&>svg]:stroke-danger [&>svg]:stroke-0 [&>svg]:drop-shadow-none' : ''} ${isLoading ? 'cursor-wait opacity-80' : ''} ${className}`}
      onClick={onToggle}
      disabled={isLoading}
      aria-label={label}
      title={label}
    >
      {isLoading ? (
        <AiOutlineLoading3Quarters className="animate-spin" />
      ) : isFavorite ? (
        <AiFillHeart />
      ) : (
        <FiHeart />
      )}
    </button>
  );
}