import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    className?: string;
    children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className = '', children, ...props }, ref) => {
    return (
        <select
            ref={ref}
            className={`px-3 py-1.5 rounded-lg border border-border outline-none bg-main text-textMain text-xs font-medium focus:bg-surface focus:border-primary w-full cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            style={{
                backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                backgroundSize: '12px',
                paddingRight: '28px'
            }}
            {...props}
        >
            {children}
        </select>
    );
});

Select.displayName = 'Select';