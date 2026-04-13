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
}

export const CustomInput: React.FC<CustomInputProps> = ({ 
  name, 
  value, 
  onChange, 
  placeholder = "0", 
  min = "0", 
  type = "number",
  id,
  className = ''
}) => {
  return (
    <input
      id={id || name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      // Додаємо className
      className={`w-full py-3 px-4 rounded-lg border border-borderClient bg-surface text-textMain font-body text-[0.95rem] transition-all outline-none hover:border-accent focus:border-accent focus:ring-[3px] focus:ring-accent/10 ${className}`}
      placeholder={placeholder}
      min={min}
    />
  );
};