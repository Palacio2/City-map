import React from 'react';

interface LoaderProps {
    variant?: 'spinner' | 'dots' | 'pulse';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
    className?: string;
    colorClass?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
    variant = 'spinner', 
    size = 'md', 
    text, 
    fullScreen = false, 
    className = '',
    colorClass = 'text-primary'
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const textClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg'
    };

    const renderSpinner = () => (
        <svg className={`animate-spin ${colorClass} ${sizeClasses[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    const renderDots = () => {
        const bgClass = colorClass.replace('text-', 'bg-');
        return (
            <div className={`flex flex-col items-center justify-center ${sizeClasses[size]}`}>
                <div className="flex items-center gap-1.5 h-full">
                    <div className={`w-2.5 h-2.5 ${bgClass} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                    <div className={`w-2.5 h-2.5 ${bgClass} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                    <div className={`w-2.5 h-2.5 ${bgClass} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        );
    };

    const renderPulse = () => {
        const bgClass = colorClass.replace('text-', 'bg-');
        return (
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
                <div className={`absolute w-full h-full ${bgClass}/30 rounded-full animate-ping`}></div>
                <div className={`relative w-1/2 h-1/2 ${bgClass} rounded-full`}></div>
            </div>
        );
    };

    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            {variant === 'spinner' && renderSpinner()}
            {variant === 'dots' && renderDots()}
            {variant === 'pulse' && renderPulse()}
            {text && (
                <span className={`text-textMuted font-medium animate-pulse ${textClasses[size]}`}>
                    {text}
                </span>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-main/60 backdrop-blur-xs animate-fadeIn">
                <div className="bg-surface p-8 rounded-2xl shadow-2xl border border-[#d6ccbf] dark:border-[#4a3f37] flex flex-col items-center">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};
