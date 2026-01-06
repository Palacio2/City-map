import React from 'react';
import { useTranslation } from 'react-i18next';
import headerFooterStyles from './styles/headerFooter.module.css';
import { CloseButton, FavoriteButton } from './Buttons';
import { formatNumber, formatPrice } from '../../../utils/formatters';

export function HeaderSection({ 
  district, 
  isFavorite, 
  onToggleFavorite, 
  isLoading, 
  onClose 
}) {
  const { t } = useTranslation('districts');
  const { name, photo_url, photo_description } = district;
  const filterData = district.filterData;

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
          <h2 className={headerFooterStyles.modalTitle}>{name}</h2>
          <div className={headerFooterStyles.headerActions}>
            <FavoriteButton 
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
              isLoading={isLoading}
            />
            <CloseButton onClose={onClose} />
          </div>
        </div>
        {photo_description && (
          <p className={headerFooterStyles.photoDescription}>{photo_description}</p>
        )}
        {filterData?.general && (
          <div className={headerFooterStyles.quickStats}>
            <div className={headerFooterStyles.quickStat}>
              <span className={headerFooterStyles.quickStatLabel}>{t('details.price')}</span>
              <span className={headerFooterStyles.quickStatValue}>
                {formatPrice(filterData.general.propertyPrice)}
              </span>
            </div>
            <div className={headerFooterStyles.quickStat}>
              <span className={headerFooterStyles.quickStatLabel}>{t('details.density')}</span>
              <span className={headerFooterStyles.quickStatValue}>
                {formatNumber(filterData.general.populationDensity)} {t('details.density_unit')}
              </span>
            </div>
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