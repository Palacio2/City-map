import React from 'react';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'default' | string;
    icon?: React.ElementType;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', icon: Icon, className = '' }) => {
    const variants: Record<string, string> = {
        primary: 'bg-primary-subtle text-primary border-primary/20 dark:border-primary/30',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        default: 'bg-main text-textMuted border-border/80'
    };

    const selectedVariant = variants[variant] || variants.default;

    return (
        <span className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-lg text-[11px] font-semibold tracking-tight border shadow-2xs select-none transition-colors ${selectedVariant} ${className}`}>
            {Icon && <Icon className="text-[10px] shrink-0" />}
            <span className="truncate">{children}</span>
        </span>
    );
};