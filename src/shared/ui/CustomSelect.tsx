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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  name, value, onChange, options, id, className = '' 
}) => {
  return (
    <select
      id={id || name}
      name={name}
      value={value}
      onChange={onChange}
      // Додаємо className до існуючих стилів
      className={`w-full py-3 px-4 rounded-lg border border-borderClient bg-surface font-body text-[0.95rem] text-textMain cursor-pointer transition-all outline-none hover:border-accent focus:border-accent focus:ring-[3px] focus:ring-accent/10 appearance-none bg-no-repeat bg-[position:right_1rem_center] bg-[url('data:image/svg+xml,...')] ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};