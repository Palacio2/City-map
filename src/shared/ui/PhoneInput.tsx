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
        className={`flex items-center w-full px-4 bg-body border rounded-lg transition-all focus-within:ring-2 focus-within:ring-accent/20 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:bg-hover [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:py-4 [&_.PhoneInputInput]:text-textMain [&_.PhoneInputInput]:font-body [&_.PhoneInputInput]:text-base [&_.PhoneInputInput]:outline-none [&_.PhoneInputCountrySelect]:bg-body [&_.PhoneInputCountrySelect]:text-textMain [&_.PhoneInputCountrySelect_option]:bg-body [&_.PhoneInputCountrySelect_option]:text-textMain [&_.PhoneInputCountry]:mr-3 [&_.PhoneInputCountry]:pr-3 [&_.PhoneInputCountry]:border-r [&_.PhoneInputCountry]:border-borderClient ${error ? 'border-danger focus-within:border-danger' : 'border-borderClient focus-within:border-accent'}`}
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
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';