export const Badge = ({ children, variant = 'default', icon: Icon, className = '' }: any) => {
    const variants: Record<string, string> = {
        primary: 'bg-blue-500/10 text-primary border-blue-500/20',
        success: 'bg-emerald-500/10 text-success border-emerald-500/20',
        warning: 'bg-orange-500/10 text-[#f97316] border-orange-500/20',
        danger: 'bg-red-500/10 text-danger border-red-500/20',
        purple: 'bg-purple-500/10 text-[#a855f7] border-purple-500/20',
        default: 'bg-main text-textMuted border-border'
    };

    const selectedVariant = variants[variant] || variants.default;

    return (
        <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[0.75rem] font-bold border shadow-sm ${selectedVariant} ${className}`}>
            {Icon && <Icon size={12} />}
            {children}
        </span>
    );
};