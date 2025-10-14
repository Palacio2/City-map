import React from 'react';
import styles from './DistrictDetailsModal.module.css';

export default function DistrictDetailsModal({ district, isOpen, onClose }) {
  if (!isOpen || !district) return null;

  // Функції для форматування
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

  const getCrimeLevelClass = (crimeLevel) => {
    if (!crimeLevel && crimeLevel !== 0) return '';
    if (crimeLevel <= 3) return styles.lowCrime;
    if (crimeLevel <= 6) return styles.mediumCrime;
    return styles.highCrime;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{district.name}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {district.filterData ? (
            <div className={styles.detailsGrid}>
              {/* Освіта */}
              <div className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>🎓</span>
                  <h3 className={styles.categoryTitle}>Освіта</h3>
                </div>
                <div className={styles.categoryStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Загальний рейтинг:</span>
                    <span className={styles.statValue}>
                      {renderRating(district.filterData.education?.rating)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Дитячі садки:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.education?.kindergartens)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Школи:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.education?.schools)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Університети:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.education?.universities)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Транспорт */}
              <div className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>🚍</span>
                  <h3 className={styles.categoryTitle}>Транспорт</h3>
                </div>
                <div className={styles.categoryStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Загальний рейтинг:</span>
                    <span className={styles.statValue}>
                      {renderRating(district.filterData.transport?.rating)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Автобусні зупинки:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.transport?.busStops)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Станції метро:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.transport?.metroStations)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Велосипедні доріжки:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.transport?.bikeLanesKm)} км
                    </span>
                  </div>
                </div>
              </div>

              {/* Безпека */}
              <div className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>🛡️</span>
                  <h3 className={styles.categoryTitle}>Безпека</h3>
                </div>
                <div className={styles.categoryStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Загальний рейтинг:</span>
                    <span className={styles.statValue}>
                      {renderRating(district.filterData.safety?.rating)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Рівень злочинності:</span>
                    <span className={`${styles.statValue} ${getCrimeLevelClass(district.filterData.safety?.crimeLevel)}`}>
                      {district.filterData.safety?.crimeLevel?.toFixed(1) || 'н/д'}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Відділки поліції:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.safety?.policeStations)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Соціальна інфраструктура */}
              <div className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>🌳</span>
                  <h3 className={styles.categoryTitle}>Соціальна інфраструктура</h3>
                </div>
                <div className={styles.categoryStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Загальний рейтинг:</span>
                    <span className={styles.statValue}>
                      {renderRating(district.filterData.social?.rating)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Парки:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.social?.parks)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Дитячі майданчики:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.social?.playgrounds)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Кафе та ресторани:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.social?.cafesRestaurants)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Медицина */}
              <div className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>🏥</span>
                  <h3 className={styles.categoryTitle}>Медицина</h3>
                </div>
                <div className={styles.categoryStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Загальний рейтинг:</span>
                    <span className={styles.statValue}>
                      {renderRating(district.filterData.medicine?.rating)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Лікарні:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.medicine?.hospitals)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Клініки:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.medicine?.clinics)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Аптеки:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.medicine?.pharmacies)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Комерція */}
              <div className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>🛒</span>
                  <h3 className={styles.categoryTitle}>Комерція</h3>
                </div>
                <div className={styles.categoryStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Загальний рейтинг:</span>
                    <span className={styles.statValue}>
                      {renderRating(district.filterData.commerce?.rating)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Продуктові магазини:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.commerce?.groceryStores)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Торгові центри:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.commerce?.shoppingMalls)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Банки та банкомати:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.commerce?.banksATMs)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Загальні показники */}
              <div className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>📊</span>
                  <h3 className={styles.categoryTitle}>Загальні показники</h3>
                </div>
                <div className={styles.categoryStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Щільність населення:</span>
                    <span className={styles.statValue}>
                      {formatNumber(district.filterData.general?.populationDensity)} осіб/км²
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Середня ціна нерухомості:</span>
                    <span className={styles.statValue}>
                      {formatPrice(district.filterData.general?.propertyPrice)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Зелені насадження:</span>
                    <span className={styles.statValue}>
                      {district.filterData.general?.greenSpaces?.toFixed(1) || 'н/д'}%
                    </span>
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
          <button className={styles.closeModalButton} onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}