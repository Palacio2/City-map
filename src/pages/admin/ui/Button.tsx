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
    type = "button", 
    ...props 
}) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-medium cursor-pointer transition-colors duration-150 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed select-none";
    
    const sizes = {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3.5 py-2 text-xs",
        lg: "px-4 py-2.5 text-sm",
    };

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-hover shadow-subtle",
        cancel: "bg-surface text-textMain border-border hover:bg-hover hover:border-border",
        danger: "bg-danger text-white hover:opacity-90 shadow-subtle",
        success: "bg-success text-white hover:opacity-90 shadow-subtle",
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