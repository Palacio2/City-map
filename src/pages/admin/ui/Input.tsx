import React, { ReactNode } from 'react';

export interface FormGroupProps {
    label?: React.ReactNode;
    children: ReactNode;
    className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, children, className = '' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className="text-xs font-medium text-textMain tracking-tight">{label}</label>}
        {children}
    </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={`px-3 py-1.5 rounded-lg border border-border outline-none bg-main text-textMain w-full transition-colors text-xs font-normal focus:bg-surface focus:border-primary placeholder-textMuted/50 ${className}`}
            {...props}
        />
    );
});

Input.displayName = 'Input';