import React from 'react';

export const StatCard = ({ title, value, icon: Icon, variant = 'default', className = '' }) => {
    const variants = {
        primary: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-primary' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-[#a855f7]' },
        success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-success' },
        warning: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-[#f97316]' },
        danger: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-danger' },
        default: { bg: 'bg-main', border: 'border-border', text: 'text-textMuted' }
    };

    const v = variants[variant] || variants.default;

    return (
        <div className={`bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group ${className}`}>
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                    <h3 className={`text-[2rem] sm:text-[2.5rem] font-extrabold m-0 leading-none tracking-tight text-textMain`}>
                        {value}
                    </h3>
                    <p className={`text-[0.85rem] m-0 font-bold uppercase tracking-wider text-textMuted mt-2`}>
                        {title}
                    </p>
                </div>
                {Icon && (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 border shadow-inner ${v.bg} ${v.border} ${v.text}`}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
            {/* Легкий градієнтний відблиск на фоні */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${v.bg.replace('/10', '')}`}></div>
        </div>
    );
};