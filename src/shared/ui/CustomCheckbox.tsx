import React from 'react';

interface CustomCheckboxProps {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  disabled?: boolean;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ name, checked, onChange, id, disabled }) => {
  return (
    <div className={`relative flex items-center justify-center w-5 h-5 shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
      <input
        id={id || name}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer appearance-none m-0 w-5 h-5 rounded-[4px] border-2 border-solid border-[var(--text-secondary)] bg-transparent transition-all cursor-pointer checked:bg-[var(--accent-color)] checked:border-[var(--accent-color)] hover:border-[var(--accent-color)] disabled:cursor-not-allowed"
      />
      <svg 
        className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" 
        viewBox="0 0 14 10" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
};