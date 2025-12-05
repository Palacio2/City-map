import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import styles from './SelectForm.module.css';

// Допоміжна функція для нормалізації тексту
const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ----------------------------------------------------------------------
// 1. КОМПОНЕНТ ДЛЯ СТАНДАРТНОГО ВИПАДАЮЧОГО СПИСКУ
// ----------------------------------------------------------------------
const DropdownSelect = React.memo(({ options, selectedValue, onValueChange, disabled, isLoading, disabledMessage, isOptionDisabled }) => (
    <div className={styles.selectWrapper}>
        <select
            className={`${styles.select} ${disabled ? styles.disabled : ''}`}
            value={selectedValue}
            onChange={(e) => onValueChange(e.target.value)}
            required
            disabled={disabled || isLoading}
        >
            <option value="">-- Виберіть зі списку --</option>
            {options.map(option => (
                <option 
                    key={option.value} 
                    value={option.value}
                    disabled={isOptionDisabled(option)}
                    className={isOptionDisabled(option) ? styles.disabledOption : ''}
                >
                    {option.label}
                    {isOptionDisabled(option) && ` (${disabledMessage})`}
                </option>
            ))}
        </select>
        <span className={styles.selectArrow}>▼</span>
    </div>
));


// ----------------------------------------------------------------------
// 2. КОМПОНЕНТ ДЛЯ ПОШУКУ З АВТОЗАПОВНЕННЯМ (COMBOBOX)
// ----------------------------------------------------------------------
const ComboboxSelect = React.memo(({ options, selectedValue, onValueChange, disabled, isLoading, isOptionDisabled }) => {
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const wrapperRef = useRef(null);
    
    const finalSelectedOption = options.find(option => option.value === selectedValue);
    const selectedLabel = finalSelectedOption ? finalSelectedOption.label : '';

    // Оновлення терміну пошуку, коли змінюється фінальний обраний елемент
    useEffect(() => {
        if (finalSelectedOption) {
            setSearchTerm(selectedLabel);
            setIsSuggestionsOpen(false);
        } else if (!selectedValue) {
            setSearchTerm('');
        }
    }, [selectedValue, selectedLabel, finalSelectedOption]);

    // Закриття списку підказок при кліку поза компонентом
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsSuggestionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ❗ ВИКОРИСТАННЯ useMemo ДЛЯ ОПТИМІЗАЦІЇ ФІЛЬТРАЦІЇ ❗
    const filteredOptions = useMemo(() => {
        const normalizedTerm = normalize(searchTerm.trim());
        const isSearchEmpty = normalizedTerm === '';
        
        return options.filter(option => {
            // Приховуємо недоступні
            if (isOptionDisabled(option)) return false; 
            
            // Якщо поле порожнє, показуємо всі доступні
            if (isSearchEmpty) return true; 
            
            // Фільтрація за пошуковим терміном
            return normalize(option.label).includes(normalizedTerm);
        }).slice(0, 10);
    }, [options, searchTerm, isOptionDisabled]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        // Скидаємо фінально обране значення, коли починається введення
        if (selectedValue) onValueChange(''); 
        setIsSuggestionsOpen(true);
    };
    
    const handleSuggestionClick = useCallback((option) => {
        onValueChange(option.value);
        setSearchTerm(option.label); 
        setIsSuggestionsOpen(false);
    }, [onValueChange]);
    
    const handleArrowClick = () => {
        // Якщо обрано фінальне значення, клік по стрілці не відкриває/закриває список
        if (selectedValue) return; 
        setIsSuggestionsOpen(prev => !prev);
    };

    const displayValue = selectedValue ? selectedLabel : searchTerm;
    const placeholder = "-- Почніть вводити назву міста --";


    return (
        <div className={styles.selectWrapper} ref={wrapperRef}>
            <input
              type="text"
              className={`${styles.select} ${styles.searchInput} ${disabled ? styles.disabled : ''}`}
              placeholder={placeholder}
              value={displayValue}
              onChange={handleInputChange}
              onFocus={() => setIsSuggestionsOpen(true)}
              disabled={disabled || isLoading}
              autoComplete="off"
            />
            
            <span 
                className={styles.selectArrow}
                onClick={handleArrowClick}
            >
                ▼
            </span>
            
            {(isSuggestionsOpen && !selectedValue) && (
              <ul className={styles.suggestionsList}>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => (
                    <li
                      key={option.value}
                      className={styles.suggestionItem}
                      onClick={() => handleSuggestionClick(option)}
                    >
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className={styles.noResults}>
                    {searchTerm.trim() ? 'Не знайдено' : 'Введіть назву для пошуку...'}
                  </li>
                )}
              </ul>
            )}
        </div>
    );
});


// ----------------------------------------------------------------------
// 3. ГОЛОВНИЙ КОМПОНЕНТ (ОБГОРТКА)
// ----------------------------------------------------------------------
export default function SelectForm({
  title,
  subtitle,
  options,
  selectedValue,
  onValueChange,
  onSubmit,
  onBack,
  submitText = 'Продовжити',
  backText = '← Назад',
  showBackButton = false,
  disabled = false,
  disabledMessage = 'Тимчасово недоступно',
  isLoading = false,
  isSearchable = false 
}) {
  const isOptionDisabled = useCallback((option) => option.disabled || false, []);

  // Перевірка можливості сабміту.
  const canSubmit = !disabled && !isLoading && !!selectedValue;

  // Вибір компонента
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
                selectedValue={selectedValue}
                onValueChange={onValueChange}
                disabled={disabled}
                isLoading={isLoading}
                disabledMessage={disabledMessage}
                isOptionDisabled={isOptionDisabled}
            />
          
          <div className={styles.buttonsContainer}>
            {showBackButton && (
              <button
                type="button"
                onClick={onBack}
                className={styles.backButton}
                disabled={isLoading}
              >
                {backText}
              </button>
            )}
            
            <button 
              type="submit" 
              className={`${styles.button} ${!canSubmit ? styles.disabledButton : ''}`}
              disabled={!canSubmit}
            >
              {isLoading ? 'Завантаження...' : 
               disabled ? disabledMessage : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}