import React from 'react';
import styles from './DistrictDetailsModal.module.css';

export default function DistrictDetailsModal({ district, isOpen, onClose }) {
  if (!isOpen || !district) return null;

  const formatNumber = (num) => {
    if (!num && num !== 0) return 'н/д';
    return new Intl.NumberFormat('uk-UA').format(num);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'н/д';
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderRating = (rating) => {
    if (!rating && rating !== 0) return 'н/д';
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className={styles.ratingStars}>
        {'★'.repeat(fullStars)}
        {halfStar && '½'}
        {'☆'.repeat(emptyStars)}
        <span className={styles.ratingValue}>({rating.toFixed(1)})</span>
      </div>
    );
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Заголовок з фото */}
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

        {/* Основна інформація */}
        <div className={styles.mainContent}>
          {district.filterData ? (
            <div className={styles.statsGrid}>
              {/* Освіта */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🎓</span>
                    <h3>Освіта</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(district.filterData.education?.rating)}`}>
                    {district.filterData.education?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Дитячі садки:</span>
                    <strong>{formatNumber(district.filterData.education?.kindergartens)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Школи:</span>
                    <strong>{formatNumber(district.filterData.education?.schools)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Університети:</span>
                    <strong>{formatNumber(district.filterData.education?.universities)}</strong>
                  </div>
                </div>
              </div>

              {/* Медицина */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🏥</span>
                    <h3>Медицина</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(district.filterData.medicine?.rating)}`}>
                    {district.filterData.medicine?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Лікарні:</span>
                    <strong>{formatNumber(district.filterData.medicine?.hospitals)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Клініки:</span>
                    <strong>{formatNumber(district.filterData.medicine?.clinics)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Аптеки:</span>
                    <strong>{formatNumber(district.filterData.medicine?.pharmacies)}</strong>
                  </div>
                </div>
              </div>

              {/* Транспорт */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🚍</span>
                    <h3>Транспорт</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(district.filterData.transport?.rating)}`}>
                    {district.filterData.transport?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Автобусні зупинки:</span>
                    <strong>{formatNumber(district.filterData.transport?.busStops)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Станції метро:</span>
                    <strong>{formatNumber(district.filterData.transport?.metroStations)}</strong>
                  </div>
                </div>
              </div>

              {/* Безпека */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🛡️</span>
                    <h3>Безпека</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(district.filterData.safety?.rating)}`}>
                    {district.filterData.safety?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Рівень злочинності:</span>
                    <strong className={`${getCrimeLevelClass(district.filterData.safety?.crimeLevel)}`}>
                      {getCrimeLevelText(district.filterData.safety?.crimeLevel)}
                    </strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Відділки поліції:</span>
                    <strong>{formatNumber(district.filterData.safety?.policeStations)}</strong>
                  </div>
                </div>
              </div>

              {/* Соціальна інфраструктура */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🌳</span>
                    <h3>Соціальна</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(district.filterData.social?.rating)}`}>
                    {district.filterData.social?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Парки:</span>
                    <strong>{formatNumber(district.filterData.social?.parks)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Дитячі майданчики:</span>
                    <strong>{formatNumber(district.filterData.social?.playgrounds)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Кафе та ресторани:</span>
                    <strong>{formatNumber(district.filterData.social?.cafesRestaurants)}</strong>
                  </div>
                </div>
              </div>

              {/* Комерція */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🛒</span>
                    <h3>Комерція</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(district.filterData.commerce?.rating)}`}>
                    {district.filterData.commerce?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Продуктові магазини:</span>
                    <strong>{formatNumber(district.filterData.commerce?.groceryStores)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Банки та банкомати:</span>
                    <strong>{formatNumber(district.filterData.commerce?.banksATMs)}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noData}>
              <div className={styles.noDataIcon}>📊</div>
              <h3>Дані відсутні</h3>
              <p>Інформація про цей район ще не додана до системи</p>
            </div>
          )}
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