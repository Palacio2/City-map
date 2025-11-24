// FavoritesPage.jsx
import React from 'react';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage({ favorites, onRemoveFavorite, onDistrictClick }) {
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

  if (!favorites || favorites.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Улюблені райони</h1>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤍</div>
          <h2 className={styles.emptyTitle}>Немає улюблених районів</h2>
          <p className={styles.emptyDescription}>
            Додавайте райони до улюблених, натискаючи на сердечко в їх описі
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Улюблені райони</h1>
        <div className={styles.favoritesCount}>
          {favorites.length} район{favorites.length === 1 ? '' : 'и'}
        </div>
      </div>

      <div className={styles.favoritesGrid}>
        {favorites.map((district) => (
          <div key={district.id} className={styles.favoriteCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.districtName}>{district.name}</h3>
              <button
                className={styles.removeButton}
                onClick={() => onRemoveFavorite(district.id)}
                aria-label="Видалити з улюблених"
                title="Видалити з улюблених"
              >
                ❌
              </button>
            </div>

            {district.filterData?.general?.propertyPrice && (
              <div className={styles.price}>
                {formatPrice(district.filterData.general.propertyPrice)}
              </div>
            )}

            <div className={styles.statsGrid}>
              {district.filterData?.education?.rating && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>🎓 Освіта</span>
                  <span className={styles.statValue}>
                    {renderRating(district.filterData.education.rating)}
                  </span>
                </div>
              )}
              
              {district.filterData?.transport?.rating && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>🚍 Транспорт</span>
                  <span className={styles.statValue}>
                    {renderRating(district.filterData.transport.rating)}
                  </span>
                </div>
              )}
              
              {district.filterData?.safety?.rating && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>🛡️ Безпека</span>
                  <span className={styles.statValue}>
                    {renderRating(district.filterData.safety.rating)}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              <button
                className={styles.detailsButton}
                onClick={() => onDistrictClick(district)}
              >
                Детальніше
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}