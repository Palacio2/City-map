import React from 'react';
import styles from '../DistrictDetailsModal.module.css';

const ModalHeader = ({ district, onClose, formatPrice, formatNumber }) => (
  <div className={styles.headerSection}>
    {district.photo_url && (
      <img
        src={district.photo_url}
        alt={district.photo_description || district.name}
        className={styles.headerPhoto}
      />
    )}
    <div className={styles.headerContent}>
      <div className={styles.headerTop}>
        <h2 className={styles.modalTitle}>{district.name}</h2>
        <button className={styles.closeButton} onClick={onClose} aria-label="Закрити">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {district.photo_description && (
        <p className={styles.photoDescription}>{district.photo_description}</p>
      )}
      {district.filterData?.general && (
        <div className={styles.quickStats}>
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>Ціна нерухомості:</span>
            <span className={styles.quickStatValue}>
              {formatPrice(district.filterData.general.propertyPrice)}
            </span>
          </div>
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>Щільність населення:</span>
            <span className={styles.quickStatValue}>
              {formatNumber(district.filterData.general.populationDensity)} осіб/км²
            </span>
          </div>
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>Зелені насадження:</span>
            <span className={styles.quickStatValue}>
              {district.filterData.general.greenSpaces?.toFixed(1) || 'н/д'}%
            </span>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default ModalHeader;
