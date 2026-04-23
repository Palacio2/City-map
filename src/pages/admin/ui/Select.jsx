import React from 'react';

export const Select = React.forwardRef(({ className = '', children, ...props }, ref) => {
    return (
        <select 
            ref={ref}
            className={`px-4 py-2.5 rounded-xl border-2 border-border outline-none bg-main text-textMain transition-all duration-300 text-[0.95rem] font-medium focus:bg-surface focus:border-primary focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] w-full cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
            style={{ 
                backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")", 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'right 14px center', 
                backgroundSize: '12px', 
                paddingRight: '36px' 
            }}
            {...props}
        >
            {children}
        </select>
    );
});