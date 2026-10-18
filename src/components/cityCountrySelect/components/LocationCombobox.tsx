import { useTranslation } from 'react-i18next';
import { FaTimes, FaChevronDown, FaCheck } from 'react-icons/fa';
import { useComboboxFilter } from '../hooks/useComboboxFilter';
import type { LocationComboboxProps } from '../types';

export const LocationCombobox = ({
  options,
  value,
  onChange,
  disabled = false,
  placeholder,
  icon,
  id,
  label,
  badge,
}: LocationComboboxProps) => {
  const { t } = useTranslation('db');

  const {
    isOpen,
    setIsOpen,
    search,
    setSearch,
    highlightedIndex,
    wrapperRef,
    inputRef,
    selectedLabel,
    filteredOptions,
    selectOption,
    clearSelection,
    handleKeyDown,
  } = useComboboxFilter({
    options,
    value,
    onChange,
    disabled,
  });

  return (
    <div className="relative w-full flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="text-xs font-bold uppercase tracking-wider text-textSecondary select-none"
          >
            {label}
          </label>
          {badge && (
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary-subtle text-primary">
              {badge}
            </span>
          )}
        </div>
      )}

      <div className="relative w-full group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary group-focus-within:text-primary transition-colors pointer-events-none text-base">
            {icon}
          </div>
        )}

        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder={placeholder}
          value={isOpen ? search : selectedLabel}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (value) onChange('');
          }}
          onFocus={() => {
            if (!disabled) {
              setSearch('');
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`
            w-full py-3.5 pr-20 bg-body text-textMain
            border border-borderClient rounded-xl outline-hidden font-medium
            text-sm sm:text-base transition-all duration-200
            ${icon ? 'pl-11' : 'pl-4'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : 'hover:border-textSecondary focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20 shadow-xs'}
          `}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(value || (isOpen && search)) && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-textSecondary hover:text-danger hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Clear"
            >
              <FaTimes className="text-xs" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-textSecondary group-focus-within:text-primary transition-transform duration-200 cursor-pointer"
          >
            <FaChevronDown
              className={`text-xs transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-primary' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Options List */}
      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full z-[300] bg-surface border border-borderClient rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden animate-fadeIn">
          <ul className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!opt.disabled) {
                        selectOption(opt.value);
                      }
                    }}
                    className={`
                      px-3.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors flex items-center justify-between
                      ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5'
                          : isSelected
                          ? 'bg-primary-subtle text-primary font-semibold'
                          : isHighlighted
                          ? 'bg-hover text-textMain'
                          : 'text-textMain hover:bg-hover'
                      }
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="leading-snug">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-textSecondary">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {opt.disabled && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-textSecondary">
                          {t('select.unavailable')}
                        </span>
                      )}
                      {isSelected && (
                        <FaCheck className="text-xs text-primary shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-6 text-center text-textSecondary text-sm font-medium">
                {t('select.no_results')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
