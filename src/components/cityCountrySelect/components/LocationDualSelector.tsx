import { useTranslation } from 'react-i18next';
import { FaGlobe, FaCity, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { LocationCombobox } from './LocationCombobox';
import type { LocationDualSelectorProps } from '../types';

export const LocationDualSelector = ({
  countryOptions,
  cityOptions,
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
  onSubmit,
  isLoadingCountries,
  isLoadingCities,
}: LocationDualSelectorProps) => {
  const { t } = useTranslation('db');

  const isFormDisabled = isLoadingCountries || isLoadingCities;
  const canSubmit = Boolean(selectedCountry && selectedCity && !isFormDisabled);

  return (
    <div className="w-full max-w-xl mx-auto p-6 sm:p-8 md:p-10 bg-surface border-y sm:border border-borderClient rounded-none sm:rounded-3xl shadow-xl backdrop-blur-md relative z-10 transition-all">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* Country Selector */}
        <div className="relative z-30">
          <LocationCombobox
            id="country-selector"
            label={t('stats.labels.country', 'Країна')}
            options={countryOptions}
            value={selectedCountry}
            onChange={onCountryChange}
            disabled={isLoadingCountries}
            placeholder={
              isLoadingCountries
                ? t('country.loading', 'Завантаження країн...')
                : t('stats.placeholders.select_country', 'Оберіть країну...')
            }
            icon={<FaGlobe />}
          />
        </div>

        {/* City Selector */}
        <div
          className={`relative z-20 transition-all duration-300 ${
            !selectedCountry ? 'opacity-50 grayscale' : 'opacity-100 grayscale-0'
          }`}
        >
          <LocationCombobox
            id="city-selector"
            label={t('stats.labels.city', 'Місто')}
            options={cityOptions}
            value={selectedCity}
            onChange={onCityChange}
            disabled={!selectedCountry || isLoadingCities}
            placeholder={
              !selectedCountry
                ? t('stats.status.select_country_first', 'Спочатку оберіть країну')
                : isLoadingCities
                ? t('city.loading', 'Завантаження міст...')
                : t('stats.placeholders.select_city', 'Оберіть місто...')
            }
            icon={<FaCity />}
            badge={
              selectedCountry && cityOptions.length > 0
                ? `${cityOptions.length} доступно`
                : undefined
            }
          />
        </div>

        {/* Submit Action Button */}
        <div className="pt-3 border-t border-borderClient mt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              w-full py-4 px-6 rounded-xl font-bold font-sans text-base transition-all duration-300
              flex items-center justify-center gap-2 group cursor-pointer shadow-md
              ${
                canSubmit
                  ? 'bg-primary text-white hover:brightness-110 active:scale-[0.99] shadow-[0_10px_25px_rgba(5,150,105,0.25)] dark:shadow-[0_10px_25px_rgba(16,185,129,0.2)]'
                  : 'bg-black/10 dark:bg-white/10 text-textSecondary cursor-not-allowed opacity-60'
              }
            `}
          >
            {isFormDisabled ? (
              <FaSpinner className="animate-spin text-lg" />
            ) : (
              <>
                <span>{t('select.continue')}</span>
                <FaArrowRight
                  className={`text-sm transition-transform duration-200 ${
                    canSubmit ? 'group-hover:translate-x-1' : ''
                  }`}
                />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
