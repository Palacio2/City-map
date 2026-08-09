export const StatCard = ({ title, value, icon: Icon, variant = 'default', className = '' }: any) => {
    const iconColors: Record<string, string> = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        purple: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
        success: 'text-success bg-success/10 border-success/20',
        warning: 'text-warning bg-warning/10 border-warning/20',
        danger: 'text-danger bg-danger/10 border-danger/20',
        default: 'text-textMuted bg-main border-border',
    };

    const colorClass = iconColors[variant] || iconColors.default;

    return (
        <div className={`bg-surface p-5 rounded-xl border border-border shadow-subtle flex flex-col justify-between gap-3 transition-colors hover:border-border/80 ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-textMuted uppercase tracking-wider">
                    {title}
                </span>
                {Icon && (
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="text-sm" />
                    </div>
                )}
            </div>
            <div className="text-2xl font-semibold tracking-tight text-textMain">
                {value}
            </div>
        </div>
    );
};