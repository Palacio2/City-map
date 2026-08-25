import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  id?: string;
  className?: string; // Додано для підтримки кастомних стилів
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  name, value, onChange, options, id, className = '', disabled 
}) => {
  return (
    <select
      id={id || name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full py-3 px-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] font-body text-[0.95rem] text-[var(--text-main)] cursor-pointer transition-all outline-none hover:border-[var(--accent-color)] focus:border-[var(--accent-color)] focus:ring-[3px] focus:ring-[var(--accent-color)]/10 appearance-none bg-no-repeat bg-[position:right_1rem_center] bg-[url('data:image/svg+xml,...')] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};