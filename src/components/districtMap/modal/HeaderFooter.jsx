import React from 'react';
import headerFooterStyles from './styles/headerFooter.module.css';
import { CloseButton, FavoriteButton } from './Buttons';

// HeaderSection компонент
export function HeaderSection({ 
  district, 
  isFavorite, 
  onToggleFavorite, 
  isLoading, // ✅ Додано isLoading
  onClose,
  formatPrice,
  formatNumber 
}) {
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
              isLoading={isLoading} // ✅ Передача isLoading
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
              <span className={headerFooterStyles.quickStatLabel}>Ціна нерухомості:</span>
              <span className={headerFooterStyles.quickStatValue}>
                {formatPrice(filterData.general.propertyPrice)}
              </span>
            </div>
            <div className={headerFooterStyles.quickStat}>
              <span className={headerFooterStyles.quickStatLabel}>Щільність населення:</span>
              <span className={headerFooterStyles.quickStatValue}>
                {formatNumber(filterData.general.populationDensity)} осіб/км²
              </span>
            </div>
            <div className={headerFooterStyles.quickStat}>
              <span className={headerFooterStyles.quickStatLabel}>Зелені насадження:</span>
              <span className={headerFooterStyles.quickStatValue}>
                {filterData.general.greenSpaces?.toFixed(1) || 'н/д'}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ModalFooter компонент
export function ModalFooter({ onClose }) {
  return (
    <div className={headerFooterStyles.modalFooter}>
      <button 
        className={headerFooterStyles.simpleCloseButton}
        onClick={onClose}
      >
        Закрити
      </button>
    </div>
  );
}

// Експорт об'єктом
export default {
  HeaderSection,
  ModalFooter
};