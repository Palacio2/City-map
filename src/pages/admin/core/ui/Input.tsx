import React, { ReactNode } from 'react';

export interface FormGroupProps {
    label?: React.ReactNode;
    children: ReactNode;
    className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, children, className = '' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className="text-[11px] font-bold text-textMuted uppercase tracking-wider select-none">{label}</label>}
        {children}
    </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={`px-3.5 py-2 rounded-xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs outline-none bg-surface text-textMain w-full transition-all text-xs sm:text-sm font-medium hover:border-[#b8aa99] dark:hover:border-[#63544a] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-textMuted/60 ${className}`}
            {...props}
        />
    );
});

Input.displayName = 'Input';