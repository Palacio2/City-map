// components/DistrictModal/DistrictModal.jsx
import React from 'react';
import styles from './DistrictModal.module.css';

export default function DistrictModal({ district, onClose, formatPrice, renderStars }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getRatingColor = (rating) => {
    if (!rating) return '#999';
    if (rating >= 8) return '#4CAF50'; // зелений
    if (rating >= 6) return '#FFC107'; // жовтий
    if (rating >= 4) return '#FF9800'; // оранжевий
    return '#F44336'; // червоний
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div className={styles.modalHeader}>
          <h2>{district.name}</h2>
          <div className={styles.location}>
            <span>{district.city}</span>
            {district.country !== "Невідомо" && (
              <span className={styles.country}>, {district.country}</span>
            )}
          </div>
        </div>

        <div className={styles.modalContent}>
          {/* Ціна */}
          {district.filterData?.general?.propertyPrice && (
            <div className={styles.priceSection}>
              <h3>💰 Середня ціна нерухомості</h3>
              <div className={styles.priceValue}>
                {formatPrice(district.filterData.general.propertyPrice)}
              </div>
            </div>
          )}

          {/* Рейтинги */}
          {district.filterData && (
            <div className={styles.ratingsSection}>
              <h3>📊 Рейтинги району</h3>
              
              <div className={styles.ratingsGrid}>
                {district.filterData.education?.rating && (
                  <div className={styles.ratingItem}>
                    <div className={styles.ratingLabel}>
                      <span className={styles.ratingIcon}>🎓</span>
                      <span>Освіта</span>
                    </div>
                    <div className={styles.ratingValue}>
                      <div className={styles.stars}>
                        {renderStars(district.filterData.education.rating)}
                      </div>
                      <div 
                        className={styles.ratingNumber}
                        style={{ color: getRatingColor(district.filterData.education.rating) }}
                      >
                        {district.filterData.education.rating.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                )}

                {district.filterData.transport?.rating && (
                  <div className={styles.ratingItem}>
                    <div className={styles.ratingLabel}>
                      <span className={styles.ratingIcon}>🚍</span>
                      <span>Транспорт</span>
                    </div>
                    <div className={styles.ratingValue}>
                      <div className={styles.stars}>
                        {renderStars(district.filterData.transport.rating)}
                      </div>
                      <div 
                        className={styles.ratingNumber}
                        style={{ color: getRatingColor(district.filterData.transport.rating) }}
                      >
                        {district.filterData.transport.rating.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                )}

                {district.filterData.safety?.rating && (
                  <div className={styles.ratingItem}>
                    <div className={styles.ratingLabel}>
                      <span className={styles.ratingIcon}>🛡️</span>
                      <span>Безпека</span>
                    </div>
                    <div className={styles.ratingValue}>
                      <div className={styles.stars}>
                        {renderStars(district.filterData.safety.rating)}
                      </div>
                      <div 
                        className={styles.ratingNumber}
                        style={{ color: getRatingColor(district.filterData.safety.rating) }}
                      >
                        {district.filterData.safety.rating.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                )}

                {district.filterData.social?.rating && (
                  <div className={styles.ratingItem}>
                    <div className={styles.ratingLabel}>
                      <span className={styles.ratingIcon}>👥</span>
                      <span>Соціальна сфера</span>
                    </div>
                    <div className={styles.ratingValue}>
                      <div className={styles.stars}>
                        {renderStars(district.filterData.social.rating)}
                      </div>
                      <div 
                        className={styles.ratingNumber}
                        style={{ color: getRatingColor(district.filterData.social.rating) }}
                      >
                        {district.filterData.social.rating.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                )}

                {district.filterData.medicine?.rating && (
                  <div className={styles.ratingItem}>
                    <div className={styles.ratingLabel}>
                      <span className={styles.ratingIcon}>🏥</span>
                      <span>Медицина</span>
                    </div>
                    <div className={styles.ratingValue}>
                      <div className={styles.stars}>
                        {renderStars(district.filterData.medicine.rating)}
                      </div>
                      <div 
                        className={styles.ratingNumber}
                        style={{ color: getRatingColor(district.filterData.medicine.rating) }}
                      >
                        {district.filterData.medicine.rating.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                )}

                {district.filterData.commerce?.rating && (
                  <div className={styles.ratingItem}>
                    <div className={styles.ratingLabel}>
                      <span className={styles.ratingIcon}>🛒</span>
                      <span>Торгівля</span>
                    </div>
                    <div className={styles.ratingValue}>
                      <div className={styles.stars}>
                        {renderStars(district.filterData.commerce.rating)}
                      </div>
                      <div 
                        className={styles.ratingNumber}
                        style={{ color: getRatingColor(district.filterData.commerce.rating) }}
                      >
                        {district.filterData.commerce.rating.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Додаткова інформація */}
          {district.filterData?.general && (
            <div className={styles.additionalInfo}>
              <h3>📈 Додаткова інформація</h3>
              <div className={styles.infoGrid}>
                {district.filterData.general.populationDensity && (
                  <div className={styles.infoItem}>
                    <span>👥 Густота населення:</span>
                    <span>{district.filterData.general.populationDensity} чол./км²</span>
                  </div>
                )}
                {district.addedAt && (
                  <div className={styles.infoItem}>
                    <span>📅 Додано:</span>
                    <span>{new Date(district.addedAt).toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}