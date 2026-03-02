import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Loader from '@components/loader/Loader';
import styles from './SelectForm.module.css';

const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const StatusView = ({ title, subtitle, error, onBack, showRetry, onRetry }) => {
  const { t } = useTranslation('select');
  
  return (
    <div className={styles.errorContainer}>
      <h1 className={styles.title}>{title || t('error')}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <p className={styles.errorMessage}>{error}</p>
      <div className={`${styles.buttonsContainer} ${styles.centeredButtons}`}>
        {showRetry && (
          <button onClick={onRetry || (() => window.location.reload())} className={styles.button}>
            {t('retry')}
          </button>
        )}
        <button onClick={onBack} className={styles.backButton}>{t('back')}</button>
      </div>
    </div>
  );
};

const DropdownSelect = React.memo(({ options, value, onChange, disabled }) => {
  const { t } = useTranslation('select');

  return (
    <div className={styles.selectWrapper}>
      <select
        className={`${styles.select} ${disabled ? styles.disabled : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{t('select_placeholder')}</option>
        {options.filter(opt => !opt.disabled).map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className={styles.selectArrow}>▼</span>
    </div>
  );
});

const ComboboxSelect = React.memo(({ options, value, onChange, disabled }) => {
  const { t } = useTranslation('select');
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
    <div className={styles.selectWrapper} ref={wrapperRef}>
      <input
        className={`${styles.select} ${styles.searchInput} ${disabled ? styles.disabled : ''}`}
        placeholder={t('type_placeholder')}
        value={isOpen ? search : selectedLabel}
        onChange={handleInputChange}
        onFocus={() => {
          setSearch(''); 
          setIsOpen(true);
        }}
        disabled={disabled}
      />
      <span 
        className={styles.selectArrow} 
        onClick={() => !disabled && setIsOpen(prev => !prev)}
      >
        ▼
      </span>
      
      {isOpen && (
        <ul className={styles.suggestionsList}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <li 
                key={opt.value} 
                className={styles.suggestionItem} 
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className={styles.noResults}>{t('no_results')}</li>
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
  const { t } = useTranslation('select');
  const isFormDisabled = disabled || isLoading;
  const SelectComponent = isSearchable ? ComboboxSelect : DropdownSelect;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        
        <form onSubmit={onSubmit} className={styles.form}>
          <SelectComponent 
            options={options}
            value={selectedValue}
            onChange={onValueChange}
            disabled={isFormDisabled}
          />
          
          <div className={styles.buttonsContainer}>
            {showBackButton && (
              <button type="button" onClick={onBack} className={styles.backButton} disabled={isLoading}>
                {backText || t('back')}
              </button>
            )}
            <button 
              type="submit" 
              className={styles.button}
              disabled={!selectedValue || isFormDisabled}
            >
              {isLoading ? (
                <Loader size="small" />
              ) : (
                disabled ? (disabledMessage || t('unavailable')) : (submitText || t('continue'))
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}