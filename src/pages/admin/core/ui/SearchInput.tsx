import React from 'react';
import { FaSearch } from 'react-icons/fa';

export interface SearchInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, className = '' }) => {
    return (
        <div className={`relative w-full ${className}`}>
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted text-xs pointer-events-none" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#d6ccbf] dark:border-[#4a3f37] outline-none bg-surface text-textMain text-xs sm:text-sm font-medium transition-all shadow-xs hover:border-[#b8aa99] dark:hover:border-[#63544a] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-textMuted/60"
            />
        </div>
    );
};