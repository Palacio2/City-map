import React from 'react';

export const Badge = ({ children, variant = 'default', icon: Icon, className = '' }) => {
    const variants = {
        primary: 'bg-blue-500/10 text-primary border-transparent',
        success: 'bg-emerald-500/10 text-success border-transparent',
        warning: 'bg-amber-500/10 text-[#d97706] border-transparent',
        danger: 'bg-red-500/10 text-danger border-transparent',
        purple: 'bg-purple-500/10 text-[#a855f7] border-transparent',
        default: 'bg-main text-textMuted border-border'
    };

    const selectedVariant = variants[variant] || variants.default;

    return (
        <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[0.75rem] font-bold tracking-wide uppercase border ${selectedVariant} ${className}`}>
            {Icon && <Icon size={12} />}
            {children}
        </span>
    );
};