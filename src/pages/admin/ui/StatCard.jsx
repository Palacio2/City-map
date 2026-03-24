import React from 'react';

export const StatCard = ({ title, value, icon: Icon, variant = 'default', className = '' }) => {
    const variants = {
        primary: { bg: 'bg-blue-500/10', text: 'text-primary' },
        purple: { bg: 'bg-purple-500/10', text: 'text-[#a855f7]' },
        success: { bg: 'bg-emerald-500/15', text: 'text-success' },
        default: { bg: 'bg-main', text: 'text-textMuted' }
    };

    const v = variants[variant] || variants.default;
    const isSuccess = variant === 'success';

    return (
        <div className={`bg-surface p-6 rounded-lg border border-border shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group ${isSuccess ? '!bg-emerald-500/5' : ''} ${className}`}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <p className={`text-[0.9rem] m-0 font-semibold uppercase tracking-wider ${isSuccess ? 'text-success' : 'text-textMuted'}`}>
                        {title}
                    </p>
                    <h3 className={`text-[2.5rem] font-extrabold m-0 leading-none tracking-tight ${isSuccess ? 'text-success' : 'text-textMain'}`}>
                        {value}
                    </h3>
                </div>
                {Icon && (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${v.bg} ${v.text}`}>
                        <Icon size={20} />
                    </div>
                )}
            </div>
        </div>
    );
};