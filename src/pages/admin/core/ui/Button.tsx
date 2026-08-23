import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'cancel' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled,
    type = 'button',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none';

    const sizes = {
        sm: 'px-3 py-1.5 text-xs rounded-xl',
        md: 'px-4 py-2 text-xs sm:text-sm rounded-xl',
        lg: 'px-5 py-2.5 text-sm sm:text-base rounded-2xl',
    };

    const variants = {
        primary: 'bg-primary text-white border-transparent hover:bg-primary-hover shadow-xs hover:shadow-md hover:shadow-primary/20',
        cancel: 'bg-surface text-textMain border-border/80 hover:bg-hover hover:border-border shadow-2xs',
        danger: 'bg-rose-600 text-white border-transparent hover:bg-rose-700 shadow-xs hover:shadow-md hover:shadow-rose-600/20',
        success: 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-xs hover:shadow-md hover:shadow-emerald-600/20',
        warning: 'bg-amber-500 text-white border-transparent hover:bg-amber-600 shadow-xs hover:shadow-md hover:shadow-amber-500/20',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};