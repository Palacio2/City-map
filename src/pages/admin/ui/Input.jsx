import React from 'react';

export const FormGroup = ({ label, children, className = '' }) => (
    <div className={`flex flex-col gap-2 mb-4 ${className}`}>
        {label && <label className="text-[0.9rem] font-bold text-textMain">{label}</label>}
        {children}
    </div>
);

export const Input = React.forwardRef(({ className = '', ...props }, ref) => {
    return (
        <input 
            ref={ref}
            className={`px-4 py-3 rounded-md border-2 border-border outline-none bg-main text-textMain w-full transition-all duration-300 text-[0.95rem] focus:bg-surface focus:border-primary focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] ${className}`}
            {...props}
        />
    );
});