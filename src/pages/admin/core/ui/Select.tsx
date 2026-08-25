import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    className?: string;
    children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className = '', children, ...props }, ref) => {
    return (
        <select
            ref={ref}
            className={`px-3.5 py-2 rounded-xl border border-[#d6ccbf] dark:border-[#4a3f37] outline-none bg-surface text-textMain text-xs sm:text-sm font-medium hover:border-[#b8aa99] dark:hover:border-[#63544a] focus:border-primary focus:ring-2 focus:ring-primary/20 w-full cursor-pointer appearance-none shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238c827a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '14px',
                paddingRight: '36px'
            }}
            {...props}
        >
            {children}
        </select>
    );
});

Select.displayName = 'Select';