import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export interface SelectOption {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
    description?: string;
    colorClass?: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    className = '',
    size = 'md'
}) => {
    const { t } = useTranslation('db');
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

    const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs rounded-xl' : 'px-3.5 py-2 text-xs sm:text-sm rounded-xl';
    const activeColorClass = selectedOption?.colorClass || 'bg-surface border-[#b8aa99] dark:border-[#63544a] text-textMain';

    return (
        <div className={`relative w-full ${className}`} ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 border-2 shadow-xs font-medium transition-all hover:border-[#b8aa99] dark:hover:border-[#63544a] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface disabled:opacity-50 disabled:cursor-not-allowed ${activeColorClass} ${sizeClasses}`}
            >
                <span className="truncate flex items-center gap-2">
                    {selectedOption?.icon && <span className="shrink-0 text-textMuted">{selectedOption.icon}</span>}
                    {selectedOption ? <span className="truncate">{selectedOption.label}</span> : <span className="text-textMuted/70">{placeholder || t('common.select_value')}</span>}
                </span>
                <FaChevronDown className={`text-[10px] text-textMuted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-surface border border-[#d6ccbf] dark:border-[#4a3f37] rounded-2xl shadow-xl shadow-black/10 overflow-hidden py-1.5 max-h-60 overflow-y-auto scrollbar-thin backdrop-blur-md animate-fadeIn">
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
                                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-xs sm:text-sm transition-colors ${
                                    isSelected
                                        ? (option.colorClass ? `${option.colorClass} font-semibold` : 'bg-primary-subtle text-primary font-semibold')
                                        : 'text-textMain hover:bg-hover'
                                }`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2 truncate">
                                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                    {option.description && (
                                        <span className="text-[10px] text-textMuted font-normal truncate mt-0.5">{option.description}</span>
                                    )}
                                </div>
                                {isSelected && <FaCheck className="text-xs text-primary shrink-0 ml-2" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};