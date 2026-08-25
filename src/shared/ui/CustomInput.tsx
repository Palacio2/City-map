import React from 'react';

interface CustomInputProps {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string | number;
  type?: 'text' | 'number' | 'email' | 'password';
  id?: string;
  className?: string; // Додано
  disabled?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({ 
  name, 
  value, 
  onChange, 
  placeholder = "0", 
  min = "0", 
  type = "number",
  id,
  className = '',
  disabled
}) => {
  return (
    <input
      id={id || name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full py-3 px-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] font-body text-[0.95rem] transition-all outline-none hover:border-[var(--accent-color)] focus:border-[var(--accent-color)] focus:ring-[3px] focus:ring-[var(--accent-color)]/10 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      placeholder={placeholder}
      min={min}
    />
  );
};