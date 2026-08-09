import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

export interface SelectOption {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
    description?: string;
    colorClass?: string; // Кольоровий клас для фону, тексту та рамки
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string | number;
    onChange: (value: any) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Оберіть значення...',
    disabled = false,
    className = '',
    size = 'md'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-2 text-xs';
    const activeColorClass = selectedOption?.colorClass || 'bg-main border-border text-textMain';

    return (
        <div className={`relative w-full ${className}`} ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 border rounded-lg font-medium transition-colors hover:opacity-90 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${activeColorClass} ${sizeClasses}`}
            >
                <span className="truncate flex items-center gap-1.5">
                    {selectedOption?.icon}
                    {selectedOption ? selectedOption.label : <span className="text-textMuted">{placeholder}</span>}
                </span>
                <FaChevronDown className={`text-[10px] opacity-70 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-border rounded-lg shadow-dropdown overflow-hidden py-1 max-h-56 overflow-y-auto scrollbar-thin animate-fadeIn">
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={String(option.value)}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                                    isSelected 
                                        ? (option.colorClass ? `${option.colorClass} font-medium` : 'bg-primary-subtle text-primary font-medium')
                                        : 'text-textMain hover:bg-hover'
                                }`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5 truncate">
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                    {option.description && (
                                        <span className="text-[10px] text-textMuted font-normal truncate mt-0.5">{option.description}</span>
                                    )}
                                </div>
                                {isSelected && <FaCheck className="text-[10px] shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};