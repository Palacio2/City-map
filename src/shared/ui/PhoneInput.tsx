import { forwardRef } from 'react';
import ReactPhoneInput from 'react-phone-number-input';
import enLabels from 'react-phone-number-input/locale/en.json';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly error?: boolean;
}

export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ value, onChange, disabled = false, error = false }, ref) => {
    return (
      <div 
        ref={ref}
        className={`flex items-center w-full px-4 bg-black/5 dark:bg-black/20 border border-transparent rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary/20 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:bg-hover 
        [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:py-4 [&_.PhoneInputInput]:text-textMain [&_.PhoneInputInput]:font-sans [&_.PhoneInputInput]:text-[1rem] [&_.PhoneInputInput]:outline-hidden 
        [&_.PhoneInputCountrySelect]:absolute [&_.PhoneInputCountrySelect]:inset-0 [&_.PhoneInputCountrySelect]:w-full [&_.PhoneInputCountrySelect]:h-full [&_.PhoneInputCountrySelect]:opacity-0 [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:z-10
        [&_.PhoneInputCountrySelect_option]:bg-surface [&_.PhoneInputCountrySelect_option]:text-textMain 
        [&_.PhoneInputCountry]:relative [&_.PhoneInputCountry]:mr-3 [&_.PhoneInputCountry]:pr-3 [&_.PhoneInputCountry]:border-r [&_.PhoneInputCountry]:border-border [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-1.5
        ${error ? 'border-danger focus-within:border-danger' : 'focus-within:border-primary hover:border-border'}`}
        aria-disabled={disabled}
      >
        <ReactPhoneInput
          international
          defaultCountry="PL"
          value={value}
          onChange={(val) => onChange(val || '')}
          disabled={disabled}
          labels={enLabels}
          limitMaxLength={true}
        />
        {/* Custom Arrow for country select */}
        <style>{`
          .PhoneInputCountryIcon {
            width: 24px;
            height: 16px;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
          }
          .PhoneInputCountrySelectArrow {
            display: block;
            width: 8px;
            height: 8px;
            margin-left: 4px;
            border-bottom: 2px solid var(--text-muted);
            border-right: 2px solid var(--text-muted);
            transform: rotate(45deg);
            opacity: 0.7;
          }
        `}</style>
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';