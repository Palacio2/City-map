import React from 'react';
import { FaSearch } from 'react-icons/fa';

export const SearchInput = ({ value, onChange, placeholder, className = '' }) => {
    return (
        <div className={`relative w-full ${className}`}>
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted text-[0.9rem]" />
            <input 
                type="text" 
                placeholder={placeholder} 
                value={value} 
                onChange={onChange} 
                className="!pl-10 pr-4 py-2.5 rounded-xl border-2 border-border outline-none bg-main text-textMain w-full transition-all text-[0.95rem] font-medium focus:bg-surface focus:border-primary focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] placeholder-textMuted/50"
            />
        </div>
    );
};