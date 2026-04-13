import { forwardRef, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { handleKeyDown, sanitizeInput } from './validation';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: IconType;
  error?: string;
  blockType?: 'auth' | 'name';
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, icon: Icon, error, type, blockType, onChange, onKeyDown, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            className={`w-full py-[0.85rem] px-4 border border-borderClient rounded-md text-[16px] sm:text-base bg-body text-textMain transition-all font-body focus:border-accent focus:shadow-[0_0_0_3px_rgba(197,164,126,0.15)] focus:outline-none ${error ? '!border-danger !shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : ''}`}
            {...props}
          />
          {isPassword && (
            <button type="button" className="absolute right-0 top-0 h-full w-10 text-textSecondary hover:text-textMain flex items-center justify-center" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
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