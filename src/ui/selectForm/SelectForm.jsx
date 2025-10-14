import React from 'react';
import styles from './SelectForm.module.css';

export default function SelectForm({
  title,
  subtitle,
  options,
  selectedValue,
  onValueChange,
  onSubmit,
  onBack, // Нова пропс для кнопки назад
  submitText = 'Продовжити',
  backText = '← Назад', // Текст для кнопки назад
  showBackButton = false, // Чи показувати кнопку назад
  disabled = false,
  disabledMessage = 'Тимчасово недоступно',
  isLoading = false
}) {
  const isOptionDisabled = (option) => option.disabled || false;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        
        <form onSubmit={onSubmit} className={styles.form}>
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
              className={`${styles.button} ${disabled ? styles.disabledButton : ''}`}
              disabled={disabled || isLoading || !selectedValue}
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