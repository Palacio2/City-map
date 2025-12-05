import React from 'react';
import styles from './DistrictDetailsModal.module.css';
import ModalHeader from './modalSections/ModalHeader';
import ModalStatsGrid from './modalSections/ModalStatsGrid';

const formatNumber = (num) => {
  if (!num && num !== 0) return 'н/д';
  return new Intl.NumberFormat('uk-UA').format(num);
};

const formatPrice = (price) => {
  if (!price && price !== 0) return 'н/д';
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
  }).format(price);
};

const getCrimeLevelText = (crimeLevel) => {
  if (!crimeLevel && crimeLevel !== 0) return 'н/д';
  if (crimeLevel <= 3) return 'Низький';
  if (crimeLevel <= 6) return 'Середній';
  return 'Високий';
};

const getCrimeLevelClass = (crimeLevel) => {
  if (!crimeLevel && crimeLevel !== 0) return '';
  if (crimeLevel <= 3) return styles.lowCrime;
  if (crimeLevel <= 6) return styles.mediumCrime;
  return styles.highCrime;
};

const getRatingColor = (rating) => {
  if (!rating && rating !== 0) return '';
  if (rating >= 8) return styles.highRating;
  if (rating >= 5) return styles.mediumRating;
  return styles.lowRating;
};

export default function DistrictDetailsModal({ district, isOpen, onClose }) {
  if (!isOpen || !district) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <ModalHeader
          district={district}
          onClose={onClose}
          formatPrice={formatPrice}
          formatNumber={formatNumber}
        />

        <div className={styles.mainContent}>
          <ModalStatsGrid
            filterData={district.filterData}
            getRatingColor={getRatingColor}
            formatNumber={formatNumber}
            getCrimeLevelText={getCrimeLevelText}
            getCrimeLevelClass={getCrimeLevelClass}
          />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeButtonSecondary} onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
