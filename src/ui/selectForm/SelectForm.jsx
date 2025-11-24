import React, { useState, useCallback, useEffect, useRef } from 'react';
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
                    // Для нативних <option> клас стилів часто ігнорується, але залишаємо для прикладу
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
const ComboboxSelect = React.memo(({ options, selectedValue, onValueChange, disabled, isLoading, disabledMessage, isOptionDisabled }) => {
    
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

    const filteredOptions = options.filter(option => {
        if (!searchTerm) return false; // Не показуємо, якщо поле порожнє
        if (isOptionDisabled(option)) return false; // Приховуємо недоступні у підказках
        
        const normalizedTerm = normalize(searchTerm);
        return normalize(option.label).includes(normalizedTerm);
    }).slice(0, 10);

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
        // Якщо обрано фінальне значення, клік по стрілці не відкриває список
        if (selectedValue) return; 
        setIsSuggestionsOpen(prev => !prev);
        // Якщо список відкривається, оновлюємо searchTerm на порожній, 
        // щоб відобразити всі доступні опції, якщо це потрібно.
        if (!isSuggestionsOpen && !searchTerm) {
             // Можна встановити searchTerm: '', щоб показати всі, але 
             // за поточною логікою фільтрації це покаже "Нічого не знайдено". 
             // Залишаємо його як є, щоб змусити користувача вводити текст.
        }
    };

    const displayValue = selectedValue ? selectedLabel : searchTerm;
    const placeholder = selectedValue ? selectedLabel : "-- Почніть вводити назву міста --";


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
                    {searchTerm ? 'Не знайдено' : 'Почніть вводити назву...'}
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
  // ❗ НОВИЙ PROP ДЛЯ ПЕРЕМИКАННЯ РЕЖИМУ ❗
  isSearchable = false 
}) {
  const isOptionDisabled = useCallback((option) => option.disabled || false, []);

  // Перевірка можливості сабміту. Для Combobox - selectedValue має бути не порожнім
  // Для Dropdown - selectedValue має бути не порожнім (і не disabled, що перевіряється в опціях)
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