import { forwardRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { handleKeyDown, sanitizeInput } from '../utils';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly icon: IconType;
  readonly error?: string;
  readonly blockType?: 'auth' | 'name';
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, icon: Icon, error, type, blockType, onChange, onKeyDown, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (blockType) {
        const sanitized = sanitizeInput(e.target.value, blockType === 'name');
        if (e.target.value !== sanitized) e.target.value = sanitized;
      }
      onChange?.(e);
    };

    return (
      <div className="flex flex-col">
        <label htmlFor={props.name} className="flex items-center gap-2 font-semibold text-textMain mb-2 text-[0.9rem]">
          <Icon className="text-accent text-base" /> {label}
        </label>
        <div className="relative w-full">
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            id={props.name}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (blockType) handleKeyDown(e, blockType === 'name');
              onKeyDown?.(e);
            }}
            className={`w-full py-4 px-5 border-none ring-1 ring-borderClient rounded-2xl text-[16px] sm:text-base bg-body text-textMain transition-all font-body focus:ring-2 focus:outline-hidden ${error ? 'ring-danger focus:ring-danger' : 'focus:ring-accent'}`}
            {...props}
          />
          {isPassword && (
            <button 
              type="button" 
              className="absolute right-0 top-0 h-full w-10 text-textSecondary hover:text-textMain flex items-center justify-center" 
              onClick={() => setShowPassword(!showPassword)} 
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
        </div>
        {error && <span className="text-danger text-[0.85rem] mt-1.5">{error}</span>}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';