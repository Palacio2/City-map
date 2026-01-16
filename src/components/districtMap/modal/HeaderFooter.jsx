import React from 'react';
import { useTranslation } from 'react-i18next';
import headerFooterStyles from './styles/headerFooter.module.css';
import { CloseButton, FavoriteButton } from './Buttons';

export function HeaderSection({ 
  district, 
  isFavorite, 
  onToggleFavorite, 
  isLoading, 
  onClose,
  formatNumber,
  formatPrice,
  currencyInfo
}) {
  const { t, i18n } = useTranslation('districts'); // Додали i18n для локалізації дати
  const { name, photo_url, photo_description, updated_at } = district; // Дістаємо updated_at
  const filterData = district.filterData;
  const { code, locale } = currencyInfo || { code: 'UAH', locale: 'uk-UA' };

  // Форматування дати
  const formattedDate = updated_at 
    ? new Date(updated_at).toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : null;

  return (
    <div className={headerFooterStyles.headerSection}>
      {photo_url && (
        <img 
          src={photo_url} 
          alt={photo_description || name}
          className={headerFooterStyles.headerPhoto}
        />
      )}
      <div className={headerFooterStyles.headerContent}>
        <div className={headerFooterStyles.headerTop}>
          <div className={headerFooterStyles.titleWrapper}>
            <h2 className={headerFooterStyles.modalTitle}>{name}</h2>
            {formattedDate && (
              <span className={headerFooterStyles.lastUpdated}>
                {t('details.updated_at', { date: formattedDate })}
              </span>
            )}
          </div>
          
          <div className={headerFooterStyles.headerActions}>
            <FavoriteButton 
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
              isLoading={isLoading}
            />
            <CloseButton onClose={onClose} />
          </div>
        </div>

        {filterData?.general && (
          <div className={headerFooterStyles.quickStatsBar}>
            {filterData.general.population > 0 && (
                <div className={headerFooterStyles.quickStat}>
                <span className={headerFooterStyles.quickStatLabel}>{t('details.population')}</span>
                <span className={headerFooterStyles.quickStatValue}>
                    {formatNumber(filterData.general.population)}
                </span>
                </div>
            )}

            {filterData.general.averageSalary > 0 && (
                <div className={headerFooterStyles.quickStat}>
                <span className={headerFooterStyles.quickStatLabel}>{t('details.salary')}</span>
                <span className={headerFooterStyles.quickStatValue}>
                    {formatPrice(filterData.general.averageSalary, code, locale)}
                </span>
                </div>
            )}

            {filterData.general.unemploymentRate > 0 && (
                <div className={headerFooterStyles.quickStat}>
                <span className={headerFooterStyles.quickStatLabel}>{t('details.unemployment')}</span>
                <span className={headerFooterStyles.quickStatValue}>
                    {filterData.general.unemploymentRate}%
                </span>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalFooter({ onClose }) {
  const { t } = useTranslation('districts');
  return (
    <div className={headerFooterStyles.modalFooter}>
      <button className={headerFooterStyles.simpleCloseButton} onClick={onClose}>
        {t('buttons.close')}
      </button>
    </div>
  );
}