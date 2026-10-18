import { useTranslation } from 'react-i18next';
import { FaFire } from 'react-icons/fa';
import { LocationCard } from './LocationCard';
import type { PopularLocationsProps } from '../types';

export const PopularLocations = ({
  selectedCountry,
  popularCities,
  isLoading,
  onSelectLocation,
}: PopularLocationsProps) => {
  const { t } = useTranslation('db');

  if (!isLoading && (!popularCities || popularCities.length === 0)) {
    return null;
  }

  const title = selectedCountry
    ? t('country.popular_in_country', { country: selectedCountry })
    : t('country.popular_title');

  const subtitle = selectedCountry
    ? t('country.popular_in_country_subtitle')
    : t('country.popular_subtitle');

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 sm:mt-16 animate-fadeIn">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg">
            <FaFire />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-xl sm:text-2xl font-bold text-textMain font-heading leading-tight">
              {title}
            </h2>
            <p className="text-sm text-textSecondary mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-28 rounded-2xl bg-surface border border-borderClient animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10" />
                <div className="w-16 h-5 rounded-full bg-black/10 dark:bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 rounded-sm bg-black/10 dark:bg-white/10" />
                <div className="w-14 h-3 rounded-sm bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {popularCities.map((cityItem) => (
            <LocationCard
              key={cityItem.id}
              item={cityItem}
              onClick={onSelectLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
};
