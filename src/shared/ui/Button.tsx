import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'outlineDanger';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  type = 'button',
  disabled = false
}) => {
  const baseClasses = "font-heading font-bold uppercase tracking-widest cursor-pointer transition-all w-full border-none rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-surface text-accent py-3 px-6 text-[0.8rem] shadow-md hover:-translate-y-0.5 hover:bg-body hover:shadow-lg",
    outlineDanger: "p-3 bg-transparent text-textSecondary border border-borderClient text-[0.85rem] hover:border-danger hover:text-danger hover:bg-danger/5"
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};