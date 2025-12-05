import React, { useState, useEffect } from 'react';
import styles from './DistrictDetailsModal.module.css';

export default function DistrictDetailsModal({ district, isOpen, onClose, onToggleFavorite }) {
  if (!isOpen || !district) return null;

  const [isFavorite, setIsFavorite] = useState(false);

  // Перевіряємо чи район вже в улюблених при відкритті
  useEffect(() => {
    if (district) {
      const favorites = JSON.parse(localStorage.getItem('favoriteDistricts') || '[]');
      setIsFavorite(favorites.some(fav => fav.id === district.id));
    }
  }, [district]);

  // Функція для додавання/видалення з улюблених
  const handleToggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDistricts') || '[]');
    
    if (isFavorite) {
      // Видаляємо з улюблених
      const updatedFavorites = favorites.filter(fav => fav.id !== district.id);
      localStorage.setItem('favoriteDistricts', JSON.stringify(updatedFavorites));
    } else {
      // Додаємо до улюблених
      const districtToSave = {
        id: district.id,
        name: district.name,
        photo_url: district.photo_url,
        photo_description: district.photo_description,
        city: district.city,
        country: district.country,
        addedDate: new Date().toISOString()
      };
      
      favorites.push(districtToSave);
      localStorage.setItem('favoriteDistricts', JSON.stringify(favorites));
    }
    
    setIsFavorite(!isFavorite);
    onToggleFavorite?.(district.id, !isFavorite);
  };

  // Функції форматування
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

  const formatBoolean = (value) => {
    return value ? '✅' : '❌';
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

  const getFrequencyText = (frequency) => {
    if (!frequency) return 'н/д';
    switch (frequency) {
      case 'high': return 'Висока';
      case 'medium': return 'Середня';
      case 'low': return 'Низька';
      default: return frequency;
    }
  };

  const getDensityText = (density) => {
    if (!density) return 'н/д';
    switch (density) {
      case 'high': return 'Висока';
      case 'medium': return 'Середня';
      case 'low': return 'Низька';
      default: return density;
    }
  };

  const getRatingColor = (rating) => {
    if (!rating && rating !== 0) return '';
    if (rating >= 8) return styles.highRating;
    if (rating >= 5) return styles.mediumRating;
    return styles.lowRating;
  };

  // Дані вже трансформовані в DistrictMap.jsx
  const filterData = district.filterData;

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
              <div className={styles.headerActions}>
                <button 
                  className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`}
                  onClick={handleToggleFavorite}
                  aria-label={isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
                  title={isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "#ff4757" : "none"} stroke={isFavorite ? "#ff4757" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <button className={styles.closeButton} onClick={onClose} aria-label="Закрити">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            {district.photo_description && (
              <p className={styles.photoDescription}>{district.photo_description}</p>
            )}
            {filterData?.general && (
              <div className={styles.quickStats}>
                <div className={styles.quickStat}>
                  <span className={styles.quickStatLabel}>Ціна нерухомості:</span>
                  <span className={styles.quickStatValue}>
                    {formatPrice(filterData.general.propertyPrice)}
                  </span>
                </div>
                <div className={styles.quickStat}>
                  <span className={styles.quickStatLabel}>Щільність населення:</span>
                  <span className={styles.quickStatValue}>
                    {formatNumber(filterData.general.populationDensity)} осіб/км²
                  </span>
                </div>
                <div className={styles.quickStat}>
                  <span className={styles.quickStatLabel}>Зелені насадження:</span>
                  <span className={styles.quickStatValue}>
                    {filterData.general.greenSpaces?.toFixed(1) || 'н/д'}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Основна інформація */}
        <div className={styles.mainContent}>
          {filterData ? (
            <div className={styles.statsGrid}>
              {/* Освіта */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🎓</span>
                    <h3>Освіта</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(filterData.education?.rating)}`}>
                    {filterData.education?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Дитячі садки:</span>
                    <strong>{formatNumber(filterData.education?.kindergartens)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Школи:</span>
                    <strong>{formatNumber(filterData.education?.schools)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Університети:</span>
                    <strong>{formatNumber(filterData.education?.universities)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Загальний рейтинг:</span>
                    <strong>{filterData.education?.rating?.toFixed(1) || 'н/д'}/10</strong>
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
                  <div className={`${styles.cardRating} ${getRatingColor(filterData.medicine?.rating)}`}>
                    {filterData.medicine?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Лікарні:</span>
                    <strong>{formatNumber(filterData.medicine?.hospitals)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Клініки:</span>
                    <strong>{formatNumber(filterData.medicine?.clinics)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Аптеки:</span>
                    <strong>{formatNumber(filterData.medicine?.pharmacies)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Служби екстреної допомоги:</span>
                    <strong>{formatNumber(filterData.medicine?.emergencyServices)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Загальний рейтинг:</span>
                    <strong>{filterData.medicine?.rating?.toFixed(1) || 'н/д'}/10</strong>
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
                  <div className={`${styles.cardRating} ${getRatingColor(filterData.transport?.rating)}`}>
                    {filterData.transport?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Автобусні зупинки:</span>
                    <strong>{formatNumber(filterData.transport?.busStops)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Трамвайні зупинки:</span>
                    <strong>{formatNumber(filterData.transport?.tramStops)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Станції метро:</span>
                    <strong>{formatNumber(filterData.transport?.metroStations)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Велодоріжки (км):</span>
                    <strong>{filterData.transport?.bikeLanes?.toFixed(1) || 'н/д'}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Паркувальні місця:</span>
                    <strong>{formatNumber(filterData.transport?.parkingSpots)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Середня відстань до зупинки (м):</span>
                    <strong>{formatNumber(filterData.transport?.averageDistance)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Частота транспорту:</span>
                    <strong>{getFrequencyText(filterData.transport?.frequency)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Загальний рейтинг:</span>
                    <strong>{filterData.transport?.rating?.toFixed(1) || 'н/д'}/10</strong>
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
                  <div className={`${styles.cardRating} ${getRatingColor(filterData.safety?.rating)}`}>
                    {filterData.safety?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Рівень злочинності:</span>
                    <strong className={`${getCrimeLevelClass(filterData.safety?.crimeLevel)}`}>
                      {getCrimeLevelText(filterData.safety?.crimeLevel)}
                    </strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Відділки поліції:</span>
                    <strong>{formatNumber(filterData.safety?.policeStations)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Камери відеоспостереження:</span>
                    <strong>{formatNumber(filterData.safety?.cctv)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Рейтинг вуличного освітлення:</span>
                    <strong>{filterData.safety?.streetLighting?.toFixed(1) || 'н/д'}/10</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Загальний рейтинг:</span>
                    <strong>{filterData.safety?.rating?.toFixed(1) || 'н/д'}/10</strong>
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
                  <div className={`${styles.cardRating} ${getRatingColor(filterData.social?.rating)}`}>
                    {filterData.social?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Парки:</span>
                    <strong>{formatNumber(filterData.social?.parks)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Середній розмір парку (м²):</span>
                    <strong>{formatNumber(filterData.social?.averageParkSize)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Дитячі майданчики:</span>
                    <strong>{formatNumber(filterData.social?.playgrounds)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Спортивні споруди:</span>
                    <strong>{formatNumber(filterData.social?.sportsFacilities)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Кафе та ресторани:</span>
                    <strong>{formatNumber(filterData.social?.cafesRestaurants)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Бібліотеки:</span>
                    <strong>{formatNumber(filterData.social?.libraries)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Кінотеатри:</span>
                    <strong>{formatNumber(filterData.social?.cinemas)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Театри:</span>
                    <strong>{formatNumber(filterData.social?.theaters)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Музеї:</span>
                    <strong>{formatNumber(filterData.social?.museums)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Загальний рейтинг:</span>
                    <strong>{filterData.social?.rating?.toFixed(1) || 'н/д'}/10</strong>
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
                  <div className={`${styles.cardRating} ${getRatingColor(filterData.commerce?.rating)}`}>
                    {filterData.commerce?.rating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Продуктові магазини:</span>
                    <strong>{formatNumber(filterData.commerce?.groceryStores)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Будівельні магазини:</span>
                    <strong>{formatNumber(filterData.commerce?.constructionStores)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Одяг та взуття:</span>
                    <strong>{formatNumber(filterData.commerce?.clothingStores)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Торгові центри:</span>
                    <strong>{formatNumber(filterData.commerce?.shoppingMalls)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Банки та банкомати:</span>
                    <strong>{formatNumber(filterData.commerce?.banksATMs)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Поштові відділення:</span>
                    <strong>{formatNumber(filterData.commerce?.postOffices)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Салони краси:</span>
                    <strong>{formatNumber(filterData.commerce?.beautySalons)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Щільність магазинів:</span>
                    <strong>{getDensityText(filterData.commerce?.density)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Загальний рейтинг:</span>
                    <strong>{filterData.commerce?.rating?.toFixed(1) || 'н/д'}/10</strong>
                  </div>
                </div>
              </div>

              {/* Комунальні послуги */}
              <div className={styles.statCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardIcon}>⚡</span>
                    <h3>Комунальні послуги</h3>
                  </div>
                  <div className={`${styles.cardRating} ${getRatingColor(filterData.utilities?.qualityRating)}`}>
                    {filterData.utilities?.qualityRating?.toFixed(1) || 'н/д'}
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.statRow}>
                    <span>Якість послуг:</span>
                    <strong>{filterData.utilities?.qualityRating?.toFixed(1) || 'н/д'}/10</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Вартість за м²:</span>
                    <strong>{formatPrice(filterData.utilities?.costPerSqm)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Водопостачання:</span>
                    <strong>{formatBoolean(filterData.utilities?.hasWaterSupply)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Опалення:</span>
                    <strong>{formatBoolean(filterData.utilities?.hasHeating)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Електрика:</span>
                    <strong>{formatBoolean(filterData.utilities?.hasElectricity)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Газопостачання:</span>
                    <strong>{formatBoolean(filterData.utilities?.hasGasSupply)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Вивіз сміття:</span>
                    <strong>{formatBoolean(filterData.utilities?.hasWasteRemoval)}</strong>
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
          <div className={styles.footerActions}>
            <button 
              className={`${styles.favoriteButtonLarge} ${isFavorite ? styles.favoriteActive : ''}`}
              onClick={handleToggleFavorite}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "#ff4757" : "none"} stroke={isFavorite ? "#ff4757" : "currentColor"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених'}
            </button>
            <button className={styles.closeButtonSecondary} onClick={onClose}>
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}