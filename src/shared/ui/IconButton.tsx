import React from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IconType } from 'react-icons';

interface IconButtonProps {
  icon: IconType;
  activeIcon?: IconType;
  isActive?: boolean;
  isLoading?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  isActive = false,
  isLoading = false,
  onClick,
  ariaLabel,
  className = ''
}) => {
  const baseClasses = "bg-black/30 backdrop-blur-[var(--glass-blur)] border border-white/20 w-9 h-9 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center p-0 cursor-pointer transition-all shrink-0 z-20 shadow-sm outline-none text-white relative after:content-[''] after:absolute after:-inset-2 hover:bg-black/50 hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:bg-black/60 [&>svg]:w-[18px] [&>svg]:h-[18px] md:[&>svg]:w-5 md:[&>svg]:h-5 [&>svg]:block [&>svg]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] [&>svg]:stroke-[2.5px] [&>svg]:transition-colors";
  
  const activeClasses = isActive 
    ? "!bg-white !border-white !text-danger [&>svg]:fill-danger [&>svg]:stroke-danger [&>svg]:stroke-0 [&>svg]:drop-shadow-none" 
    : "";
    
  const loadingClasses = isLoading ? "cursor-wait opacity-80" : "";

  const IconToRender = isLoading ? AiOutlineLoading3Quarters : (isActive && ActiveIcon ? ActiveIcon : Icon);

  return (
    <button
      className={`${baseClasses} ${activeClasses} ${loadingClasses} ${className}`}
      onClick={onClick}
      disabled={isLoading}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <IconToRender className={isLoading ? "animate-spin" : ""} />
    </button>
  );
};