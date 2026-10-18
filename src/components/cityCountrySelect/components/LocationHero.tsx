import { useTranslation } from 'react-i18next';

export const LocationHero = () => {
  const { t } = useTranslation('db');

  return (
    <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 flex flex-col items-center px-5 sm:px-0">
      {/* Main Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-textMain font-heading leading-tight mb-3">
        {t('country.title')}
      </h1>

      {/* Subtitle */}
      <p className="text-textSecondary text-base sm:text-lg font-medium leading-relaxed max-w-lg">
        {t(
          'country.subtitle',
          'Отримайте повну аналітику інфраструктури, безпеки та динаміки нерухомості по районах у реальному часі.'
        )}
      </p>
    </div>
  );
};
