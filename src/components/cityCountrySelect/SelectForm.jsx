import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Loader from '@components/loader/Loader';

const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const StatusView = ({ title, subtitle, error, onBack, showRetry, onRetry }) => {
  const { t } = useTranslation('db');
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative z-10">
      <div className="ui-glass-panel max-w-md w-full p-10 text-center animate-popIn">
        <h1 className="font-heading text-2xl font-bold text-textMain mb-2">{title || t('select.error')}</h1>
        {subtitle && <p className="text-textSecondary mb-4">{subtitle}</p>}
        <p className="text-danger font-medium p-4 bg-danger/10 rounded-xl border border-danger/20 mb-8">{error}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {showRetry && (
            <button 
              onClick={onRetry || (() => window.location.reload())} 
              className="ui-button-primary w-full sm:w-auto py-3 px-6"
            >
              {t('select.retry')}
            </button>
          )}
          <button 
            onClick={onBack} 
            className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-borderClient text-textSecondary font-bold uppercase tracking-wide hover:border-textMain hover:text-textMain transition-colors"
          >
            {t('select.back')}
          </button>
        </div>
      </div>
    </div>
  );
};

const DropdownSelect = React.memo(({ options, value, onChange, disabled }) => {
  const { t } = useTranslation('db');

  return (
    <div className="relative w-full">
      <select
        className={`ui-input appearance-none pr-12 cursor-pointer font-medium ${disabled ? 'opacity-50 pointer-events-none bg-borderClient/50' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{t('select.select_placeholder')}</option>
        {options.filter(opt => !opt.disabled).map(opt => (
          <option key={opt.value} value={opt.value} className="bg-surface text-textMain">
            {opt.label}
          </option>
        ))}
      </select>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none text-xs">▼</span>
    </div>
  );
});

const ComboboxSelect = React.memo(({ options, value, onChange, disabled }) => {
  const { t } = useTranslation('db');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  
  const selectedLabel = useMemo(() => 
    options.find(o => o.value === value)?.label || '', 
  [options, value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch(''); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const activeOptions = options.filter(opt => !opt.disabled);
    if (!isOpen || !search) return activeOptions;
    const term = normalize(search);
    return activeOptions.filter(opt => normalize(opt.label).includes(term)).slice(0, 10);
  }, [options, search, isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setSearch('');
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
    if (value) onChange(''); 
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        className={`ui-input pr-12 font-medium ${disabled ? 'opacity-50 pointer-events-none bg-borderClient/50' : ''}`}
        placeholder={t('select.type_placeholder')}
        value={isOpen ? search : selectedLabel}
        onChange={handleInputChange}
        onFocus={() => {
          setSearch(''); 
          setIsOpen(true);
        }}
        disabled={disabled}
      />
      <button 
        type="button"
        className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center text-textSecondary hover:text-accent transition-colors"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
      >
        <span className="text-xs">▼</span>
      </button>
      
      {isOpen && (
        <ul className="absolute top-[calc(100%+8px)] left-0 w-full z-[200] bg-surface border border-borderClient rounded-xl shadow-2xl max-h-60 overflow-y-auto p-2 animate-fadeIn">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <li 
                key={opt.value} 
                className="px-4 py-3 text-sm font-medium text-textMain cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent transition-colors"
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="px-4 py-4 text-center text-textSecondary text-sm font-medium">
              {t('select.no_results')}
            </li>
          )}
        </ul>
      )}
    </div>
  );
});

export default function SelectForm({
  title, subtitle, options, selectedValue, onValueChange, onSubmit, onBack,
  submitText, backText, showBackButton = false,
  disabled = false, disabledMessage, isLoading = false, isSearchable = false
}) {
  const { t } = useTranslation('db');
  const isFormDisabled = disabled || isLoading;
  const SelectComponent = isSearchable ? ComboboxSelect : DropdownSelect;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative z-10">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="ui-glass-panel w-full max-w-lg p-8 sm:p-12 animate-popIn">
        <div className="text-center mb-10">
          <h1 className="ui-heading-2 !mb-2">{title}</h1>
          {subtitle && <p className="text-textSecondary font-medium">{subtitle}</p>}
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-8">
          <SelectComponent 
            options={options}
            value={selectedValue}
            onChange={onValueChange}
            disabled={isFormDisabled}
          />
          
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4 border-t border-borderClient">
            {showBackButton && (
              <button 
                type="button" 
                onClick={onBack} 
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border-2 border-borderClient text-textSecondary font-bold uppercase tracking-wide hover:border-textMain hover:text-textMain transition-colors flex-[0.5]" 
                disabled={isLoading}
              >
                {backText || t('select.back')}
              </button>
            )}
            <button 
              type="submit" 
              className="ui-button-primary w-full flex-1 group"
              disabled={!selectedValue || isFormDisabled}
            >
              {isLoading ? (
                <Loader size="small" />
              ) : (
                <span className="group-hover:-translate-y-0.5 transition-transform">
                  {disabled ? (disabledMessage || t('select.unavailable')) : (submitText || t('select.continue'))}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}