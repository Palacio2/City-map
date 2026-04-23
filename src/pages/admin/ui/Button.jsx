import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', disabled, type = "button", ...props }) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[0.95rem] cursor-pointer transition-all duration-200 border-2 border-transparent w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none active:scale-[0.98]";
    
    const variants = {
        primary: "bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)]",
        cancel: "bg-surface text-textMuted border-border hover:bg-main hover:text-textMain",
        danger: "bg-red-500/10 text-danger border-red-500/20 hover:bg-danger hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]",
        success: "bg-success text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)] hover:brightness-95 hover:-translate-y-[1px] hover:shadow-[0_6px_16px_rgba(34,197,94,0.4)]"
    };

    return (
        <button 
            type={type}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};