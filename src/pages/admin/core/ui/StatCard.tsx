import React from 'react';
import { IconType } from 'react-icons';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

export interface StatCardProps {
    title: string;
    value: number | string;
    icon: IconType;
    variant?: 'primary' | 'purple' | 'warning' | 'success' | 'danger';
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
    badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    variant = 'primary',
    trend,
    trendType = 'up',
    badgeText
}) => {
    const colors = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        danger: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    }[variant];

    return (
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs hover:border-primary/40 transition-all flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shrink-0 shadow-2xs ${colors}`}>
                <Icon />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted truncate">
                        {title}
                    </span>
                    {badgeText && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${colors}`}>
                            {badgeText}
                        </span>
                    )}
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold font-sans text-textMain tracking-tight">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </span>
                    {trend && (
                        <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 shrink-0 ${
                            trendType === 'up' ? 'text-emerald-500' :
                            trendType === 'down' ? 'text-rose-500' :
                            'text-textMuted'
                        }`}>
                            {trendType === 'up' && <FaArrowUp />}
                            {trendType === 'down' && <FaArrowDown />}
                            {trendType === 'neutral' && <FaMinus />}
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};