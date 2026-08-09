import { useTranslation } from 'react-i18next';
import { FiHeart, FiX, FiMessageCircle } from 'react-icons/fi';
import { AiFillHeart, AiOutlineLoading3Quarters } from 'react-icons/ai';

const baseButtonClasses = "bg-black/30 backdrop-blur-[var(--glass-blur)] border border-white/20 rounded-full flex items-center justify-center p-0 cursor-pointer transition-all duration-300 ease-out shrink-0 z-20 shadow-sm outline-none text-white relative after:content-[''] after:absolute after:-inset-2 hover:bg-black/50 hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:bg-black/60 [&>svg]:block [&>svg]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] [&>svg]:stroke-[2.5px] [&>svg]:transition-all [&>svg]:duration-300 [&>svg]:ease-out";
const defaultSizeClasses = "w-8 h-8 md:w-[44px] md:h-[44px] [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5";

interface CloseButtonProps {
  readonly onClose: () => void;
  readonly className?: string;
}

export const CloseButton = ({ onClose, className = '' }: CloseButtonProps) => {
  const { t } = useTranslation('db');
  return (
    <button
      type="button"
      className={`${baseButtonClasses} ${defaultSizeClasses} ${className}`}
      onClick={onClose}
      aria-label={t('district.actions.close')}
      title={t('district.actions.close')}
    >
      <FiX />
    </button>
  );
};

interface FavoriteButtonProps {
  readonly isFavorite: boolean;
  readonly onToggle: () => void;
  readonly isLoading?: boolean;
  readonly className?: string;
}

export const FavoriteButton = ({
  isFavorite,
  onToggle,
  isLoading = false,
  className = ''
}: FavoriteButtonProps) => {
  const { t } = useTranslation('db');
  const label = isFavorite ? t('district.actions.remove_favorite') : t('district.actions.add_favorite');

  const getIcon = () => {
    if (isLoading) return <AiOutlineLoading3Quarters className="animate-spin" />;
    if (isFavorite) return <AiFillHeart />;
    return <FiHeart />;
  };

  return (
    <button
      type="button"
      className={`${baseButtonClasses} ${defaultSizeClasses} ${isFavorite ? '!bg-white !border-white !text-danger [&>svg]:fill-danger [&>svg]:stroke-danger [&>svg]:stroke-0 [&>svg]:drop-shadow-none' : ''} ${isLoading ? 'cursor-wait opacity-80' : ''} ${className}`}
      onClick={onToggle}
      disabled={isLoading}
      aria-label={label}
      title={label}
    >
      {getIcon()}
    </button>
  );
};

interface CommentButtonProps {
  readonly onClick: () => void;
  readonly count?: number;
  readonly className?: string;
}

export const CommentButton = ({ onClick, count, className = '' }: CommentButtonProps) => {
  const { t } = useTranslation('db');
  return (
    <button
      type="button"
      className={`${baseButtonClasses} ${defaultSizeClasses} ${className}`}
      onClick={onClick}
      aria-label={t('district.actions.comments')}
      title={t('district.actions.comments')}
    >
      <FiMessageCircle />
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};